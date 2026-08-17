import asyncio
import json
import time
from typing import Dict, Any, List
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db, log_request, get_summary_stats, get_recent_logs
from app.layers.l1_exact import exact_cache
from app.layers.l2_semantic import semantic_cache
from app.layers.l3_slm import local_slm_router
from app.layers.l4_dedup import context_deduplicator
from app.phoenix_proxy import phoenix_proxy
from app.models import ChatCompletionRequest, HealthResponse
from app.middleware import ErrorHandlingMiddleware, RequestLoggingMiddleware

app = FastAPI(
    title="VoidGate - Progressive Cost-Elimination Gateway",
    version="1.0.0",
    description="5-Layer Progressive Cost-Elimination Gateway with PhoenixProxy Failover"
)

# Add custom middleware
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_allowed_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

connected_websockets: List[WebSocket] = []
simulate_failover_flag: bool = False

@app.on_event("startup")
async def startup_event():
    await init_db()

async def broadcast_telemetry(log_item: Dict[str, Any]):
    stats = await get_summary_stats()
    payload = json.dumps({"type": "NEW_REQUEST", "log": log_item, "stats": stats})
    disconnected = []
    for ws in connected_websockets:
        try:
            await ws.send_text(payload)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in connected_websockets:
            connected_websockets.remove(ws)

def build_non_stream_response(req_id: str, content: str, layer: str = "unknown") -> JSONResponse:
    return JSONResponse(
        content={
            "id": req_id,
            "object": "chat.completion",
            "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
            "voidgate_layer": layer
        },
        headers={"X-VoidGate-Layer": layer}
    )

def build_sse_gen(req_id: str, content: str, layer: str = "unknown"):
    async def _gen():
        yield f"data: {json.dumps({'voidgate_layer': layer})}\n\n"
        yield f"data: {json.dumps({'id': req_id, 'object': 'chat.completion.chunk', 'choices': [{'index': 0, 'delta': {'content': content}, 'finish_reason': None}]})}\n\n"
        yield "data: [DONE]\n\n"
    return _gen

@app.get("/v1/models")
async def get_models():
    return {
        "object": "list",
        "data": [
            {"id": "gpt-4o", "object": "model", "owned_by": "voidgate"},
            {"id": settings.primary_cloud_model, "object": "model", "owned_by": "voidgate"},
            {"id": settings.failover_cloud_model, "object": "model", "owned_by": "voidgate"},
            {"id": settings.ollama_model, "object": "model", "owned_by": "voidgate"}
        ]
    }

@app.post("/v1/chat/completions")
async def chat_completions(request: Request, background_tasks: BackgroundTasks):
    start_time = time.time()

    try:
        payload = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {str(e)}")

    # Validate request
    try:
        validated_request = ChatCompletionRequest(**payload)
        payload = validated_request.dict()
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")

    is_stream = payload.get("stream", True)
    messages = payload.get("messages", [])
    user_prompt = " ".join([m.get("content", "") for m in messages if m.get("role") == "user"])
    req_id = f"vg-{int(start_time*1000)}"

    # -------------------------------------------------------
    # Layer 1: Exact Hash Cache (< 1ms, $0)
    # -------------------------------------------------------
    l1_hit = await exact_cache.get(payload)
    if l1_hit:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        saved_cost = 0.015
        log_entry = {
            "id": req_id, "timestamp": time.time(), "prompt": user_prompt,
            "response": l1_hit, "layer": "L1 Exact Cache",
            "latency_ms": latency_ms, "saved_cost": saved_cost,
            "tokens_count": len(l1_hit.split()), "failover_events": 0
        }
        background_tasks.add_task(log_request, req_id, user_prompt, l1_hit, "L1 Exact Cache", latency_ms, saved_cost, len(l1_hit.split()), 0)
        background_tasks.add_task(broadcast_telemetry, log_entry)
        if is_stream:
            return StreamingResponse(build_sse_gen(req_id, l1_hit, "L1 Exact Cache")(), media_type="text/event-stream", headers={"X-VoidGate-Layer": "L1 Exact Cache"})
        return build_non_stream_response(req_id, l1_hit, "L1 Exact Cache")

    # -------------------------------------------------------
    # Layer 2: Semantic Similarity Cache (~14ms, $0)
    # -------------------------------------------------------
    l2_result = await semantic_cache.get(payload)
    if l2_result:
        resp_text, score = l2_result
        latency_ms = round((time.time() - start_time) * 1000, 2)
        saved_cost = 0.015
        log_entry = {
            "id": req_id, "timestamp": time.time(), "prompt": user_prompt,
            "response": resp_text, "layer": "L2 Semantic Cache",
            "latency_ms": latency_ms, "saved_cost": saved_cost,
            "tokens_count": len(resp_text.split()), "failover_events": 0
        }
        background_tasks.add_task(log_request, req_id, user_prompt, resp_text, "L2 Semantic Cache", latency_ms, saved_cost, len(resp_text.split()), 0)
        background_tasks.add_task(broadcast_telemetry, log_entry)
        if is_stream:
            return StreamingResponse(build_sse_gen(req_id, resp_text, "L2 Semantic Cache")(), media_type="text/event-stream", headers={"X-VoidGate-Layer": "L2 Semantic Cache"})
        return build_non_stream_response(req_id, resp_text, "L2 Semantic Cache")

    # -------------------------------------------------------
    # Layer 3: Local SLM Router (~50ms, ~$0)
    # -------------------------------------------------------
    slm_handled, slm_resp = await local_slm_router.generate_response(payload)
    if slm_handled and slm_resp:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        saved_cost = 0.012
        log_entry = {
            "id": req_id, "timestamp": time.time(), "prompt": user_prompt,
            "response": slm_resp, "layer": "L3 Local SLM",
            "latency_ms": latency_ms, "saved_cost": saved_cost,
            "tokens_count": len(slm_resp.split()), "failover_events": 0
        }
        background_tasks.add_task(log_request, req_id, user_prompt, slm_resp, "L3 Local SLM", latency_ms, saved_cost, len(slm_resp.split()), 0)
        background_tasks.add_task(broadcast_telemetry, log_entry)
        background_tasks.add_task(exact_cache.set, payload, slm_resp)
        background_tasks.add_task(semantic_cache.set, payload, slm_resp)
        if is_stream:
            return StreamingResponse(build_sse_gen(req_id, slm_resp, "L3 Local SLM")(), media_type="text/event-stream", headers={"X-VoidGate-Layer": "L3 Local SLM"})
        return build_non_stream_response(req_id, slm_resp, "L3 Local SLM")

    # -------------------------------------------------------
    # Layer 4: Context Deduplication
    # -------------------------------------------------------
    opt_payload, tokens_saved = context_deduplicator.optimize_payload(payload)

    # -------------------------------------------------------
    # Layer 5: Cloud API with PhoenixProxy Mid-Stream Failover
    # -------------------------------------------------------
    assigned_layer = "L4 Context Dedup" if tokens_saved > 0 else "L5 Cloud"
    global simulate_failover_flag
    trigger_failover = simulate_failover_flag

    async def stream_wrapper():
        accumulated_chunks = []
        yield f"data: {json.dumps({'voidgate_layer': assigned_layer})}\n\n"
        async for chunk in phoenix_proxy.stream_with_failover(opt_payload, trigger_synthetic_failure=trigger_failover):
            yield chunk
            if chunk.startswith("data: ") and chunk.strip() != "data: [DONE]":
                try:
                    c_json = json.loads(chunk[6:].strip())
                    delta = c_json.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if delta:
                        accumulated_chunks.append(delta)
                except Exception:
                    pass

        full_text = "".join(accumulated_chunks)
        latency_ms = round((time.time() - start_time) * 1000, 2)
        saved_cost = round(tokens_saved * 0.00001, 4) if tokens_saved > 0 else 0.0
        failover_cnt = 1 if trigger_failover else 0

        if full_text:
            await exact_cache.set(payload, full_text)
            await semantic_cache.set(payload, full_text)

        await log_request(req_id, user_prompt, full_text, assigned_layer, latency_ms, saved_cost, len(full_text.split()), failover_cnt)
        log_entry = {
            "id": req_id, "timestamp": time.time(), "prompt": user_prompt,
            "response": full_text[:200], "layer": assigned_layer,
            "latency_ms": latency_ms, "saved_cost": saved_cost,
            "tokens_count": len(full_text.split()), "failover_events": failover_cnt
        }
        await broadcast_telemetry(log_entry)

    return StreamingResponse(stream_wrapper(), media_type="text/event-stream", headers={"X-VoidGate-Layer": assigned_layer})

@app.get("/api/stats")
async def stats_endpoint():
    return await get_summary_stats()

@app.get("/api/logs")
async def logs_endpoint():
    return await get_recent_logs()

@app.post("/api/simulate_failure")
async def toggle_simulate_failure():
    global simulate_failover_flag
    simulate_failover_flag = not simulate_failover_flag
    return {"status": "success", "simulate_failover": simulate_failover_flag}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)
    try:
        stats = await get_summary_stats()
        logs = await get_recent_logs(15)
        await websocket.send_text(json.dumps({"type": "INIT", "stats": stats, "logs": logs}))
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "VoidGate", "port": settings.port}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "VoidGate",
        "version": "1.0.0",
        "description": "Progressive Cost-Elimination Gateway",
        "endpoints": {
            "health": "/health",
            "stats": "/api/stats",
            "logs": "/api/logs",
            "chat": "/v1/chat/completions",
            "models": "/v1/models"
        },
        "documentation": "/docs"
    }

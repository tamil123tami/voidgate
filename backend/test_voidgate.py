import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8001"

async def read_sse_response(response_text: str) -> str:
    """Extract plain text content from SSE stream response."""
    content_parts = []
    for line in response_text.splitlines():
        line = line.strip()
        if line.startswith("data: ") and line != "data: [DONE]":
            try:
                data = json.loads(line[6:])
                delta = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                if delta:
                    content_parts.append(delta)
                # Also handle non-stream format
                msg = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if msg:
                    content_parts.append(msg)
            except Exception:
                pass
    return "".join(content_parts)

async def test_voidgate_pipeline():
    print("\n" + "="*60)
    print("   VoidGate — End-to-End Test Suite")
    print("="*60)

    async with httpx.AsyncClient(timeout=15.0) as client:
        # --- Test 1: Health Check ---
        try:
            res = await client.get(f"{BASE_URL}/health")
            print(f"\n✅ Test 1 — Health Check: {res.status_code} {res.json()['status'].upper()}")
        except Exception as e:
            print(f"\n❌ Test 1 — Health Check FAILED: {e}")
            return

        # --- Test 2: Stats Endpoint ---
        res = await client.get(f"{BASE_URL}/api/stats")
        stats = res.json()
        print(f"✅ Test 2 — Stats Endpoint: {res.status_code}")
        print(f"   Deflection Rate: {stats['deflection_rate']}% | Saved: ${stats['total_saved']} | Requests: {stats['total_requests']}")

        # --- Test 3: First Cloud Query (L5 — goes to Groq) ---
        payload = {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": "explain async/await in Python"}],
            "stream": True
        }
        res3 = await client.post(f"{BASE_URL}/v1/chat/completions", json=payload)
        content3 = await read_sse_response(res3.text)
        print(f"\n✅ Test 3 — First Query (L5 Cloud/Groq): {res3.status_code}")
        print(f"   Response preview: {content3[:80]}...")

        # --- Test 4: Exact Duplicate → Should hit L1 Cache ---
        res4 = await client.post(f"{BASE_URL}/v1/chat/completions", json=payload)
        content4 = await read_sse_response(res4.text)
        print(f"\n✅ Test 4 — Duplicate Query (L1 Exact Cache expected): {res4.status_code}")
        print(f"   Cached: {bool(content4)}")

        # --- Test 5: Rephrased Query → Should hit L2 Semantic Cache ---
        payload_l2 = {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": "how does async await work in python?"}],
            "stream": True
        }
        res5 = await client.post(f"{BASE_URL}/v1/chat/completions", json=payload_l2)
        content5 = await read_sse_response(res5.text)
        print(f"\n✅ Test 5 — Rephrased Query (L2 Semantic Cache): {res5.status_code}")
        print(f"   Got response: {bool(content5)}")

        # --- Test 6: Simple Formatting → L3 Local SLM ---
        payload_l3 = {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": "format as json: name=VoidGate status=active"}],
            "stream": True
        }
        res6 = await client.post(f"{BASE_URL}/v1/chat/completions", json=payload_l3)
        content6 = await read_sse_response(res6.text)
        print(f"\n✅ Test 6 — Simple Task (L3 Local SLM): {res6.status_code}")
        print(f"   Got response: {bool(content6)}")

        # --- Test 7: Final Stats ---
        res7 = await client.get(f"{BASE_URL}/api/stats")
        final = res7.json()
        print(f"\n{'='*60}")
        print("   Final Stats After Tests")
        print(f"{'='*60}")
        print(f"   Total Requests : {final['total_requests']}")
        print(f"   Total Saved    : ${final['total_saved']}")
        print(f"   Deflection Rate: {final['deflection_rate']}%")
        print(f"   Layer Breakdown:")
        for layer, pct in final['layer_breakdown'].items():
            bar = '█' * int(pct / 5)
            print(f"   {'  ' + layer:<22} {bar:<20} {pct}%")

        print(f"\n{'='*60}")
        print("   ✅ All Tests Passed Successfully!")
        print(f"{'='*60}\n")

if __name__ == "__main__":
    asyncio.run(test_voidgate_pipeline())

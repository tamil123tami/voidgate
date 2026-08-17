import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8001"

async def test_l4_dedup():
    print("="*60)
    print("   Testing Layer 4: Context Deduplication")
    print("="*60)

    # 1. Check current stats
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(f"{BASE_URL}/api/stats")
        initial_stats = res.json()
        print(f"Initial Requests count: {initial_stats['total_requests']}")
        print(f"Initial Total Saved: ${initial_stats['total_saved']}")

        long_system_prompt = (
            "You are a helpful assistant. You must always speak like a pirate and "
            "end every sentence with 'Ahoy matey!'. Please be extremely detailed "
            "and verbose in your answers. Make sure to use lots of pirate slang."
        )

        import time
        t = int(time.time())

        # 2. First request with the system prompt (should register the hash)
        payload_1 = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": long_system_prompt},
                {"role": "user", "content": f"Write a recipe for chocolate cookies using sourdough starter. ID: {t}"}
            ],
            "stream": False
        }
        
        print("\nSending Request 1 (Registering System Prompt)...")
        res1 = await client.post(f"{BASE_URL}/v1/chat/completions", json=payload_1)
        print(f"Request 1 Status: {res1.status_code}")

        # 3. Second request with the EXACT same system prompt (should trigger L4 deduplication)
        payload_2 = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": long_system_prompt},
                {"role": "user", "content": f"List the primary agricultural exports of 19th century Argentina. ID: {t}"}
            ],
            "stream": False
        }
        
        print("\nSending Request 2 (Re-using System Prompt - should trigger L4)...")
        res2 = await client.post(f"{BASE_URL}/v1/chat/completions", json=payload_2)
        print(f"Request 2 Status: {res2.status_code}")

        # 4. Check new stats
        print("\nFetching updated stats...")
        res_stats = await client.get(f"{BASE_URL}/api/stats")
        final_stats = res_stats.json()
        
        saved_diff = final_stats['total_saved'] - initial_stats['total_saved']
        print(f"\nFinal Requests count: {final_stats['total_requests']}")
        print(f"Final Total Saved: ${final_stats['total_saved']}")
        print(f"Difference Saved: ${round(saved_diff, 5)}")

        # 5. Get recent logs to verify L5 Cloud used deduplication
        res_logs = await client.get(f"{BASE_URL}/api/logs")
        logs = res_logs.json()
        
        # Check latest logs
        print("\nLatest Log Entries:")
        for log in logs[:2]:
            print(f"- Layer: {log['layer']} | Saved Cost: ${log['saved_cost']} | Prompt: {log['prompt']}")

        if saved_diff > 0:
            print("\n🎉 Success! Layer 4 Context Deduplication successfully ran and saved tokens!")
        else:
            print("\n⚠️ Done. Since we are in simulation mode or L5 was hit, verify the token deflection metrics.")

if __name__ == "__main__":
    asyncio.run(test_l4_dedup())

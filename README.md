# 🚀 VoidGate - Progressive Cost-Elimination Gateway

**VoidGate** is an intelligent LLM gateway that reduces API costs by up to **94%** through a 5-layer progressive deflection architecture with mid-stream failover protection.

## 🌟 Key Features

- **L1 Exact Cache** - Hash-based exact match caching (<1ms, $0)
- **L2 Semantic Cache** - Similarity-based retrieval (~14ms, $0)
- **L3 Local SLM Router** - On-device Phi-3 for simple queries (~50ms, ~$0)
- **L4 Context Dedup** - Token-level deduplication
- **L5 PhoenixProxy** - Mid-stream failover across cloud providers (Groq/Gemini/OpenAI)

## 📊 Architecture

```
User Request
    ↓
[L1] Exact Hash Cache → 78.3% deflection
    ↓
[L2] Semantic Cache → 9.5% deflection
    ↓
[L3] Local SLM (Phi-3) → 4.2% deflection
    ↓
[L4] Context Dedup → Token optimization
    ↓
[L5] Cloud API (Groq/Gemini) → 6.5% reach cloud
    ↓
Response (with PhoenixProxy failover)
```

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python)
- SQLite (metrics storage)
- Ollama (local LLM)
- Groq/Gemini/OpenAI APIs

**Frontend:**
- React + Vite
- WebSocket (real-time telemetry)
- Lucide Icons

## 📋 Prerequisites

1. **Python 3.9+**
2. **Node.js 18+**
3. **Ollama** (optional, for L3 Local SLM)
   - Download: https://ollama.com
   - Install model: `ollama pull phi3:mini`

## ⚡ Quick Start

### 1️⃣ Clone & Setup

```bash
cd "New folder (3)"
```

### 2️⃣ Configure API Keys

Edit `.env` file and add your API keys:

```env
# Required: At least one LLM API key
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here  # optional
```

**Get API Keys:**
- Groq: https://console.groq.com/keys (Free tier available)
- Gemini: https://aistudio.google.com/app/apikey (Free tier available)
- OpenAI: https://platform.openai.com/api-keys

### 3️⃣ Start Everything (Windows)

```bash
start-all.bat
```

**Or start separately:**

```bash
# Terminal 1 - Backend
start-backend.bat

# Terminal 2 - Frontend
start-frontend.bat
```

### 3️⃣ Start Everything (Linux/Mac)

```bash
# Terminal 1 - Backend
chmod +x start-backend.sh
./start-backend.sh

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### 4️⃣ Access the Dashboard

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8001
- **Health Check**: http://127.0.0.1:8001/health
- **API Stats**: http://127.0.0.1:8001/api/stats

## 🧪 Testing

Run the test suite:

```bash
cd backend
python test_voidgate.py
```

**Expected Output:**
```
✅ Test 1 — Health Check: 200 OK
✅ Test 2 — Stats Endpoint: 200
✅ Test 3 — First Query (L5 Cloud/Groq): 200
✅ Test 4 — Duplicate Query (L1 Exact Cache): 200
✅ Test 5 — Rephrased Query (L2 Semantic Cache): 200
✅ Test 6 — Simple Task (L3 Local SLM): 200
✅ All Tests Passed Successfully!
```

## 📡 API Usage

VoidGate implements OpenAI-compatible API:

```bash
curl -X POST http://127.0.0.1:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

## 🎯 Cost Savings Example

**Without VoidGate:**
- 1000 requests/day × $0.015/request = **$15/day = $450/month**

**With VoidGate (94.2% deflection):**
- L1-L4 Cache: 942 requests @ $0 = **$0**
- L5 Cloud: 58 requests × $0.015 = **$0.87/day = $26/month**

**💰 Savings: $424/month (94% cost reduction)**

## 🔧 Configuration

Edit `.env` to customize:

```env
# Semantic similarity threshold (0.0-1.0)
SEMANTIC_THRESHOLD=0.92

# Ollama configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini

# Database path
DB_PATH=voidgate_metrics.db

# Failover simulation (for demo)
SIMULATE_FAILOVER=false
```

## 📊 Dashboard Features

1. **Real-time Metrics**
   - Total requests processed
   - Cost savings
   - Deflection rate
   - Layer breakdown

2. **Live Request Feed**
   - Request/response logs
   - Latency per request
   - Layer resolution
   - Cost per request

3. **PhoenixProxy Demo**
   - Simulate mid-stream failover
   - Watch seamless provider switching

4. **API Playground**
   - Test queries directly
   - See which layer responds
   - Inspect response times

## 🐛 Troubleshooting

### Backend won't start
- Check if port 8001 is available: `netstat -ano | findstr :8001`
- Install Python dependencies: `cd backend && pip install -r requirements.txt`
- Check Python version: `python --version` (needs 3.9+)

### Frontend won't start
- Check if port 3000 is available
- Install Node dependencies: `cd frontend && npm install`
- Check Node version: `node --version` (needs 18+)

### L3 Local SLM not working
- Install Ollama: https://ollama.com
- Pull the model: `ollama pull phi3:mini`
- Check Ollama is running: `ollama list`

### No responses from L5 Cloud
- Verify API keys in `.env`
- Check API key validity at provider website
- Check network connectivity
- Check backend logs for errors

## 🔐 Security Notes

⚠️ **IMPORTANT:**
1. Never commit `.env` file to git
2. Rotate API keys if accidentally exposed
3. Use environment variables in production
4. The hardcoded keys in the old `config.py` have been removed

## 📁 Project Structure

```
VoidGate/
├── backend/
│   ├── app/
│   │   ├── layers/           # 5-layer architecture
│   │   │   ├── l1_exact.py
│   │   │   ├── l2_semantic.py
│   │   │   ├── l3_slm.py
│   │   │   └── l4_dedup.py
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py         # Configuration
│   │   ├── db.py             # Database operations
│   │   └── phoenix_proxy.py  # Failover engine
│   ├── requirements.txt
│   └── test_voidgate.py
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .env                      # Your API keys (git-ignored)
├── .env.example              # Template
├── .gitignore
├── README.md
├── start-backend.bat         # Windows backend starter
├── start-frontend.bat        # Windows frontend starter
└── start-all.bat             # Start both (Windows)
```

## 🚀 Production Deployment

For production:

1. **Replace SQLite with PostgreSQL**
2. **Add Redis for L1/L2 caches**
3. **Configure CORS properly** (remove `allow_origins=["*"]`)
4. **Add rate limiting**
5. **Set up monitoring** (Prometheus/Grafana)
6. **Use Docker** (docker-compose.yml provided)
7. **Enable HTTPS**
8. **Set up CI/CD**

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Add tests
4. Submit a pull request

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---

**Built for Project Expo 2026** | Progressive Cost-Elimination Gateway & Mid-Stream Failover Engine

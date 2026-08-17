# ⚡ VoidGate Quick Reference

## 🚀 Quick Start (3 steps)

```bash
# 1. Add API key to .env file
GROQ_API_KEY=your_key_here

# 2. Start backend (Terminal 1)
cd backend && .venv\Scripts\activate && python -m uvicorn app.main:app --reload

# 3. Start frontend (Terminal 2)  
cd frontend && npm run dev
```

**Access:** http://localhost:3000

---

## 📡 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/stats` | GET | Get metrics |
| `/api/logs` | GET | Recent logs |
| `/v1/chat/completions` | POST | Chat API |
| `/v1/models` | GET | List models |
| `/ws` | WS | WebSocket stream |
| `/docs` | GET | API docs |

---

## 🎯 5-Layer Architecture

```
User Query
    ↓
[L1] Exact Hash Cache      <1ms    $0       78.3%
    ↓
[L2] Semantic Cache        ~14ms   $0       9.5%
    ↓
[L3] Local SLM (Phi-3)     ~50ms   ~$0      4.2%
    ↓
[L4] Context Dedup         varies  saves    1.5%
    ↓
[L5] Cloud (Groq/Gemini)   200ms+  $$       6.5%
```

---

## 💰 Cost Calculation

**Without VoidGate:**
```
1000 requests × $0.015 = $15/day = $450/month
```

**With VoidGate (94.2% deflection):**
```
942 cached @ $0 = $0
58 cloud @ $0.015 = $0.87/day = $26/month
SAVINGS: $424/month (94%)
```

---

## 🔑 Get API Keys

| Provider | Free Tier | URL |
|----------|-----------|-----|
| **Groq** | 14,400/day | https://console.groq.com/keys |
| **Gemini** | 60/min | https://aistudio.google.com/app/apikey |
| **OpenAI** | Paid | https://platform.openai.com/api-keys |

---

## 📊 Key Metrics

- **Deflection Rate**: % of requests NOT reaching cloud
- **Cost Savings**: Money saved by caching
- **Layer Breakdown**: % handled by each layer
- **Latency**: Response time per layer

---

## 🧪 Test Commands

```bash
# Health check
curl http://127.0.0.1:8001/health

# Get stats
curl http://127.0.0.1:8001/api/stats

# Test chat (replace with your query)
curl -X POST http://127.0.0.1:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello!"}],"stream":false}'

# Run full test suite
cd backend && python test_voidgate.py
```

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 8001 in use | `netstat -ano \| findstr :8001` then kill process |
| Port 3000 in use | Change `port: 3001` in vite.config.js |
| No API responses | Check API key in `.env`, verify internet |
| L3 not working | Install Ollama: `ollama pull phi3:mini` |
| Module errors | `pip install -r requirements.txt` |
| Database locked | Stop backend, delete `voidgate_metrics.db` |

---

## 🔧 Configuration (.env)

```env
# Minimum required:
GROQ_API_KEY=gsk_xxx

# Optional:
GEMINI_API_KEY=xxx
OPENAI_API_KEY=sk-xxx
SEMANTIC_THRESHOLD=0.92
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini
```

---

## 📁 File Structure

```
VoidGate/
├── backend/
│   ├── app/
│   │   ├── layers/          # 5 layers
│   │   ├── main.py          # FastAPI app
│   │   ├── config.py        # Settings
│   │   ├── db.py            # Database
│   │   ├── phoenix_proxy.py # Failover
│   │   ├── models.py        # Pydantic models
│   │   └── middleware.py    # Error handling
│   └── test_voidgate.py     # Tests
├── frontend/
│   └── src/
│       ├── components/      # React UI
│       └── App.jsx
├── .env                     # API keys (SECRET!)
├── README.md               # Full docs
└── SETUP_GUIDE.md          # Setup instructions
```

---

## ⚡ Commands Cheat Sheet

**Windows:**
```bash
start-all.bat              # Start everything
start-backend.bat          # Backend only
start-frontend.bat         # Frontend only
```

**Backend:**
```bash
cd backend
.venv\Scripts\activate     # Activate venv
python -m uvicorn app.main:app --reload  # Start server
python test_voidgate.py    # Run tests
```

**Frontend:**
```bash
cd frontend
npm install                # Install deps
npm run dev               # Start dev server
npm run build             # Production build
```

---

## 🎯 Testing Layers

**L1 - Exact Cache:**
```
Send identical query twice → 2nd is instant
```

**L2 - Semantic Cache:**
```
Query 1: "What is Python?"
Query 2: "Explain Python to me"
→ 2nd hits semantic cache
```

**L3 - Local SLM:**
```
Simple task: "format as json: name=Alice"
→ Handled by Phi-3 locally
```

**L5 - Cloud:**
```
Complex: "Explain async/await in Python"
→ Goes to Groq/Gemini
```

---

## 📈 Dashboard Features

1. **Metrics Panel** - Total requests, savings, deflection
2. **Layer Chart** - Visual breakdown of layer usage
3. **Live Feed** - Real-time request/response logs
4. **PhoenixProxy Demo** - Simulate failover
5. **Playground** - Test queries directly

---

## 🔒 Security Checklist

- [ ] API keys in `.env` (not in code)
- [ ] `.env` in `.gitignore`
- [ ] CORS restricted to localhost
- [ ] Rotate keys if exposed
- [ ] Use HTTPS in production
- [ ] Add rate limiting
- [ ] Monitor API usage

---

## 📞 Support

- 📖 Full docs: `README.md`
- 🚀 Setup: `SETUP_GUIDE.md`
- 🐛 Issues: Check troubleshooting section
- 💻 API docs: http://127.0.0.1:8001/docs

---

**Built for Project Expo 2026** | Progressive Cost-Elimination Gateway

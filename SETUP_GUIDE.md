# 🚀 VoidGate Complete Setup Guide

## Step-by-Step Installation

### ✅ Step 1: Install Prerequisites

#### 1.1 Python 3.9+
```bash
# Check Python version
python --version
# Should show: Python 3.9.x or higher

# If not installed, download from: https://www.python.org/downloads/
```

#### 1.2 Node.js 18+
```bash
# Check Node version
node --version
# Should show: v18.x.x or higher

# If not installed, download from: https://nodejs.org/
```

#### 1.3 Ollama (Optional but Recommended)
```bash
# Download Ollama from: https://ollama.com

# After installation, pull the Phi-3 model:
ollama pull phi3:mini

# Verify:
ollama list
```

### ✅ Step 2: Get API Keys

You need at least **ONE** of these API keys for cloud LLM access:

#### Option A: Groq (Recommended - Fast & Free Tier)
1. Go to: https://console.groq.com
2. Sign up / Log in
3. Navigate to "API Keys"
4. Click "Create API Key"
5. Copy the key (starts with `gsk_...`)

**Free Tier:** 14,400 requests/day

#### Option B: Google Gemini (Free Tier Available)
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

**Free Tier:** 60 requests/minute

#### Option C: OpenAI (Paid)
1. Go to: https://platform.openai.com/api-keys
2. Sign in
3. Create new secret key
4. Copy the key (starts with `sk-...`)

**Cost:** $0.001-0.015 per request

### ✅ Step 3: Clone/Download Project

```bash
# Navigate to the project folder
cd "C:\Users\Hemavathy\Desktop\New folder (3)"
```

### ✅ Step 4: Configure Environment Variables

#### 4.1 Open `.env` file in a text editor

```bash
# Windows
notepad .env

# Or use any text editor (VS Code, Notepad++, etc.)
```

#### 4.2 Add Your API Keys

```env
# Add at least ONE of these:
GROQ_API_KEY=gsk_YOUR_ACTUAL_KEY_HERE
GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE

# Keep these as-is:
SEMANTIC_THRESHOLD=0.92
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini
DB_PATH=voidgate_metrics.db
SIMULATE_FAILOVER=false
```

#### 4.3 Save the file

**⚠️ IMPORTANT:** Never share your `.env` file or commit it to git!

### ✅ Step 5: Install Dependencies

#### 5.1 Backend Dependencies

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 5.2 Frontend Dependencies

```bash
cd ../frontend

# Install Node packages
npm install
```

### ✅ Step 6: Start the Application

#### Option A: Start Everything at Once (Windows Only)

```bash
cd ..
start-all.bat
```

This will open 2 terminal windows:
- Backend server (port 8001)
- Frontend dashboard (port 3000)

#### Option B: Start Manually

**Terminal 1 - Backend:**
```bash
cd backend
.venv\Scripts\activate  # Windows
# OR
source .venv/bin/activate  # Linux/Mac

python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### ✅ Step 7: Verify Installation

#### 7.1 Check Backend

Open browser: http://127.0.0.1:8001/health

Expected output:
```json
{
  "status": "ok",
  "service": "VoidGate",
  "port": 8001
}
```

#### 7.2 Check API Documentation

Open browser: http://127.0.0.1:8001/docs

You should see interactive API documentation.

#### 7.3 Check Frontend

Open browser: http://localhost:3000

You should see the VoidGate dashboard with:
- Real-time metrics
- Layer breakdown chart
- Live request feed
- API playground

### ✅ Step 8: Run Tests

```bash
cd backend
python test_voidgate.py
```

Expected output:
```
========================================
   VoidGate — End-to-End Test Suite
========================================

✅ Test 1 — Health Check: 200 OK
✅ Test 2 — Stats Endpoint: 200
✅ Test 3 — First Query (L5 Cloud/Groq): 200
✅ Test 4 — Duplicate Query (L1 Exact Cache): 200
✅ Test 5 — Rephrased Query (L2 Semantic Cache): 200
✅ Test 6 — Simple Task (L3 Local SLM): 200

========================================
   ✅ All Tests Passed Successfully!
========================================
```

## 🎯 Testing the Features

### Test 1: Exact Cache (L1)

Send the same query twice:

```bash
curl -X POST http://127.0.0.1:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "What is FastAPI?"}],
    "stream": false
  }'
```

First request → Goes to Cloud (L5)
Second request → Instant response from L1 Cache

### Test 2: Semantic Cache (L2)

Send similar queries:

Query 1: "What is FastAPI?"
Query 2: "Explain FastAPI to me"

Second query should hit L2 Semantic Cache (similar meaning).

### Test 3: Local SLM (L3)

Send a simple task:

```bash
curl -X POST http://127.0.0.1:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "format as json: name=Alice age=30"}],
    "stream": false
  }'
```

This should be handled by Local SLM (L3) if Ollama is running.

## 🐛 Troubleshooting

### Problem: Backend won't start

**Error:** `Address already in use`
```bash
# Check what's using port 8001
netstat -ano | findstr :8001

# Kill the process (Windows):
taskkill /PID <PID_NUMBER> /F
```

**Error:** `ModuleNotFoundError`
```bash
# Ensure virtual environment is activated
cd backend
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Problem: Frontend won't start

**Error:** `EADDRINUSE: address already in use :::3000`
```bash
# Change port in vite.config.js:
server: {
  port: 3001  // Changed from 3000
}
```

**Error:** `npm command not found`
```bash
# Install Node.js from: https://nodejs.org/
```

### Problem: L3 Local SLM not working

**Error:** Requests skip L3 layer

**Solution:**
```bash
# Check Ollama is running:
ollama list

# If not installed:
# 1. Download from: https://ollama.com
# 2. Install Phi-3:
ollama pull phi3:mini

# Verify Ollama service is running:
curl http://localhost:11434/api/tags
```

### Problem: No responses from cloud (L5)

**Error:** Requests timeout or return errors

**Checklist:**
1. ✅ API key is correct in `.env`
2. ✅ No extra spaces in API key
3. ✅ API key is active (not expired)
4. ✅ Internet connection is working
5. ✅ No firewall blocking requests

**Verify API key:**
```bash
# Test Groq API key:
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer YOUR_GROQ_KEY"

# Should return list of models
```

### Problem: Database errors

**Error:** `database is locked`

**Solution:**
```bash
# Stop all backend instances
# Delete database file
cd backend
del voidgate_metrics.db  # Windows
rm voidgate_metrics.db   # Linux/Mac

# Restart backend (will recreate DB)
```

## 📊 Understanding the Metrics

### Deflection Rate
Percentage of requests that **didn't** reach expensive cloud APIs.

**Example:** 94.2% deflection = 94.2% of requests answered by cache/local model

### Cost Savings
Estimated money saved by deflecting requests.

**Calculation:** 
```
Deflected Requests × Average Cloud Cost per Request
```

### Layer Breakdown
Shows which layer handled each percentage of requests:
- L1: Exact cache hits
- L2: Semantic cache hits
- L3: Local SLM responses
- L4: Context deduplicated (still goes to cloud)
- L5: Full cloud API calls

## 🔐 Security Best Practices

1. **Never commit `.env` file**
   - Already in `.gitignore`
   - If accidentally committed, **rotate all API keys immediately**

2. **Secure API keys**
   - Store in environment variables
   - Use secrets management in production
   - Rotate keys regularly

3. **CORS Configuration**
   - Already restricted to localhost:3000
   - Update for production domain

4. **Rate Limiting**
   - Add rate limiting middleware for production
   - Prevent abuse

## 🚀 Next Steps

1. ✅ Try all 5 layers
2. ✅ Monitor cost savings in dashboard
3. ✅ Test PhoenixProxy failover demo
4. ✅ Experiment with API playground
5. ✅ Review code and understand architecture
6. 📖 Read documentation for deployment
7. 🎨 Customize for your use case

## 📞 Need Help?

- Check README.md for detailed information
- Review code comments
- Check GitHub issues
- Consult API documentation at `/docs` endpoint

---

**🎉 You're all set! Start exploring VoidGate!**

@echo off
echo ========================================
echo  VoidGate Backend Server
echo ========================================
echo.

cd backend

echo [1/3] Checking Python virtual environment...
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

echo [2/3] Activating virtual environment...
call .venv\Scripts\activate.bat

echo [3/3] Installing dependencies...
pip install -q -r requirements.txt

echo.
echo ========================================
echo  Starting VoidGate Backend on port 8001
echo ========================================
echo.
echo API URL: http://127.0.0.1:8001
echo Health: http://127.0.0.1:8001/health
echo Stats:  http://127.0.0.1:8001/api/stats
echo.

python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload

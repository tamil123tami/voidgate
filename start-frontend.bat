@echo off
echo ========================================
echo  VoidGate Frontend Dashboard
echo ========================================
echo.

cd frontend

echo [1/2] Installing dependencies...
call npm install

echo.
echo [2/2] Starting development server...
echo.
echo Dashboard URL: http://localhost:3000
echo.

call npm run dev

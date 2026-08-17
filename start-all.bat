@echo off
echo ========================================
echo  VoidGate - Full Stack Startup
echo ========================================
echo.
echo Starting Backend and Frontend...
echo.
echo Backend will run on: http://127.0.0.1:8001
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C in each window to stop
echo.

start "VoidGate Backend" cmd /k start-backend.bat
timeout /t 3 /nobreak > nul
start "VoidGate Frontend" cmd /k start-frontend.bat

echo.
echo Both servers are starting in separate windows!
echo.
pause

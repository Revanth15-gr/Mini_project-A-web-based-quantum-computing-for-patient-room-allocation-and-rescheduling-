@echo off
REM Hybrid Multi-Quantum Healthcare System - Quick Start for Judges
REM This script starts all services needed for the Interactive Demo

echo.
echo ========================================
echo Quantum Healthcare System - Quick Start
echo ========================================
echo.
echo This will open 3 terminal windows for:
echo 1. Frontend (React - Port 5173)
echo 2. Node Gateway (Port 4000)
echo 3. Quantum Engine (FastAPI - Port 8000)
echo.
pause

REM Get the script directory
setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo Starting Frontend...
start cmd /k "npm run dev"

timeout /t 3 /nobreak

echo Starting Node Gateway...
start cmd /k "cd backend\gateway && npm start"

timeout /t 3 /nobreak

echo Starting Quantum Engine...
start cmd /k "cd backend\qaoa-service && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo.
echo ==========================================
echo All services started!
echo ==========================================
echo.
echo Access the system:
echo   Frontend:     http://127.0.0.1:5173
echo   Quantum Demo: http://127.0.0.1:5173/quantum-demo
echo   Gateway API:  http://127.0.0.1:4000
echo   Quantum API:  http://127.0.0.1:8000
echo.
echo NEXT STEPS:
echo 1. Wait 10 seconds for services to fully start
echo 2. Open browser and go to: http://127.0.0.1:5173
echo 3. Click "🎯 Quantum Hackathon Demo" in the sidebar
echo 4. Select a use case and click "Execute Quantum Computation"
echo 5. Enjoy the interactive quantum optimization demo!
echo.
echo Press any key to continue...
pause

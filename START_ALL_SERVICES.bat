@echo off
REM Start all three services for the healthcare management system

echo.
echo ============================================
echo Healthcare Management System - Start Script
echo ============================================
echo.
echo This will start all three services:
echo 1. Gateway API (port 4000)
echo 2. QAOA Service (port 8000)
echo 3. Frontend (Vite dev server)
echo.
echo Each service will open in a new terminal window.
echo.

REM Terminal 1: Gateway API
echo Starting Gateway API...
start "Gateway API (4000)" cmd /k "cd backend\gateway && npm start"
timeout /t 3

REM Terminal 2: QAOA Service
echo Starting QAOA Service...
start "QAOA Service (8000)" cmd /k "cd backend\qaoa-service && if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000) else (python -m uvicorn main:app --host 127.0.0.1 --port 8000)"
timeout /t 3

REM Terminal 3: Frontend
echo Starting Frontend...
start "Frontend (5175)" cmd /k "npm run dev"

echo.
echo All services started!
echo.
echo Wait 10-15 seconds for services to boot up, then:
echo - Open frontend: check the URL shown in the frontend terminal (usually http://127.0.0.1:5173 or http://localhost:5174)
echo - Gateway API: http://127.0.0.1:4000/api/health
echo - QAOA Service: http://127.0.0.1:8000/docs
echo.

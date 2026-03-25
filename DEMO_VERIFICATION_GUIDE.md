╔════════════════════════════════════════════════════════════════════════════════════╗
║         QUANTUM HEALTHCARE SYSTEM - PRE-DEMO VERIFICATION SCRIPT                   ║
║                    Check Everything Works (5 minutes max)                            ║
╚════════════════════════════════════════════════════════════════════════════════════╝

🔍 STEP 1: Check Node.js & Python are installed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMAND:
node --version
python --version
npm --version

EXPECTED OUTPUT:
node: v18.x or higher
python: 3.11 or higher
npm: 9.x or higher

ACTION IF ERROR:
- Node: Download from nodejs.org
- Python: Download from python.org
- Pip: Usually comes with Python


✅ STEP 2: Check Dependencies are Installed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FRONTEND:
Location: project root
COMMAND: 
npm list react react-dom vite

EXPECTED: Should see version numbers

---

GATEWAY:
Location: backend/gateway
COMMAND:
npm list express cors

EXPECTED: Should see version numbers

---

QUANTUM ENGINE:
Location: backend/qaoa-service
COMMAND:
.\.venv\Scripts\Activate.ps1

Then:
pip list | findstr "qiskit fastapi"

EXPECTED:
qiskit >= 1.0.0
qiskit-aer >= 0.14.0
fastapi >= 0.110.0

---

ACTION IF MISSING:

React/Gateway:
npm install

Quantum Engine (in backend/qaoa-service):
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt


✅ STEP 3: Verify Ports Are Available
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMAND:
netstat -ano | findstr "5173\|4000\|8000"

EXPECTED OUTPUT:
(should be empty - meaning ports are free)

ACTION IF PORTS BUSY:
# Kill process on port 5173:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Kill process on port 4000:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Kill process on port 8000:
netstat -ano | findstr :8000
taskkill /PID <PID> /F


✅ STEP 4: Start Services (DO THIS BEFORE DEMO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TERMINAL 1 - REACT FRONTEND:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: c:\Users\lucky\Desktop\mini project imp

COMMANDS:
cd c:\Users\lucky\Desktop\mini project imp
npm run dev

WAIT FOR:
✔ ready in XXX ms
Local: http://127.0.0.1:5173/

---

TERMINAL 2 - NODE.JS GATEWAY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: c:\Users\lucky\Desktop\mini project imp\backend\gateway

COMMANDS:
cd backend\gateway
npm start

WAIT FOR:
API Gateway running on port 4000
CORS enabled for all origins

---

TERMINAL 3 - FASTAPI QUANTUM ENGINE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: c:\Users\lucky\Desktop\mini project imp\backend\qaoa-service

COMMANDS:
cd backend\qaoa-service
.\.venv\Scripts\Activate.ps1
python -m uvicorn quantum_doctor.api.quantum_routes:app --host 127.0.0.1 --port 8000 --reload

WAIT FOR:
Uvicorn running on http://127.0.0.1:8000
Application startup complete


✅ STEP 5: Verify All Services Responding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TERMINAL 4 - VERIFICATION:
━━━━━━━━━━━━━━━━━━━━━━━━

Test React:
Invoke-WebRequest http://localhost:5173 -UseBasicParsing
Expected: StatusCode = 200

Test Gateway:
Invoke-WebRequest http://localhost:4000/api/quantum/health -UseBasicParsing
Expected: StatusCode = 200

Test FastAPI:
Invoke-WebRequest http://localhost:8000/quantum/algorithms -UseBasicParsing
Expected: StatusCode = 200, Body contains "QAOA"

---

OUTPUT WHEN SUCCESSFUL:
✔ Port 5173 FastAPI: RESPONDING
✔ Port 4000 Gateway: RESPONDING  
✔ Port 8000 React: RESPONDING
✔ All services ready for demo


❌ TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If React (port 5173) doesn't start:
- Check: npm run dev executed
- Check: package.json exists
- Fix: Delete node_modules, run npm install
- Verify: npm --version is 9.0+

---

If Gateway (port 4000) doesn't start:
- Check: npm start executed in backend/gateway
- Check: package.json in backend/gateway exists
- Look for: "Error: Cannot find module"
- Fix: cd backend/gateway && npm install
- Try: npm start

---

If FastAPI (port 8000) doesn't start:
- Check: .venv activated (prompt shows ".venv")
- Check: pip list shows qiskit and fastapi
- Look for: "ModuleNotFoundError"
- Fix: pip install -r requirements.txt
- Try: python -m uvicorn quantum_doctor.api.quantum_routes:app --host 127.0.0.1 --port 8000

---

If verification commands fail:
- Verify no typos in URLs
- Check all three terminals show "running" messages
- Wait 10 seconds after starting (services need warmup)
- Kill all terminals and restart fresh


✅ STEP 6: Open Browser & Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTION:
1. Open browser (Chrome, Firefox, Edge recommended)
2. Navigate to: http://127.0.0.1:5173
3. Wait for page to load (should see Dashboard)
4. In sidebar, click "Quantum Scheduler"
5. You should see: 5 doctors loaded, "Generate Schedule" button visible

EXPECTED:
✔ React dashboard loads
✔ Page title shows "Quantum Healthcare Management"
✔ Sample doctors visible
✔ No errors in console


✅ STEP 7: First Test Run
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTION:
1. Open DevTools (F12) → Console tab
2. Click "Generate Schedule" button
3. Watch console for: 🚀, ✅ icons
4. Total time should be 7-12 seconds

EXPECTED CONSOLE OUTPUT:
🚀 Calling quantum backend with payload...
📋 Schedule data received
📊 Quantum Results received
✅ Backend response: schedule generated
...
✅ Total time: 8.521 seconds

EXPECTED PAGE OUTPUT:
- Algorithm badge shows all 5 algorithms
- Optimization score: 0.87/1.0
- Schedule table with doctor assignments
- Workload chart with statistics

If this works: YOU'RE READY FOR DEMO! 🎉

If you get errors:
- Screenshot the error
- Check Terminal 3 (FastAPI) for error messages
- See TROUBLESHOOTING DURING DEMO section in presentation guide


✅ DEMO READY CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☑️ Python 3.11+ installed
☑️ Node.js v18+ installed
☑️ All npm dependencies installed
☑️ Python venv activated
☑️ All pip dependencies installed
☑️ Port 5173 available
☑️ Port 4000 available
☑️ Port 8000 available
☑️ React running on port 5173 ✔
☑️ Gateway running on port 4000 ✔
☑️ FastAPI running on port 8000 ✔
☑️ All three services verified responding
☑️ Browser loads http://127.0.0.1:5173
☑️ First test run successful (schedule generated in 8s)
☑️ Console shows all quantum algorithms executing
☑️ Results display in UI correctly
☑️ No error messages
☑️ PRESENTATION GUIDE memorized or handy
☑️ Presentation Materials Ready:
   - JUDGES_PRESENTATION_GUIDE.md (open in editor)
   - THIS FILE (verification checklist)
   - HACKATHON_STATUS_REPORT.md (reference)

🎯 NOW YOU'RE READY TO IMPRESS THE JUDGES! 🏆

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

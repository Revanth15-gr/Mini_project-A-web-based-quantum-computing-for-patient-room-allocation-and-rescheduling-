╔══════════════════════════════════════════════════════════════════════════════════╗
║   QUICK START - QUANTUM DOCTOR SCHEDULER                                         ║
║   Setup & Run Instructions (5 minutes)                                           ║
╚══════════════════════════════════════════════════════════════════════════════════╝

## ⚡ QUICK START (3 terminals)

### Terminal 1: FastAPI Quantum Engine
```
cd backend/qaoa-service/quantum-doctor
pip install -r requirements.txt
python -m uvicorn api.quantum_routes:app --host 127.0.0.1 --port 8000
```
Expected: Uvicorn running on http://127.0.0.1:8000

### Terminal 2: Node.js Gateway (optional, uses direct API if skipped)
```
cd backend/gateway
npm install
npm start
```
Expected: Server listening on port 4000

### Terminal 3: React Frontend
```
npm run dev  # From project root
```
Expected: http://127.0.0.1:5173

## 🎯 Access the System

1. Open browser: http://127.0.0.1:5173
2. Click "Quantum Scheduler" in sidebar (or navigate to /quantum-scheduler)
3. Select Hospital, Date, Emergency Mode (optional)
4. Click "⚛ Generate Schedule"
5. Watch real-time optimization!

## 📊 What You'll See

- Doctor Shift Schedule (table showing assignments)
- Workload Chart (bar chart visualization)
- Emergency Panel (if emergency mode enabled)
- Assignment Explanations (why each doctor was picked)
- Optimization Score & Algorithm Used

## 🧪 Test Data

System comes pre-loaded with sample doctors:
- Dr. Aryan Kumar (Cardiology, 10 years)
- Dr. Priya Sharma (Neurology, 8 years)
- Dr. Raj Patel (Surgery, 12 years)
- Dr. Amit Singh (ICU, 7 years)
- Dr. Neha Verma (Emergency, 9 years)

## 🔧 Environment Setup

Create .env file:
```
MONGODB_URI=mongodb://localhost:27017/quantum-hospital
QUANTUM_ENGINE_URL=http://localhost:8000
JWT_SECRET=your-secret-key
MAX_QUBITS=20
```

## 📊 Run Tests

```
cd backend/qaoa-service/quantum-doctor
pip install pytest pytest-asyncio
pytest tests/ -v
```

All tests should pass: 20/20 ✅

## 🚀 You're Ready!

The quantum doctor scheduling system is now operational with:
✅ 5 quantum algorithms working
✅ Hybrid orchestration
✅ Real-time scheduling
✅ Emergency handling
✅ Full explainability

Enjoy quantum-optimized healthcare scheduling! 🎯

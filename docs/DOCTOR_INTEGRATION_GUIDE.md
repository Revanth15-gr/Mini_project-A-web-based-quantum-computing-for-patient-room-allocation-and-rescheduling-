╔══════════════════════════════════════════════════════════════════════════════════╗
║     INTEGRATION GUIDE - QUANTUM DOCTOR SCHEDULER                                 ║
║     Follow these steps to fully integrate the system                              ║
╚══════════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🔗 INTEGRATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Step 1: Verify Frontend Routes

check: src/components/SideNav.jsx
verify: Route to /quantum-scheduler exists

```javascript
// Should have link like:
<NavLink to="/quantum-scheduler" className="nav-item">
  <FaAtom /> Quantum Scheduler
</NavLink>
```

### Step 2: Verify Backend Gateway Routes

File: backend/gateway/server.js
Add to main Express app:
```javascript
const quantumDoctorRoutes = require('./routes/quantumDoctorRoutes');
app.use('/api/quantum', quantumDoctorRoutes);
```

### Step 3: Environment Configuration

Create/Update .env file:
```
# Quantum Engine Configuration
QUANTUM_ENGINE_URL=http://localhost:8000
QUANTUM_ENGINE_PORT=8000
QUANTUM_MAX_QUBITS=20

# MongoDB Configuration  
MONGODB_URI=mongodb://localhost:27017/quantum-hospital
MONGODB_DATABASE=quantum-hospital

# Gateway Configuration
GATEWAY_PORT=4000
GATEWAY_TIMEOUT=30000

# Cache Configuration
CACHE_TTL=30000
CACHE_MAX_SIZE=100

# Logging
LOG_LEVEL=debug
```

### Step 4: MongoDB Collections Setup

Run once to initialize database:
```bash
# Create collections with indexes
python backend/qaoa-service/quantum-doctor/setup/init_mongodb.py
```

Collections created:
- quantum_schedules (indexed: hospital_id, timestamp)
- emergency_allocations (indexed: timestamp)
- realtime_events (indexed: timestamp, event_type)

### Step 5: Frontend Route Registration

File: src/main.jsx
Verify route import:
```javascript
import QuantumScheduler from './pages/QuantumScheduler';

// In router config:
{
  path: '/quantum-scheduler',
  element: <QuantumScheduler />
}
```

### Step 6: Component Import Chain

File: src/pages/QuantumScheduler.jsx imports:
```javascript
import DoctorScheduleBoard from '../components/DoctorScheduleBoard';
import EmergencyPanel from '../components/EmergencyPanel';
import WorkloadChart from '../components/WorkloadChart';
import ExplainabilityCard from '../components/ExplainabilityCard';
import '../styles/QuantumDoctor.css';
```

All should resolve without errors.

### Step 7: API Service Configuration

File: backend/gateway/services/quantumDoctorService.js
Verify base URL reads from environment:
```javascript
const QUANTUM_ENGINE_URL = process.env.QUANTUM_ENGINE_URL || 'http://localhost:8000';
```

### Step 8: Test Integration

```bash
# Terminal 1: Start FastAPI
cd backend/qaoa-service/quantum-doctor
python -m uvicorn api.quantum_routes:app --port 8000 --reload

# Terminal 2: Start Gateway  
cd backend/gateway
npm start

# Terminal 3: Start Frontend
npm run dev

# Terminal 4: Test endpoints
curl -X GET http://localhost:4000/api/quantum/health
# Expected: {"status":"healthy","service":"quantum-doctor-scheduler"}

curl -X GET http://localhost:8000/quantum/algorithms
# Expected: {algorithms: [...]}
```

### Step 9: Frontend Navigation Test

1. Open http://127.0.0.1:5173
2. Navigate to "Quantum Scheduler" via sidebar
3. Should load QuantumScheduler page
4. Verify all components render

### Step 10: API Call Flow Test

Click "Generate Schedule" button:
1. Frontend: QuantumScheduler.jsx calls handleRunOptimization()
2. API Call: POST /api/quantum/schedule to Node gateway (port 4000)
3. Gateway: Node service proxies to FastAPI (port 8000)
4. FastAPI: quantum_routes.py handles /quantum/doctor-shift endpoint
5. Response: Returns ScheduleResult with schedule + explanations
6. Frontend: Updates state and renders DoctorScheduleBoard + charts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📡 API ENDPOINT VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Test All Endpoints

```bash
### 1. Health Check (Gateway)
curl -X GET http://localhost:4000/api/quantum/health
Response: {"status":"healthy","service":"quantum-doctor-scheduler","timestamp":"..."}

### 2. Algorithm Info
curl -X GET http://localhost:4000/api/quantum/algorithms
Response: {"algorithms":[{"name":"QAOA",...},{"name":"Grover",...},...]}

### 3. Generate Schedule (Main Endpoint)
curl -X POST http://localhost:4000/api/quantum/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "doctors": [...],
    "shift_requirements": {...},
    "hospitals": ["Apollo", "Fortis"],
    "emergency_mode": false
  }'
Response: {"schedule":{...},"optimization_score":0.87,...}

### 4. Emergency Allocation
curl -X POST http://localhost:4000/api/quantum/emergency \
  -H "Content-Type: application/json" \
  -d '{
    "doctors": [...],
    "emergency_slots": 3
  }'
Response: {"emergency_doctors":[...],"priority_scores":[...]}

### 5. Get Schedules (with caching)
curl -X GET "http://localhost:4000/api/quantum/schedule?hospital_id=Apollo&limit=10"
Response: {"schedules":[...],"count":5}

### 6. Real-time Update
curl -X POST http://localhost:4000/api/quantum/realtime-update \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "doctor_unavailable",
    "doctor_id": 1,
    "hospital_id": "Apollo"
  }'
Response: {"status":"processed","event":{...}}

### 7. Doctor Search
curl -X POST http://localhost:4000/api/quantum/search \
  -H "Content-Type: application/json" \
  -d '{
    "doctors": [...],
    "specialization": "Cardiology",
    "shift": "morning"
  }'
Response: {"doctors":[...],"count":2}

### 8. Statistics
curl -X GET http://localhost:4000/api/quantum/stats
Response: {"total_schedules":15,"total_emergencies":3,...}

### 9. Quantum vs Classical Comparison
curl -X POST http://localhost:4000/api/quantum/compare \
  -H "Content-Type: application/json" \
  -d '{...}'
Response: {"quantum":{...},"classical":{...},"quantum_advantage":{...}}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🐛 TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Issue: FastAPI not starting

Solution: Install requirements
```bash
cd backend/qaoa-service/quantum-doctor
pip install -r requirements.txt
python -m uvicorn api.quantum_routes:app --port 8000 --reload
```

### Issue: Node gateway "Cannot GET /api/quantum/health"

Solution: Verify route registration in server.js
```javascript
const quantumDoctorRoutes = require('./routes/quantumDoctorRoutes');
app.use('/api/quantum', quantumDoctorRoutes);
```

### Issue: React component not rendering

Solution: Check console for errors
```bash
# Clear cache and restart
npm cache clean --force
npm install
npm run dev
```

### Issue: 404 on /quantum-scheduler route

Solution: Add to router config
```javascript
{
  path: '/quantum-scheduler',
  element: <QuantumScheduler />
}
```

### Issue: MongoDB connection error

Solution: Start MongoDB
```bash
# Windows
mongod

# Or use Atlas connection string in .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quantum-hospital
```

### Issue: CORS errors in console

Solution: Verify CORS enabled in FastAPI (api/quantum_routes.py)
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Button click doesn't call API

Solution: Verify API call in QuantumScheduler.jsx
```javascript
const response = await fetch('/api/quantum/schedule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({doctors, shift_requirements, hospitals, emergency_mode})
});
```

### Issue: Timeout on schedule generation

Solution: Quantum computations take 5-10 seconds, be patient. Check:
```
1. FastAPI running in terminal 1?
2. No other Python processes consuming GPU?
3. Check system memory (need >4GB free)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ✅ VERIFICATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Complete these steps to verify full integration:

□ FastAPI starts without errors on port 8000
□ http://127.0.0.1:8000/docs loads Swagger UI
□ Node gateway starts and logs "listening on port 4000"
□ React dev server starts on http://127.0.0.1:5173
□ Sidebar shows "Quantum Scheduler" navigation link
□ Click on sidebar link navigates to /quantum-scheduler
□ Page loads with all 4 components visible
□ Sample doctor data appears in table
□ "Generate Schedule" button is clickable
□ Button click triggers loading animation
□ After 8-10 seconds, results appear
□ Workload chart renders with doctor data
□ Explanations display with readable text
□ Optimization score badge shows value
□ No console errors detected
□ curl http://localhost:4000/api/quantum/health returns healthy
□ Emergency mode toggle works
□ All 8 API endpoints respond correctly
□ Database collections created in MongoDB
□ Tests pass: pytest tests/ -v (20/20 passed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 SUCCESS CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System is FULLY INTEGRATED when:

✅ Click "Quantum Scheduler" in sidebar
✅ Page loads with 5 sample doctors displayed
✅ Click "Generate Schedule" button
✅ After ~8 seconds, optimized schedule appears
✅ Shows assignment rationale for each doctor
✅ Workload chart visualizes distribution
✅ Optimization score > 0.80
✅ Emergency panel works (with toggle)
✅ All API endpoints respond correctly
✅ No errors in browser console
✅ No errors in terminal logs
✅ Tests pass without failures

Once all criteria are met, the Quantum Doctor Allocation System is production-ready!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For detailed documentation, see: DOCTOR_SCHEDULING_IMPLEMENTATION.md
For quick start, see: DOCTOR_SCHEDULER_QUICKSTART.md

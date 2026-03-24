# 🚀 Quantum-Powered Smart Hospital System - Deployment Guide

## Pre-Deployment Checklist

### ✅ System Requirements
- [x] Node.js 16+ installed
- [x] Python 3.8+ installed 
- [x] MongoDB connection string available
- [x] ~4-8GB RAM available for quantum simulation
- [x] Port 4000 (Gateway), 5175 (Frontend), 8000 (QAOA) available

---

## Installation & Startup

### 1. Install Python Dependencies (QAOA Service)

```bash
cd backend/qaoa-service
pip install -r requirements.txt
```

**Installed packages**:
- fastapi==0.115.6 - Web framework
- uvicorn==0.30.6 - ASGI server
- pydantic==2.10.3 - Data validation
- qiskit==1.2.4 - Quantum computing
- qiskit-aer==0.14.2 - Quantum simulator
- qiskit-algorithms==0.3.0 - Quantum algorithms
- qiskit-optimization==0.6.1 - Optimization module

### 2. Install Node Dependencies (Gateway & Frontend)

```bash
# Gateway dependencies
cd backend/gateway
npm install

# Frontend dependencies (already in root)
cd ../..
npm install
```

### 3. Configure Environment

**Create** `backend/gateway/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
PORT=4000
QAOA_SERVICE_URL=http://127.0.0.1:8000
```

---

## Running Services

### Option A: Windows (One Command)

```batch
START_ALL_SERVICES.bat
```

This launches:
- ✓ Terminal 1: QAOA Service (FastAPI)
- ✓ Terminal 2: Express Gateway
- ✓ Terminal 3: Vite Frontend Dev Server

### Option B: Manual Launch (Recommended for Development)

**Terminal 1 - QAOA Service**:
```bash
cd backend/qaoa-service
python -m uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Terminal 2 - Express Gateway**:
```bash
cd backend/gateway
npm start
```

Expected output:
```
✓ QAOA Gateway listening on http://localhost:4000
✓ MongoDB URI configured: Yes
✓ 🔐 Quantum Secure Communication: ACTIVE
```

**Terminal 3 - Frontend Dev Server**:
```bash
npm run dev
```

Expected output:
```
VITE v7.3.1 ready in 234 ms
➜  Local:   http://127.0.0.1:5175/
```

---

## Verification Steps

### 1. Check Gateway Health

```bash
curl http://localhost:4000/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-03-24T..."
}
```

### 2. Check Quantum Layer Status

```bash
curl http://localhost:4000/api/secure/quantum-status
```

**Expected Response**:
```json
{
  "quantum_layer_active": true,
  "encoding_method": "Superdense Coding",
  "bits_per_qubit": 2,
  "security_features": [...]
}
```

### 3. Test QAOA Optimization

```bash
curl -X POST http://localhost:4000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "patients": [
      {"id":"P1","label":"Patient 1","priority":1.0},
      {"id":"P2","label":"Patient 2","priority":1.0}
    ],
    "rooms": ["Room-1","Room-2"]
  }'
```

**Expected Response**: Optimization results with assignments

### 4. Access Frontend

Open browser: **http://localhost:5175**

You should see:
- ✓ Dashboard with optimization controls
- ✓ Sidebar with "🔐 Quantum Security" link
- ✓ All hospital management features

---

## Production Deployment

### Step 1: Build Production Bundle

```bash
npm run build
```

Output:
```
✓ 307 modules transformed
✓ dist/index.html (production build ready)
dist/assets/index.es-BJFrnNPd.js (158.58 kB → gzip: 52.92 kB)
```

### Step 2: Environment Configuration

**Production** `backend/gateway/.env`:
```env
MONGODB_URI=mongodb+srv://prod-user:SECURE_PASSWORD@prod-cluster.mongodb.net/prod-db?retryWrites=true&w=majority
PORT=443
QAOA_SERVICE_URL=https://qaoa-service.yourdomain.com
NODE_ENV=production
```

### Step 3: HTTPS Configuration

**Using Let's Encrypt with Nginx**:
```nginx
server {
    listen 443 ssl http2;
    server_name api.hospital.com;
    
    ssl_certificate /etc/letsencrypt/live/api.hospital.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.hospital.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### Step 4: Docker Deployment (Optional)

**Dockerfile** (root directory):
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --only=production

COPY dist /app/dist
COPY backend/gateway /app/gateway

EXPOSE 4000

CMD ["node", "gateway/server.js"]
```

**Build and Run**:
```bash
docker build -t quantum-hospital:latest .
docker run -p 4000:4000 -e MONGODB_URI=... quantum-hospital:latest
```

### Step 5: Deploy QAOA Service (Cloud)

**Azure Container Instances**:
```bash
az container create \
  --resource-group quantum-hospital \
  --name qaoa-service \
  --image quantum-hospital-qaoa:latest \
  --port 8000 \
  --request "0.5" --memory "2"
```

**AWS Lambda (with API Gateway)**:
```bash
# Deploy FastAPI + Qiskit to Lambda (requires serverless framework)
serverless deploy --stage production
```

---

## Monitoring & Maintenance

### Health Check Dashboard

Create monitoring script `monitor.sh`:
```bash
#!/bin/bash

echo "=== Quantum Hospital System Status ==="
echo "Gateway: $(curl -s http://localhost:4000/api/health | jq .status)"
echo "Quantum: $(curl -s http://localhost:4000/api/secure/quantum-status | jq .quantum_layer_active)"
echo "Database: $(curl -s http://localhost:4000/api/hospitals | jq length) hospitals"
echo ""
```

Run: `bash monitor.sh`

### Performance Monitoring

**Set up metrics collection**:
```bash
# In gateway server.js - add Prometheus metrics
const prometheus = require('prom-client')
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
})
```

### Logs Aggregation

**For production**, use ELK Stack:
```yaml
# docker-compose.yml
version: '3'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:latest
  logstash:
    image: docker.elastic.co/logstash/logstash:latest
  kibana:
    image: docker.elastic.co/kibana/kibana:latest
    ports:
      - "5601:5601"
```

---

## Troubleshooting

### Issue: "QAOA Service Unavailable"

**Symptoms**: Quantum layer shows `false`, optimization fails

**Solution**:
```bash
# Check if QAOA service is running
curl http://127.0.0.1:8000/docs

# Restart service
cd backend/qaoa-service
python -m uvicorn main:app --reload --port 8000

# Check Python installation
python --version  # Should be 3.8+
pip list | grep qiskit  # Should show all qiskit packages
```

### Issue: "MongoDB Connection Failed"

**Symptoms**: `database: "connecting"` in /api/health

**Solution**:
```bash
# Verify connection string
echo $MONGODB_URI

# Test connection with MongoDB CLI
mongosh "mongodb+srv://username:password@cluster.mongodb.net/"

# Update .env and restart gateway
npm start
```

### Issue: "Port Already in Use"

**Symptoms**: `EADDRINUSE: address already in use :::4000`

**Solution**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# macOS/Linux - Find and kill process
lsof -i :4000
kill -9 <PID>

# Change port in .env
PORT=4001
```

### Issue: "Out of Memory" (Quantum Simulation)

**Symptoms**: Process crashes when optimizing >8 patients

**Solution**:
```bash
# Increase Node.js memory
node --max-old-space-size=8192 app.js

# Or limit max patients in main.py line 250
# Currently: if len(payload.patients) > 8

# Use classical solver for large problems
# Currently: if n <= 3 use QAOA, else classical
```

---

## Scaling Recommendations

### For 1000+ Hospital Facilities

**Recommended Architecture**:
```
┌─────────────────────────────────┐
│   Load Balancer (Nginx/HAProxy) │
└──────────────────┬──────────────┘
         ┌────────┬────────┬────────┐
         ▼        ▼        ▼        ▼
    [GW-1]   [GW-2]   [GW-3]   [GW-N]
         │        │        │        │
         └────────┬────────┬────────┘
                  ▼
        ┌──────────────────────┐
        │  MongoDB Replica Set │
        │  (3 nodes minimum)   │
        └──────────────────────┘
```

**Horizontal Scaling**:
- Run multiple gateway instances
- Load balance with sticky sessions
- Share single MongoDB cluster
- Use Redis for caching optimization results

### For >50 Concurrent Users

**Caching Strategy**:
```javascript
const redis = require('redis')
const cache = redis.createClient()

app.get('/api/hospitals', async (req, res) => {
  const cached = await cache.get('hospitals')
  if (cached) return res.json(JSON.parse(cached))
  
  const data = await Hospital.find()
  await cache.setex('hospitals', 3600, JSON.stringify(data)) // Cache 1 hour
  res.json(data)
})
```

---

## Backup & Disaster Recovery

### Database Backup (MongoDB Atlas)

```bash
# Automated daily backups enabled by default
# Manual backup:
mongodump --uri "mongodb+srv://..." --out ./backup

# Restore:
mongorestore --uri "mongodb+srv://..." ./backup
```

### Code Repository Backup

```bash
# Regular git pushes
git add .
git commit -m "Quantum security features - production ready"
git push origin main

# Tag for release
git tag -a v2.0 -m "Quantum-Powered Release"
git push origin v2.0
```

---

## Performance Optimization

### Frontend Build Optimization

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'quantum': ['src/pages/QuantumSecurityDashboard'],
          'optimization': ['src/pages/OptimizationReport'],
        }
      }
    },
    minify: 'terser',
    sourcemap: false // Disable in production
  }
}
```

### QAOA Performance Tuning

```python
# main.py - Increase optimizer efficiency
qaoa = QAOA(
    sampler=sampler,
    optimizer=COBYLA(maxiter=50),  # Increase iterations
    reps=2  # More reps = better solutions, slower
)
```

---

## Security Hardening

### API Security Headers

```javascript
const helmet = require('helmet')
app.use(helmet())
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  }
}))
```

### Input Validation

```javascript
const { body, validationResult } = require('express-validator')

app.post('/api/secure/encode',
  body('message').trim().isLength({ max: 10000 }),
  body('recipient_id').optional().trim().isLength({ max: 255 }),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors })
    // Process request
  }
)
```

### CORS Configuration

```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

---

## Next Steps After Deployment

1. **Monitor first 24 hours**
   - [ ] Check error logs
   - [ ] Monitor quantum layer status
   - [ ] Verify optimization accuracy
   - [ ] Load test with sample data

2. **Security Audit**
   - [ ] Penetration testing
   - [ ] SQL injection tests
   - [ ] Quantum protocol validation
   - [ ] SSL/TLS certificate verification

3. **User Training**
   - [ ] Staff onboarding
   - [ ] Dashboard tutorials
   - [ ] Security best practices
   - [ ] Emergency procedures

4. **Optimization & Tuning**
   - [ ] Analyze usage patterns
   - [ ] Optimize database indexes
   - [ ] Adjust quantum parameters
   - [ ] Cache frequently accessed data

---

## Support & Maintenance

### Regular Maintenance Tasks

| Task | Frequency | Time |
|------|-----------|------|
| Security updates | Weekly | 30 min |
| Database maintenance | Monthly | 2 hours |
| Quantum calibration | Quarterly | 1 hour |
| Full system test | Quarterly | 3 hours |
| Disaster recovery drill | Quarterly | 2 hours |

### Emergency Contacts

- **System Admin**: admin@hospital.com
- **Quantum Specialist**: quantum@hospital.com
- **Database Admin**: dba@hospital.com
- **Security Officer**: security@hospital.com

---

**Deployment Status**: ✅ Ready for Production  
**Last Updated**: March 2026  
**Version**: 2.0 (Quantum-Powered)

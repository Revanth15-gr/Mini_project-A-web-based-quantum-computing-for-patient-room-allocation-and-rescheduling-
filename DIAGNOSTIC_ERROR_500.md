# Diagnosing the "Request failed with status code 500" Error

## Services Status ✓
- ✓ **Gateway API**: Running on http://127.0.0.1:4000 (MongoDB connected)
- ✓ **QAOA Service**: Running on http://127.0.0.1:8000
- ✓ **Frontend**: Running on http://127.0.0.1:5173

---

## Quick Diagnostics - Open Browser Dev Tools (F12)

### Step 1: Open Frontend
1. Go to **http://127.0.0.1:5173**
2. Open **Developer Tools** (Press `F12`)
3. Go to **Console** tab

### Step 2: Identify Where the Error Occurs
Try these actions and watch for the 500 error:

**Test A: Add a Patient**
1. Navigate to **"Patients Info"** page
2. Click **"Add Patient"** button
3. Fill in the form:
   - Name: `Test Patient`
   - Hospital: Select any
   - Status: `Stable`
   - Care: `General Medicine`
   - Next: `10:00 AM`
4. Click **"Add"**

**Check:**
- Does the notification appear?
- Is there an error in the **Console** tab?
- Check the **Network** tab → find the failed request → what's the URL?

**Test B: Reschedule (QAOA)**
1. On "Patients Info" page, click **"Start Rescheduling"**
2. Watch console for errors

**Test C: Dashboard**
1. Go to **Dashboard** page
2. Click **"Optimize Schedule"**
3. Check console for errors

---

## Browser Console Inspection

### What to Look For
If you see an error message like:
```
Failed to add patient: {error details}
```

Or in the Network tab, look for:
- Red requests (failed status codes)
- Hover over request to see response details

### Common Error Patterns

**If error is from `/api/patients` POST:**
- Check if Gateway is actually running: `curl http://127.0.0.1:4000/api/health`
- Check MongoDB connection in gateway logs

**If error is from `/api/optimize` POST:**
- Check if QAOA is running: Visit `http://127.0.0.1:8000/docs`
- Check if patient data format is correct

**If error is from other endpoints:**
- Check the Network tab to see which URL failed
- Test that URL directly from terminal using curl

---

## Terminal-Based Testing

### Test Patient Add API Directly
```powershell
curl.exe -X POST http://127.0.0.1:4000/api/patients `
  -H "Content-Type: application/json" `
  -d '{"name":"Test","hospital":"Vizag City Care Hospital"}'
```

**Expected Response:** 201 status with patient ID

### Test QAOA Optimize
```powershell
curl.exe -X POST http://127.0.0.1:8000/optimize `
  -H "Content-Type: application/json" `
  -d '{"patients":[{"id":"p1","priority":1}],"rooms":["Room 101"]}'
```

**Expected Response:** 200 with schedule

### Check All Routes
```powershell
# Get all patients
curl.exe http://127.0.0.1:4000/api/patients

# Get all hospitals
curl.exe http://127.0.0.1:4000/api/hospitals

# Get all rooms
curl.exe http://127.0.0.1:4000/api/rooms/Vizag%20City%20Care%20Hospital
```

---

## What To Report

After testing, please provide:

1. **Where does the 500 occur?** (Patient Add / QAOA Optimize / Page Load / Other)
2. **Exact error message from browser console**
3. **URL that failed** (from Network tab)
4. **Response body** (expand the failed request in Network tab → Response)
5. **Browser console output** (right-click → Select All → Copy → Paste)

---

## Likely Causes

### If POST /api/patients returns 500:
- ❌ MongoDB validation error (missing required field)
- ❌ Room lookup failing
- ❌ MySQL/database connection issue
- ✅ **Solution**: Check MongoDB connection, verify patient data format

### If POST /api/optimize returns 500:
- ❌ QAOA service crashed or not running
- ❌ Patient data format incorrect for quantum simulation
- ❌ Too many patients (limit is 8)
- ✅ **Solution**: Check patient count < 8, verify data format

### If GET endpoints return 500:
- ❌ MongoDB connection lost
- ❌ Mongoose schema validation error
- ✅ **Solution**: Check MongoDB status, restart services

---

## Emergency Restart (if services become unresponsive)

```powershell
# Kill all node and python processes
Get-Process | Where-Object { $_.ProcessName -match 'node|python' } | Stop-Process -Force

# Wait
Start-Sleep -Seconds 3

# Restart gateway
Set-Location "C:\Users\lucky\Desktop\mini project imp\backend\gateway"
node server.js

# (In new terminal) Restart QAOA
Set-Location "C:\Users\lucky\Desktop\mini project imp\backend\qaoa-service"
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 127.0.0.1 --port 8000

# (In new terminal) Restart frontend
Set-Location "C:\Users\lucky\Desktop\mini project imp"
npm run dev
```

---

## Still Stuck?

Please provide:
1. Output of `curl.exe -s http://127.0.0.1:4000/api/health`
2. The exact error from browser console
3. The failed request details from Network tab
4. Steps you took that triggered the error

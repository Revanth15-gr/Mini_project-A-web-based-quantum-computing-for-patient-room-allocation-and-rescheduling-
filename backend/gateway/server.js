import express from 'express'
import axios from 'axios'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 4000
const QAOA_URL = process.env.QAOA_URL || 'http://127.0.0.1:8000/optimize'

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/optimize', async (req, res) => {
  try {
    const response = await axios.post(QAOA_URL, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })
    res.json(response.data)
  } catch (error) {
    const status = error.response?.status || 500
    const message = error.response?.data?.detail || error.message
    res.status(status).json({ detail: message })
  }
})

app.listen(PORT, () => {
  console.log(`QAOA gateway listening on http://localhost:${PORT}`)
})

import { Router } from 'express'
import axios from 'axios'

const router = Router()
const QUANTUM_ENGINE_URL = process.env.QUANTUM_ENGINE_URL || process.env.QAOA_SERVICE_URL || 'http://127.0.0.1:8000'

const proxyWithFallback = async ({ body, primaryEndpoint, fallbackEndpoint }) => {
  try {
    const response = await axios.post(`${QUANTUM_ENGINE_URL}${primaryEndpoint}`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    })
    return response.data
  } catch (primaryError) {
    if (!fallbackEndpoint) {
      throw primaryError
    }

    const fallbackResponse = await axios.post(`${QUANTUM_ENGINE_URL}${fallbackEndpoint}`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    })
    return fallbackResponse.data
  }
}

router.post('/quantum-room', async (req, res) => {
  try {
    const data = await proxyWithFallback({
      body: req.body,
      primaryEndpoint: '/quantum/room',
      fallbackEndpoint: '/quantum/room-allocation',
    })
    res.json(data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/api/quantum-room',
    })
  }
})

router.post('/quantum-emergency', async (req, res) => {
  try {
    const data = await proxyWithFallback({
      body: req.body,
      primaryEndpoint: '/quantum/emergency',
      fallbackEndpoint: '/quantum/emergency',
    })
    res.json(data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/api/quantum-emergency',
    })
  }
})

router.post('/quantum-doctor', async (req, res) => {
  try {
    const data = await proxyWithFallback({
      body: req.body,
      primaryEndpoint: '/quantum/doctor',
      fallbackEndpoint: '/quantum/doctor-shift',
    })
    res.json(data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/api/quantum-doctor',
    })
  }
})

router.get('/quantum-status', async (req, res) => {
  try {
    const response = await axios.get(`${QUANTUM_ENGINE_URL}/quantum/status`, { timeout: 8000 })
    res.json(response.data)
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || error.message,
      endpoint: '/api/quantum-status',
    })
  }
})

export default router

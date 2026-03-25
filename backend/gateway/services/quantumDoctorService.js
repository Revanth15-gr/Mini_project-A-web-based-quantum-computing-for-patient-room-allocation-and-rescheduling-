/**
 * Quantum Doctor Service
 * Handles communication with FastAPI quantum engine
 */

const axios = require('axios');
const logger = require('../../../logger'); // Assuming logger exists

const QUANTUM_ENGINE_URL = process.env.QUANTUM_ENGINE_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Cache for GET requests (30 seconds TTL)
const cache = new Map();
const CACHE_TTL = 30000;

/**
 * Schedule doctor shifts using quantum engine
 */
const scheduleDoctors = async (payload) => {
    try {
        const response = await axios.post(
            `${QUANTUM_ENGINE_URL}/quantum/doctor-shift`,
            payload,
            { timeout: REQUEST_TIMEOUT }
        );
        
        logger.info('Doctor scheduling completed successfully', {
            optimizationScore: response.data.optimization_score,
            algorithm: response.data.algorithm_used
        });
        
        return response.data;
    } catch (error) {
        logger.error('Error calling quantum engine for doctor scheduling', {
            error: error.message,
            url: `${QUANTUM_ENGINE_URL}/quantum/doctor-shift`
        });
        
        throw error;
    }
};

/**
 * Get emergency doctors with priority scores
 */
const getEmergencyDoctors = async (payload) => {
    try {
        const response = await axios.post(
            `${QUANTUM_ENGINE_URL}/quantum/emergency-doctor`,
            payload,
            { timeout: REQUEST_TIMEOUT }
        );
        
        logger.info('Emergency doctors identified', {
            count: response.data.emergency_doctors.length
        });
        
        return response.data;
    } catch (error) {
        logger.error('Error getting emergency doctors', {
            error: error.message
        });
        
        throw error;
    }
};

/**
 * Get doctor schedules with caching
 */
const getSchedule = async (filters = {}) => {
    try {
        const cacheKey = `schedule_${JSON.stringify(filters)}`;
        
        // Check cache
        if (cache.has(cacheKey)) {
            const cachedData = cache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < CACHE_TTL) {
                logger.debug('Returning cached schedule', { filters });
                return cachedData.data;
            } else {
                cache.delete(cacheKey);
            }
        }
        
        // Build query string
        const queryParams = new URLSearchParams();
        if (filters.hospital_id) queryParams.append('hospital_id', filters.hospital_id);
        if (filters.shift) queryParams.append('shift', filters.shift);
        if (filters.date) queryParams.append('date', filters.date);
        if (filters.limit) queryParams.append('limit', filters.limit);
        
        const response = await axios.get(
            `${QUANTUM_ENGINE_URL}/quantum/doctor-schedule?${queryParams}`,
            { timeout: REQUEST_TIMEOUT }
        );
        
        // Cache the result
        cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
        });
        
        logger.info('Retrieved doctor schedules', {
            count: response.data.schedules.length
        });
        
        return response.data;
    } catch (error) {
        logger.error('Error retrieving schedules', {
            error: error.message,
            filters
        });
        
        throw error;
    }
};

/**
 * Send real-time update event to quantum engine
 */
const sendRealtimeUpdate = async (event) => {
    try {
        const response = await axios.post(
            `${QUANTUM_ENGINE_URL}/quantum/realtime-update`,
            event,
            { timeout: REQUEST_TIMEOUT }
        );
        
        logger.info('Real-time update processed', {
            eventType: event.event_type,
            doctorId: event.doctor_id
        });
        
        // Clear schedule cache on real-time update
        cache.clear();
        
        return response.data;
    } catch (error) {
        logger.error('Error sending real-time update', {
            error: error.message,
            event
        });
        
        throw error;
    }
};

/**
 * Get quantum algorithm information
 */
const getAlgorithmInfo = async () => {
    try {
        const response = await axios.get(
            `${QUANTUM_ENGINE_URL}/quantum/algorithms`,
            { timeout: REQUEST_TIMEOUT }
        );
        
        return response.data;
    } catch (error) {
        logger.error('Error getting algorithm info', {
            error: error.message
        });
        
        throw error;
    }
};

/**
 * Get system statistics
 */
const getSystemStats = async () => {
    try {
        const response = await axios.get(
            `${QUANTUM_ENGINE_URL}/quantum/stats`,
            { timeout: REQUEST_TIMEOUT }
        );
        
        return response.data;
    } catch (error) {
        logger.error('Error getting system stats', {
            error: error.message
        });
        
        throw error;
    }
};

/**
 * Compare quantum vs classical scheduling
 */
const compareQuantumVsClassical = async (payload) => {
    try {
        const response = await axios.post(
            `${QUANTUM_ENGINE_URL}/quantum/comparison`,
            payload,
            { timeout: REQUEST_TIMEOUT }
        );
        
        logger.info('Quantum vs classical comparison completed', {
            quantumScore: response.data.quantum.optimization_score,
            classicalScore: response.data.classical.optimization_score,
            advantage: response.data.quantum_advantage.recommendation
        });
        
        return response.data;
    } catch (error) {
        logger.error('Error comparing quantum vs classical', {
            error: error.message
        });
        
        throw error;
    }
};

/**
 * Search doctors based on criteria
 */
const searchDoctors = async (payload) => {
    try {
        const response = await axios.post(
            `${QUANTUM_ENGINE_URL}/quantum/search`,
            payload,
            { timeout: REQUEST_TIMEOUT }
        );
        
        logger.info('Doctor search completed', {
            count: response.data.count,
            criteria: payload
        });
        
        return response.data;
    } catch (error) {
        logger.error('Error searching doctors', {
            error: error.message
        });
        
        throw error;
    }
};

/**
 * Retry logic with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error;
            }
            
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
            logger.warn(`Retry attempt ${i + 1} after ${delay}ms`, {
                error: error.message
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

module.exports = {
    scheduleDoctors,
    getEmergencyDoctors,
    getSchedule,
    sendRealtimeUpdate,
    getAlgorithmInfo,
    getSystemStats,
    compareQuantumVsClassical,
    searchDoctors,
    retryWithBackoff
};

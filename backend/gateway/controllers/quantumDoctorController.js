/**
 * Quantum Doctor Controller
 * Handles HTTP request/response for doctor scheduling
 */

const { validationResult } = require('express-validator');
const quantumService = require('../services/quantumDoctorService');
const logger = require('../../../logger');

/**
 * Schedule doctor shifts
 * POST /api/quantum/schedule
 */
const scheduleShifts = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        
        const { doctors, shift_requirements, hospitals, emergency_mode } = req.body;
        
        logger.info('Scheduling shifts', {
            doctorCount: doctors.length,
            hospitals: hospitals,
            emergencyMode: emergency_mode
        });
        
        // Call quantum service
        const result = await quantumService.scheduleDoctors({
            doctors,
            shift_requirements,
            hospitals,
            emergency_mode: emergency_mode || false
        });
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error scheduling shifts', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to schedule shifts',
            message: error.message
        });
    }
};

/**
 * Get emergency doctors
 * POST /api/quantum/emergency
 */
const getEmergencyDoctors = async (req, res) => {
    try {
        const { doctors, emergency_slots } = req.body;
        
        if (!doctors || !Array.isArray(doctors)) {
            return res.status(400).json({
                success: false,
                error: 'Doctors array is required'
            });
        }
        
        logger.info('Getting emergency doctors', {
            doctorCount: doctors.length,
            slots: emergency_slots || 3
        });
        
        const result = await quantumService.getEmergencyDoctors({
            doctors,
            emergency_slots: emergency_slots || 3
        });
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error getting emergency doctors', {
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to get emergency doctors',
            message: error.message
        });
    }
};

/**
 * Retrieve doctor schedules
 * GET /api/quantum/schedule
 */
const getSchedules = async (req, res) => {
    try {
        const { hospital_id, shift, date, limit } = req.query;
        
        logger.info('Retrieving schedules', {
            filters: { hospital_id, shift, date }
        });
        
        const result = await quantumService.getSchedule({
            hospital_id,
            shift,
            date,
            limit: limit ? parseInt(limit) : 10
        });
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error retrieving schedules', {
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve schedules',
            message: error.message
        });
    }
};

/**
 * Handle real-time update
 * POST /api/quantum/realtime-update
 */
const handleRealtimeUpdate = async (req, res) => {
    try {
        const { event_type, doctor_id, hospital_id } = req.body;
        
        const validEvents = ['doctor_unavailable', 'emergency_alert', 'high_fatigue'];
        
        if (!event_type || !validEvents.includes(event_type)) {
            return res.status(400).json({
                success: false,
                error: `event_type must be one of: ${validEvents.join(', ')}`
            });
        }
        
        logger.info('Handling real-time update', {
            eventType: event_type,
            doctorId: doctor_id,
            hospitalId: hospital_id
        });
        
        const result = await quantumService.sendRealtimeUpdate({
            event_type,
            doctor_id,
            hospital_id
        });
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error handling real-time update', {
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to handle real-time update',
            message: error.message
        });
    }
};

/**
 * Get algorithm information
 * GET /api/quantum/algorithms
 */
const getAlgorithms = async (req, res) => {
    try {
        const result = await quantumService.getAlgorithmInfo();
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error getting algorithm info', {
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to get algorithm info'
        });
    }
};

/**
 * Get system statistics
 * GET /api/quantum/stats
 */
const getStats = async (req, res) => {
    try {
        const result = await quantumService.getSystemStats();
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error getting stats', {
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to get system stats'
        });
    }
};

/**
 * Compare quantum vs classical
 * POST /api/quantum/compare
 */
const compareQuantumClassical = async (req, res) => {
    try {
        const { doctors, shift_requirements, hospitals } = req.body;
        
        if (!doctors || !shift_requirements) {
            return res.status(400).json({
                success: false,
                error: 'doctors and shift_requirements are required'
            });
        }
        
        logger.info('Comparing quantum vs classical', {
            doctorCount: doctors.length
        });
        
        const result = await quantumService.compareQuantumVsClassical({
            doctors,
            shift_requirements,
            hospitals: hospitals || [],
            emergency_mode: false
        });
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error comparing quantum vs classical', {
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to compare algorithms'
        });
    }
};

/**
 * Search doctors
 * POST /api/quantum/search
 */
const searchDoctors = async (req, res) => {
    try {
        const { doctors, specialization, shift, department } = req.body;
        
        if (!doctors || !Array.isArray(doctors)) {
            return res.status(400).json({
                success: false,
                error: 'Doctors array is required'
            });
        }
        
        logger.info('Searching doctors', {
            doctorCount: doctors.length,
            specialization,
            shift
        });
        
        const result = await quantumService.searchDoctors({
            doctors,
            specialization,
            shift: shift || 'morning',
            department
        });
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error searching doctors', {
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to search doctors'
        });
    }
};

module.exports = {
    scheduleShifts,
    getEmergencyDoctors,
    getSchedules,
    handleRealtimeUpdate,
    getAlgorithms,
    getStats,
    compareQuantumClassical,
    searchDoctors
};

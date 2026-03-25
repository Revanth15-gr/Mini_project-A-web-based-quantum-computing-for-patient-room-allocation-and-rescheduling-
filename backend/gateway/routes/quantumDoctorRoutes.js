/**
 * Quantum Doctor Routes
 * Express routes for quantum doctor scheduling
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const controller = require('../controllers/quantumDoctorController');

const router = express.Router();

// Middleware to parse doctors array
const parseDoctors = (req, res, next) => {
    try {
        if (req.body.doctors && typeof req.body.doctors === 'string') {
            req.body.doctors = JSON.parse(req.body.doctors);
        }
        next();
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Invalid doctors format'
        });
    }
};

/**
 * POST /api/quantum/schedule
 * Schedule doctor shifts
 */
router.post(
    '/schedule',
    parseDoctors,
    [
        body('doctors').isArray().withMessage('doctors must be an array'),
        body('shift_requirements').isObject().withMessage('shift_requirements must be an object'),
        body('shift_requirements').notEmpty().withMessage('shift_requirements cannot be empty'),
        body('hospitals').optional().isArray().withMessage('hospitals must be an array'),
        body('emergency_mode').optional().isBoolean().withMessage('emergency_mode must be boolean')
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    },
    controller.scheduleShifts
);

/**
 * POST /api/quantum/emergency
 * Get emergency doctors
 */
router.post(
    '/emergency',
    parseDoctors,
    [
        body('doctors').isArray().withMessage('doctors must be an array'),
        body('emergency_slots').optional().isInt({ min: 1 }).withMessage('emergency_slots must be a positive integer')
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    },
    controller.getEmergencyDoctors
);

/**
 * GET /api/quantum/schedule
 * Retrieve stored schedules
 */
router.get(
    '/schedule',
    [
        query('hospital_id').optional().isString(),
        query('shift').optional().isIn(['morning', 'afternoon', 'night']),
        query('date').optional().isString(),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    },
    controller.getSchedules
);

/**
 * POST /api/quantum/realtime-update
 * Handle real-time scheduling updates
 */
router.post(
    '/realtime-update',
    [
        body('event_type')
            .isIn(['doctor_unavailable', 'emergency_alert', 'high_fatigue'])
            .withMessage('Invalid event_type'),
        body('doctor_id').optional().isInt(),
        body('hospital_id').optional().isString()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    },
    controller.handleRealtimeUpdate
);

/**
 * GET /api/quantum/algorithms
 * Get algorithm information
 */
router.get('/algorithms', controller.getAlgorithms);

/**
 * GET /api/quantum/stats
 * Get system statistics
 */
router.get('/stats', controller.getStats);

/**
 * POST /api/quantum/compare
 * Compare quantum vs classical scheduling
 */
router.post(
    '/compare',
    parseDoctors,
    [
        body('doctors').isArray().withMessage('doctors must be an array'),
        body('shift_requirements').isObject().withMessage('shift_requirements must be an object')
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    },
    controller.compareQuantumClassical
);

/**
 * POST /api/quantum/search
 * Search doctors based on criteria
 */
router.post(
    '/search',
    parseDoctors,
    [
        body('doctors').isArray().withMessage('doctors must be an array'),
        body('specialization').optional().isString(),
        body('shift').optional().isString(),
        body('department').optional().isString()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    },
    controller.searchDoctors
);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'quantum-doctor-scheduler',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

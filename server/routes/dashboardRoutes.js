import express from 'express';

import {
    verifyToken,
    verifyRole
} from '../middleware/authMiddleware.js';

const router = express.Router();

// Student dashboard
router.get(
    '/student',
    verifyToken,
    verifyRole('student'),
    (req, res) => {
        res.json({
            message: 'Welcome to the Student Dashboard!'
        });
    }
);

// Instructor dashboard
router.get(
    '/instructor',
    verifyToken,
    verifyRole('instructor'),
    (req, res) => {
        res.json({
            message: 'Welcome to the Instructor Dashboard!'
        });
    }
);

// Admin dashboard
router.get(
    '/admin',
    verifyToken,
    verifyRole('admin'),
    (req, res) => {
        res.json({
            message: 'Welcome to the Admin Dashboard!'
        });
    }
);

// Export router
export default router;
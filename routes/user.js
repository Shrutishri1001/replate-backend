const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Import controllers
const userController = require('../controllers/userController');

// All routes are protected
router.use(protect);

// Profile endpoints
router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Search endpoint
router.get('/search', (req, res) => {
    try {
        // For now, return empty array - would implement actual search
        res.json([]);
    } catch (error) {
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
});

// Availability endpoint
router.put('/availability', (req, res) => {
    try {
        // Update user availability
        res.json({ message: 'Availability updated', isAvailable: req.body.isAvailable });
    } catch (error) {
        res.status(500).json({ message: 'Error updating availability', error: error.message });
    }
});

// Volunteer profile endpoint
router.post('/volunteer-profile', (req, res) => {
    try {
        // Create or update volunteer profile
        res.json({ message: 'Volunteer profile created' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating volunteer profile', error: error.message });
    }
});

module.exports = router;

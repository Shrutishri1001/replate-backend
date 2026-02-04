const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);

module.exports = router;

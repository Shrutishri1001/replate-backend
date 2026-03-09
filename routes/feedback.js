const express = require('express');
const router = express.Router();
const { submitFeedback, getDonorFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

// @route   POST /api/feedback
// @desc    Submit feedback (NGO only)
// @access  Private
router.post('/', protect, submitFeedback);

// @route   GET /api/feedback/donor/:id
// @desc    Get donor's public feedback
// @access  Public
router.get('/donor/:id', getDonorFeedback);

module.exports = router;

const Feedback = require('../models/Feedback');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Submit feedback for a completed donation
// @route   POST /api/feedback
// @access  Private (NGO only)
exports.submitFeedback = async (req, res) => {
    try {
        const { donationId, rating, foodQuality, packagingQuality, comments, isPublic } = req.body;

        // Verify donation exists and belongs to this NGO
        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        // Must be delivered
        if (donation.status !== 'delivered') {
            return res.status(400).json({ success: false, message: 'Feedback can only be submitted for delivered donations' });
        }

        // NGO check
        if (donation.acceptedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to review this donation' });
        }

        // Check if feedback already exists
        const existingFeedback = await Feedback.findOne({ donation: donationId, ngo: req.user._id });
        if (existingFeedback) {
            return res.status(400).json({ success: false, message: 'Feedback already submitted for this donation' });
        }

        const feedback = await Feedback.create({
            donation: donationId,
            ngo: req.user._id,
            donor: donation.donor,
            rating,
            foodQuality,
            packagingQuality,
            comments,
            isPublic
        });

        // Notify donor
        await createNotification({
            recipient: donation.donor,
            title: 'New Feedback Received',
            message: `${req.user.organizationName || req.user.fullName} left a ${rating}-star review for your recent donation.`,
            type: 'status_update',
            data: { feedbackId: feedback._id }
        });

        res.status(201).json({ success: true, data: feedback });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get public feedback for a specific donor
// @route   GET /api/feedback/donor/:id
// @access  Public or Private
exports.getDonorFeedback = async (req, res) => {
    try {
        const feedbackList = await Feedback.find({
            donor: req.params.id,
            isPublic: true
        })
            .populate('ngo', 'fullName organizationName')
            .populate('donation', 'foodName')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: feedbackList.length, data: feedbackList });
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

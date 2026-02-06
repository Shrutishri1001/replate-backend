const Request = require('../models/Request');
const Donation = require('../models/Donation');

// @desc    Create new request
// @route   POST /api/requests
// @access  Private (NGO only)
exports.createRequest = async (req, res) => {
    try {
        const { donationId, notes } = req.body;

        // Check if donation exists and is available
        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        if (donation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This donation is no longer available'
            });
        }

        // Check if request already exists
        const existingRequest = await Request.findOne({
            donation: donationId,
            ngo: req.user._id
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You have already requested this donation'
            });
        }

        // Create request
        const request = await Request.create({
            donation: donationId,
            ngo: req.user._id,
            notes
        });

        const populatedRequest = await Request.findById(request._id)
            .populate('donation')
            .populate('ngo', 'name email organization');

        res.status(201).json({
            success: true,
            data: populatedRequest
        });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all requests for logged-in NGO
// @route   GET /api/requests
// @access  Private (NGO only)
exports.getRequests = async (req, res) => {
    try {
        const requests = await Request.find({ ngo: req.user._id })
            .populate({
                path: 'donation',
                populate: { path: 'assignedTo', select: 'fullName phone' }
            })
            .populate('ngo', 'name email organization')
            .populate('volunteer', 'fullName phone')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Private (NGO only)
exports.getRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('donation')
            .populate('ngo', 'name email organization');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Check if user owns this request
        if (request.ngo._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this request'
            });
        }

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Error fetching request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Accept request (updates donation status)
// @route   PUT /api/requests/:id/accept
// @access  Private (NGO only)
exports.acceptRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Check ownership
        if (request.ngo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Update request status
        request.status = 'accepted';
        request.acceptedAt = Date.now();
        await request.save();

        // Update donation status
        await Donation.findByIdAndUpdate(request.donation, {
            status: 'accepted',
            acceptedBy: req.user._id,
            acceptedAt: Date.now()
        });

        const updatedRequest = await Request.findById(request._id)
            .populate('donation')
            .populate('ngo', 'name email organization');

        res.status(200).json({
            success: true,
            data: updatedRequest
        });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Assign volunteer to accepted request
// @route   PUT /api/ requests/:id/assign-volunteer
// @access  Private (NGO only)
exports.assignVolunteer = async (req, res) => {
    try {
        const { volunteerId } = req.body;
        const Assignment = require('../models/Assignment');
        const User = require('../models/User');

        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Check ownership
        if (request.ngo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Check if request is accepted
        if (request.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Can only assign volunteers to accepted requests'
            });
        }

        // Verify volunteer exists and is available
        const volunteer = await User.findById(volunteerId);
        if (!volunteer || volunteer.role !== 'volunteer') {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }

        // Create assignment
        const assignment = await Assignment.create({
            donation: request.donation,
            volunteer: volunteerId,
            donor: (await Donation.findById(request.donation)).donor,
            status: 'pending'
        });

        // Update request
        request.volunteer = volunteerId;
        request.assignment = assignment._id;
        request.status = 'assigned';
        request.assignedAt = Date.now();
        await request.save();

        const updatedRequest = await Request.findById(request._id)
            .populate('donation')
            .populate('ngo', 'fullName email organizationName')
            .populate('volunteer', 'fullName email phone');

        res.status(200).json({
            success: true,
            data: updatedRequest,
            assignment: assignment
        });
    } catch (error) {
        console.error('Error assigning volunteer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark request as picked up
// @route   PUT /api/requests/:id/pickup
// @access  Private (NGO only)
exports.pickupRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.ngo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        request.status = 'picked_up';
        request.pickedUpAt = Date.now();
        await request.save();

        await Donation.findByIdAndUpdate(request.donation, {
            status: 'picked_up'
        });

        const updatedRequest = await Request.findById(request._id)
            .populate('donation')
            .populate('ngo', 'name email organization');

        res.status(200).json({
            success: true,
            data: updatedRequest
        });
    } catch (error) {
        console.error('Error updating pickup status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark request as delivered
// @route   PUT /api/requests/:id/deliver
// @access  Private (NGO only)
exports.deliverRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.ngo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        request.status = 'delivered';
        request.deliveredAt = Date.now();
        await request.save();

        await Donation.findByIdAndUpdate(request.donation, {
            status: 'delivered'
        });

        const updatedRequest = await Request.findById(request._id)
            .populate('donation')
            .populate('ngo', 'name email organization');

        res.status(200).json({
            success: true,
            data: updatedRequest
        });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Cancel request
// @route   PUT /api/requests/:id/cancel
// @access  Private (NGO only)
exports.cancelRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.ngo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        request.status = 'cancelled';
        request.cancelledAt = Date.now();
        request.cancellationReason = reason;
        await request.save();

        // If request was accepted, reset donation status
        if (request.status === 'accepted') {
            await Donation.findByIdAndUpdate(request.donation, {
                status: 'pending',
                acceptedBy: null,
                acceptedAt: null
            });
        }

        const updatedRequest = await Request.findById(request._id)
            .populate('donation')
            .populate('ngo', 'name email organization');

        res.status(200).json({
            success: true,
            data: updatedRequest
        });
    } catch (error) {
        console.error('Error cancelling request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete request
// @route   DELETE /api/requests/:id
// @access  Private (NGO only)
exports.deleteRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.ngo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Only allow deletion of pending requests
        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete pending requests'
            });
        }

        await request.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Request deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

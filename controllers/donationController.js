const Donation = require('../models/Donation');

// @desc    Create new donation
// @route   POST /api/donations
// @access  Private (Donor only)
exports.createDonation = async (req, res) => {
    try {
        const donationData = {
            donor: req.user._id,
            ...req.body
        };

        const donation = await Donation.create(donationData);

        res.status(201).json({
            success: true,
            data: donation
        });
    } catch (error) {
        console.error('Error creating donation:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create donation'
        });
    }
};

// @desc    Get all donations
// @route   GET /api/donations
// @access  Private
exports.getDonations = async (req, res) => {
    try {
        let query = {};

        // Filter by donor if user is a donor
        if (req.user.role === 'donor') {
            query.donor = req.user._id;
        }

        // Filter by status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        const donations = await Donation.find({ donor: req.user._id })
            .populate('acceptedBy', 'name organization')
            .populate('assignedTo', 'fullName phone')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: donations.length,
            data: donations
        });
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get available donations for NGOs
// @route   GET /api/donations/available
// @access  Private (NGO only)
exports.getAvailableDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ status: 'pending' })
            .populate('donor', 'name organization city')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: donations.length,
            data: donations
        });
    } catch (error) {
        console.error('Error fetching available donations:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Private
exports.getDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id)
            .populate('donor', 'fullName organizationName email phone address city')
            .populate('assignedTo', 'fullName organizationName email phone');

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // Check if user has access to this donation
        if (req.user.role === 'donor' && donation.donor._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this donation'
            });
        }

        res.status(200).json({
            success: true,
            data: donation
        });
    } catch (error) {
        console.error('Error fetching donation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donation'
        });
    }
};

// @desc    Update donation
// @route   PUT /api/donations/:id
// @access  Private (Donor only - own donations)
exports.updateDonation = async (req, res) => {
    try {
        let donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // Check if user is the donor
        if (donation.donor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this donation'
            });
        }

        // Don't allow updates if donation is already accepted or picked up
        if (['accepted', 'picked_up', 'delivered'].includes(donation.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update donation after it has been accepted'
            });
        }

        donation = await Donation.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: donation
        });
    } catch (error) {
        console.error('Error updating donation:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update donation'
        });
    }
};

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private (Donor only - own donations)
exports.deleteDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // Check if user is the donor
        if (donation.donor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this donation'
            });
        }

        // Don't allow deletion if donation is already accepted or picked up
        if (['accepted', 'picked_up', 'delivered'].includes(donation.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete donation after it has been accepted'
            });
        }

        await donation.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Donation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete donation'
        });
    }
};

// @desc    Accept donation (NGO/Volunteer)
// @route   PUT /api/donations/:id/accept
// @access  Private (NGO/Volunteer only)
exports.acceptDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        if (donation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Donation is not available'
            });
        }

        donation.status = 'accepted';
        donation.assignedTo = req.user._id;
        donation.acceptedAt = new Date();

        await donation.save();

        res.status(200).json({
            success: true,
            data: donation
        });
    } catch (error) {
        console.error('Error accepting donation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept donation'
        });
    }
};

// @desc    Mark donation as picked up
// @route   PUT /api/donations/:id/pickup
// @access  Private (Assigned NGO/Volunteer only)
exports.markPickedUp = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        if (donation.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        donation.status = 'picked_up';
        donation.pickedUpAt = new Date();

        await donation.save();

        res.status(200).json({
            success: true,
            data: donation
        });
    } catch (error) {
        console.error('Error marking donation as picked up:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update donation status'
        });
    }
};

// @desc    Mark donation as delivered
// @route   PUT /api/donations/:id/deliver
// @access  Private (Assigned NGO/Volunteer only)
exports.markDelivered = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        if (donation.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        donation.status = 'delivered';
        donation.deliveredAt = new Date();

        await donation.save();

        res.status(200).json({
            success: true,
            data: donation
        });
    } catch (error) {
        console.error('Error marking donation as delivered:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update donation status'
        });
    }
};

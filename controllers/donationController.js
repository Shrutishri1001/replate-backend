const Donation = require('../models/Donation');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { calculateDistance } = require('../utils/distance');

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

        // Notify top 3 closest NGOs with available capacity
        try {
            const ngos = await User.find({ role: 'ngo', status: 'active' });

            const size = donation.estimatedServings || donation.quantity || 0;
            const donationLat = donation.location?.lat;
            const donationLng = donation.location?.lng;

            if (donationLat && donationLng) {
                const matchedNgos = ngos.map(ngo => {
                    const capacity = ngo.dailyCapacity || 0;
                    let distance = Infinity;
                    if (ngo.location?.lat && ngo.location?.lng) {
                        distance = calculateDistance(donationLat, donationLng, ngo.location.lat, ngo.location.lng);
                    }
                    return { ngo, distance, capacity };
                }).filter(match => {
                    // Filter: within 10km radius and enough capacity for the donation size
                    return match.distance <= 10 && size <= match.capacity;
                }).sort((a, b) => a.distance - b.distance);

                const topNgos = matchedNgos.slice(0, 3);

                for (const match of topNgos) {
                    await createNotification({
                        recipient: match.ngo._id,
                        title: 'New Matched Donation Available',
                        message: `A new donation of ${size} servings is available ${match.distance.toFixed(1)}km away.`,
                        type: 'new_assignment',
                        data: { donationId: donation._id }
                    });
                }
            }
        } catch (matchError) {
            console.error('Error auto-matching NGOs:', matchError);
        }

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
            .populate('donor', 'fullName organizationName email phone address city location')
            .sort('-createdAt');

        const ngoCapacity = req.user.dailyCapacity || 0;
        const ngoLat = req.user.location?.lat;
        const ngoLng = req.user.location?.lng;

        // Filter out expired donations, capacity mismatch, or distance > 10km
        const availableDonations = donations.filter(d => {
            if (d.expiryDate && d.expiryTime) {
                const expiryDateTime = new Date(`${d.expiryDate}T${d.expiryTime}`);
                if (new Date() >= expiryDateTime) return false;
            }

            const size = d.estimatedServings || d.quantity || 0;
            if (size > ngoCapacity) return false;

            const dLat = d.location?.lat || (d.donor && d.donor.location?.lat);
            const dLng = d.location?.lng || (d.donor && d.donor.location?.lng);

            if (ngoLat && ngoLng && dLat && dLng) {
                const distance = calculateDistance(ngoLat, ngoLng, dLat, dLng);
                if (distance > 10) return false;
            }

            return true;
        });

        res.status(200).json({
            success: true,
            count: availableDonations.length,
            data: availableDonations
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

        if (req.user.role === 'ngo') {
            donation.acceptedBy = req.user._id;
        } else {
            donation.assignedTo = req.user._id;
        }

        donation.status = 'accepted';
        donation.acceptedAt = new Date();

        await donation.save();

        // Notify donor that NGO accepted
        try {
            await createNotification({
                recipient: donation.donor,
                title: 'Donation Accepted',
                message: `Your donation has been accepted by ${req.user.organizationName || req.user.fullName}.`,
                type: 'status_update',
                data: { donationId: donation._id }
            });
        } catch (notifyError) {
            console.error('Error notifying donor in acceptDonation:', notifyError);
        }

        // Notify volunteers if accepted by NGO
        if (req.user.role === 'ngo') {
            try {
                const cityToMatch = donation.city || req.user.city;
                const volunteers = await User.find({
                    role: 'volunteer',
                    'volunteerProfile.availabilitySchedule': { $exists: true },
                    city: { $regex: new RegExp(`^${donation.city || req.user.city}$`, 'i') }
                });

                const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                const today = days[new Date().getDay()];

                // Fetch active assignments for all these volunteers to determine workload
                const Assignment = require('../models/Assignment');
                const activeAssignments = await Assignment.aggregate([
                    { $match: { status: { $in: ['accepted', 'in_transit', 'assigned'] } } },
                    { $group: { _id: '$volunteer', count: { $sum: 1 } } }
                ]);

                const workloadMap = {};
                activeAssignments.forEach(a => {
                    workloadMap[a._id.toString()] = a.count;
                });

                for (const volunteer of volunteers) {
                    // Check workload
                    const activeCount = workloadMap[volunteer._id.toString()] || 0;

                    // Skip if volunteer is overloaded (e.g., 3 or more active assignments)
                    if (activeCount >= 3) continue;

                    // Check if volunteer is active at ALL in their schedule
                    const scheduleObj = volunteer.volunteerProfile?.availabilitySchedule || {};
                    const isAnyDayActive = Object.values(scheduleObj).some(day => day.active);

                    if (isAnyDayActive) {
                        // Check capacity
                        const dQty = Number(donation.quantity);
                        const vMax = Number(volunteer.volunteerProfile?.maxWeight);
                        if (donation.unit !== 'kg' || isNaN(vMax) || vMax >= dQty) {

                            // Adjust message based on workload
                            const urgencyMsg = activeCount === 0
                                ? 'You have no active assignments. '
                                : `You have ${activeCount} active task(s). `;

                            await createNotification({
                                recipient: volunteer._id,
                                title: 'New Assignment Available',
                                message: `${urgencyMsg}A new donation "${donation.foodName}" is ready for pickup in ${donation.city || cityToMatch}.`,
                                type: 'new_assignment',
                                data: { donationId: donation._id }
                            });
                        }
                    }
                }
            } catch (notifyError) {
                console.error('Notification error in acceptDonation:', notifyError);
            }
        }

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

        // Notify Donor and NGO
        try {
            await createNotification({
                recipient: donation.donor,
                title: 'Donation Picked Up',
                message: `Your donation of ${donation.foodName || 'food'} has been picked up by the volunteer.`,
                type: 'status_update',
                data: { donationId: donation._id }
            });

            if (donation.acceptedBy) {
                await createNotification({
                    recipient: donation.acceptedBy,
                    title: 'Donation on the Way',
                    message: `The donation ${donation.foodName || 'food'} you accepted has been picked up and is on its way.`,
                    type: 'status_update',
                    data: { donationId: donation._id }
                });
            }
        } catch (notifyError) {
            console.error('Notification error in markPickedUp:', notifyError);
        }

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

        // Notify Donor and NGO
        try {
            await createNotification({
                recipient: donation.donor,
                title: 'Donation Delivered',
                message: `Your donation of ${donation.foodName} has been successfully delivered.`,
                type: 'status_update',
                data: { donationId: donation._id }
            });

            if (donation.acceptedBy) {
                await createNotification({
                    recipient: donation.acceptedBy,
                    title: 'Delivery Complete',
                    message: `The donation ${donation.foodName} you accepted has been delivered.`,
                    type: 'status_update',
                    data: { donationId: donation._id }
                });
            }
        } catch (notifyError) {
            console.error('Notification error in markDelivered:', notifyError);
        }

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

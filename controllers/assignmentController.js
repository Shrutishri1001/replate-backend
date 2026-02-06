const Assignment = require('../models/Assignment');
const Donation = require('../models/Donation');
const User = require('../models/User');

// @desc    Create new assignment (assign donation to volunteer)
// @route   POST /api/assignments/create
// @access  Private (Admin/NGO)
exports.createAssignment = async (req, res) => {
    try {
        const { donationId, volunteerId } = req.body;

        // Validate donation exists and is available
        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        if (donation.status !== 'pending' && donation.status !== 'accepted') {
            return res.status(400).json({ message: 'Donation is not available for assignment' });
        }

        // Validate volunteer exists
        const volunteer = await User.findById(volunteerId);
        if (!volunteer || volunteer.role !== 'volunteer') {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        // Check if assignment already exists
        const existingAssignment = await Assignment.findOne({
            donation: donationId,
            status: { $in: ['pending', 'accepted', 'in_transit'] }
        });

        if (existingAssignment) {
            return res.status(400).json({ message: 'Donation already has an active assignment' });
        }

        // Create assignment
        const assignment = await Assignment.create({
            donation: donationId,
            volunteer: volunteerId,
            donor: donation.donor
        });

        // Update donation status
        donation.assignedTo = volunteerId;
        await donation.save();

        const populatedAssignment = await Assignment.findById(assignment._id)
            .populate('donation')
            .populate('volunteer', '-password')
            .populate('donor', '-password');

        res.status(201).json(populatedAssignment);
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get assignments for a volunteer
// @route   GET /api/assignments/volunteer/:volunteerId
// @access  Private
exports.getVolunteerAssignments = async (req, res) => {
    try {
        const { volunteerId } = req.params;
        const { status } = req.query;

        const filter = { volunteer: volunteerId };
        if (status) {
            filter.status = status;
        }

        const assignments = await Assignment.find(filter)
            .populate({
                path: 'donation',
                populate: { path: 'acceptedBy', select: 'organizationName name' }
            })
            .populate('donor', '-password')
            .sort({ createdAt: -1 });

        res.status(200).json(assignments);
    } catch (error) {
        console.error('Get volunteer assignments error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Accept assignment
// @route   PUT /api/assignments/:id/accept
// @access  Private (Volunteer)
exports.acceptAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        if (assignment.status !== 'pending') {
            return res.status(400).json({ message: 'Assignment cannot be accepted' });
        }

        assignment.status = 'accepted';
        assignment.acceptedAt = new Date();
        await assignment.save();

        const populatedAssignment = await Assignment.findById(assignment._id)
            .populate('donation')
            .populate('volunteer', '-password')
            .populate('donor', '-password');

        res.status(200).json(populatedAssignment);
    } catch (error) {
        console.error('Accept assignment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update volunteer location during transit
// @route   PUT /api/assignments/:id/update-location
// @access  Private (Volunteer)
exports.updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { lat, lng } = req.body;

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Update location and set status to in_transit if accepted
        assignment.currentLocation = {
            lat,
            lng,
            lastUpdated: new Date()
        };

        if (['accepted', 'assigned'].includes(assignment.status) && !assignment.startedAt) {
            assignment.status = 'in_transit';
            assignment.startedAt = new Date();

            // Update donation status
            const donation = await Donation.findById(assignment.donation);
            if (donation) {
                donation.status = 'in_transit';
                await donation.save();

                // Sync Request status
                const Request = require('../models/Request');
                await Request.findOneAndUpdate(
                    { donation: assignment.donation },
                    {
                        status: 'picked_up', // Using 'picked_up' to match Request schema enum/frontend expected
                        pickedUpAt: new Date()
                    }
                );
            }
        }

        await assignment.save();

        res.status(200).json(assignment);
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Complete assignment
// @route   PUT /api/assignments/:id/complete
// @access  Private (Volunteer)
exports.completeAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes, rating } = req.body;

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        if (assignment.status !== 'in_transit' && assignment.status !== 'accepted') {
            return res.status(400).json({ message: 'Assignment cannot be completed' });
        }

        assignment.status = 'completed';
        assignment.completedAt = new Date();
        assignment.completionNotes = notes || '';
        assignment.rating = rating || null;
        await assignment.save();

        // Update donation status
        const donation = await Donation.findById(assignment.donation);
        if (donation) {
            donation.status = 'delivered'; // Sync with assignment completion
            donation.deliveredAt = new Date(); // Track delivery time
            await donation.save();

            // Sync Request status
            const Request = require('../models/Request');
            await Request.findOneAndUpdate(
                { donation: assignment.donation },
                {
                    status: 'delivered',
                    deliveredAt: new Date()
                }
            );
        }

        const populatedAssignment = await Assignment.findById(assignment._id)
            .populate({
                path: 'donation',
                populate: { path: 'acceptedBy', select: 'organizationName name' }
            })
            .populate('volunteer', '-password')
            .populate('donor', '-password');

        res.status(200).json(populatedAssignment);
    } catch (error) {
        console.error('Complete assignment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Cancel assignment
// @route   PUT /api/assignments/:id/cancel
// @access  Private (Volunteer/Admin)
exports.cancelAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        if (assignment.status === 'completed') {
            return res.status(400).json({ message: 'Completed assignment cannot be cancelled' });
        }

        assignment.status = 'cancelled';
        assignment.cancelledAt = new Date();
        assignment.cancellationReason = reason || '';
        await assignment.save();

        // Reset donation assignment
        const donation = await Donation.findById(assignment.donation);
        if (donation) {
            donation.assignedTo = null;
            donation.status = 'pending';
            await donation.save();
        }

        const populatedAssignment = await Assignment.findById(assignment._id)
            .populate('donation')
            .populate('volunteer', '-password')
            .populate('donor', '-password');

        res.status(200).json(populatedAssignment);
    } catch (error) {
        console.error('Cancel assignment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all assignments
// @route   GET /api/assignments
// @access  Private (Admin)
exports.getAllAssignments = async (req, res) => {
    try {
        const { status } = req.query;

        const filter = {};
        if (status) {
            filter.status = status;
        }

        const assignments = await Assignment.find(filter)
            .populate('donation')
            .populate('volunteer', '-password')
            .populate('donor', '-password')
            .sort({ createdAt: -1 });

        res.status(200).json(assignments);
    } catch (error) {
        console.error('Get all assignments error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Get available assignments for claiming
// @route   GET /api/assignments/available
// @access  Private (Volunteer)
exports.getAvailableAssignments = async (req, res) => {
    try {
        const { lat, lng, radius, type } = req.query;

        // Base query: Accepted donations that are not assigned
        const query = {
            status: 'accepted',
            assignedTo: null
        };

        // TODO: Add geospatial query if lat/lng provided
        // if (lat && lng) { ... }

        const assignments = await Donation.find(query)
            .populate('donor', '-password') // Populate donor info for location
            .sort({ createdAt: -1 });

        // Calculate distances if lat/lng provided and filter by radius
        // This is a basic implementation. For production, use MongoDB $geoNear

        res.status(200).json(assignments);
    } catch (error) {
        console.error('Get available assignments error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Volunteer claims an assignment
// @route   POST /api/assignments/claim
// @access  Private (Volunteer)
exports.claimAssignment = async (req, res) => {
    try {
        const { donationId } = req.body;
        const volunteerId = req.user.id;

        // Check if donation exists and is available
        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        if (donation.status !== 'accepted' || donation.assignedTo) {
            return res.status(400).json({ message: 'Donation is no longer available' });
        }

        // Create assignment (Implicitly, or explicitly if using Assignment model)
        // We use Assignment model to track history
        const assignment = await Assignment.create({
            donation: donationId,
            volunteer: volunteerId,
            donor: donation.donor,
            status: 'accepted', // Start as accepted/assigned
            acceptedAt: new Date()
        });

        // Update donation
        donation.assignedTo = volunteerId;
        donation.status = 'assigned'; // Or remain 'accepted' with assignedTo? 
        // Let's use 'assigned' to distinguish claimed vs just accepted by NGO
        // But wait, existing logic uses 'accepted' for NGO acceptance.
        // Let's stick to: Status 'accepted' + assignedTo != null implies claimed?
        // Or specific status 'assigned'? 
        // Update donation
        donation.assignedTo = volunteerId;
        donation.status = 'assigned';
        await donation.save();

        // Sync Request status
        const Request = require('../models/Request');
        await Request.findOneAndUpdate(
            { donation: donationId },
            {
                status: 'assigned',
                volunteer: volunteerId,
                assignedAt: new Date(),
                assignment: assignment._id
            }
        );

        const populatedAssignment = await Assignment.findById(assignment._id)
            .populate('donation')
            .populate('volunteer', '-password')
            .populate('donor', '-password');

        res.status(201).json(populatedAssignment);
    } catch (error) {
        console.error('Claim assignment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update volunteer profile/availability
// @route   PUT /api/users/volunteer-profile
// @access  Private (Volunteer)
exports.updateVolunteerProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { isAvailable, vehicleType, serviceRadius, preferredAreas, availabilitySchedule } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (isAvailable !== undefined) user.isAvailable = isAvailable;

        if (vehicleType || serviceRadius || preferredAreas || availabilitySchedule) {
            if (!user.volunteerProfile) user.volunteerProfile = {};

            if (vehicleType) user.volunteerProfile.vehicleType = vehicleType;
            if (serviceRadius) user.volunteerProfile.serviceRadius = serviceRadius;
            if (preferredAreas) user.volunteerProfile.preferredAreas = preferredAreas;
            if (availabilitySchedule) user.volunteerProfile.availabilitySchedule = availabilitySchedule;
        }

        await user.save();
        res.status(200).json(user);
    } catch (error) {
        console.error('Update volunteer profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const Assignment = require('../models/Assignment');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

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

        // Validate weight capacity if weight is specified in kg
        const donationQty = Number(donation.quantity);
        const volunteerMaxWeight = Number(volunteer.volunteerProfile?.maxWeight);

        if (donation.unit === 'kg' && !isNaN(volunteerMaxWeight) && volunteerMaxWeight < donationQty) {
            return res.status(400).json({ message: `Volunteer delivery capacity (${volunteerMaxWeight}kg) is less than the food weight (${donationQty}kg)` });
        }

        // Validate volunteer schedule for today
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const today = days[new Date().getDay()];
        const schedule = volunteer.volunteerProfile?.availabilitySchedule?.[today];

        if (!schedule || !schedule.active) {
            return res.status(400).json({ message: `Volunteer is not available according to their weekly schedule for today (${today})` });
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

        // Notify volunteer
        try {
            await createNotification({
                recipient: volunteerId,
                title: 'New Assignment Assigned',
                message: `You have been assigned a pickup for ${donation.foodName}.`,
                type: 'new_assignment',
                data: { donationId: donation._id }
            });
        } catch (notifyError) {
            console.error('Notification error in createAssignment:', notifyError);
        }

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

            // Notify Donor and NGO
            try {
                await createNotification({
                    recipient: donation.donor,
                    title: 'Food Delivered',
                    message: `Your donation ${donation.foodName} has been delivered to the recipient.`,
                    type: 'status_update',
                    data: { donationId: donation._id }
                });

                if (donation.acceptedBy) {
                    await createNotification({
                        recipient: donation.acceptedBy,
                        title: 'Delivery Successful',
                        message: `The food for ${donation.foodName} has been delivered by the volunteer.`,
                        type: 'status_update',
                        data: { donationId: donation._id }
                    });
                }
            } catch (notifyError) {
                console.error('Notification error in completeAssignment:', notifyError);
            }
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
            donation.status = 'pending'; // Reset to pending if volunteer cancels? Or 'accepted' if NGO still wants it?
            // If it was already accepted by NGO, it should stay 'accepted' but assignedTo = null
            if (donation.acceptedBy) {
                donation.status = 'accepted';
            }
            await donation.save();

            // Notify NGO if applicable
            if (donation.acceptedBy) {
                try {
                    await createNotification({
                        recipient: donation.acceptedBy,
                        title: 'Assignment Cancelled',
                        message: `The volunteer has cancelled the pickup for ${donation.foodName}. It is available for other volunteers.`,
                        type: 'assignment_update',
                        data: { donationId: donation._id }
                    });
                } catch (notifyError) {
                    console.error('Notification error in cancelAssignment:', notifyError);
                }
            }
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

        // Force fetch fresh user with profile
        const User = require('../models/User');
        const volunteer = await User.findById(req.user._id);
        const volunteerCity = volunteer.city;

        // Base query: Accepted donations that are not assigned to a volunteer
        // Must be accepted by an NGO
        const query = {
            status: 'accepted',
            assignedTo: null,
            acceptedBy: { $exists: true, $ne: null }
        };

        const assignments = await Donation.find(query)
            .populate('donor', '-password')
            .sort({ createdAt: -1 });

        // Intelligence Filtering: Filter by volunteer's schedule and capacity
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const today = days[new Date().getDay()];
        const schedule = volunteer.volunteerProfile?.availabilitySchedule?.[today];

        // If profile is missing or schedule is missing, we default to whatever the role says
        // but for safety, if they have NO schedule defined, we might want to show them tasks anyway?
        // However, user said "fitting", so let's assume schedule exists.
        const isScheduledToday = schedule ? schedule.active : true;

        console.log(`Volunteer ${volunteer.fullName} (ID: ${volunteer._id}) - Schedule today (${today}): ${isScheduledToday ? 'Active' : 'Inactive'}`);

        const filteredAssignments = assignments.filter(d => {
            // 1. City Matching (Case-insensitive)
            const donationCity = (d.city || d.donor?.city || '').toLowerCase().trim();
            const vCity = (volunteerCity || '').toLowerCase().trim();

            if (vCity && donationCity && vCity !== donationCity) {
                return false;
            }

            // 2. Exclude expired
            if (d.expiryDate && d.expiryTime) {
                const expiryDateTime = new Date(`${d.expiryDate}T${d.expiryTime}`);
                if (new Date() > expiryDateTime) return false;
            }

            // 3. Check capacity if unit is kg
            const dQty = Number(d.quantity) || 0;
            const vMax = Number(volunteer.volunteerProfile?.maxWeight);

            // Only filter if vMax is a positive number. If 0 or NaN, assume no limit for now.
            if (d.unit === 'kg' && !isNaN(vMax) && vMax > 0) {
                if (vMax < dQty) return false;
            }

            // 4. Check schedule
            if (!isScheduledToday) return false;

            return true;
        });

        res.status(200).json(filteredAssignments);
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

        // Validate volunteer (self)
        const volunteer = await User.findById(volunteerId);
        if (!volunteer) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        // Validate weight capacity if weight is specified in kg
        const donationWeight = Number(donation.quantity);
        const myMaxWeight = Number(volunteer.volunteerProfile?.maxWeight);

        if (donation.unit === 'kg' && !isNaN(myMaxWeight) && myMaxWeight < donationWeight) {
            return res.status(400).json({ message: `Your delivery capacity (${myMaxWeight}kg) is less than the food weight (${donationWeight}kg)` });
        }

        // Validate volunteer schedule for today
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const today = days[new Date().getDay()];
        const schedule = volunteer.volunteerProfile?.availabilitySchedule?.[today];

        if (!schedule || !schedule.active) {
            return res.status(400).json({ message: `You are not scheduled to be available today (${today})` });
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

        // Notify NGO if applicable
        if (donation.acceptedBy) {
            try {
                await createNotification({
                    recipient: donation.acceptedBy,
                    title: 'Assignment Claimed',
                    message: `Volunteer ${volunteer.fullName} has claimed the pickup for ${donation.foodName}.`,
                    type: 'assignment_update',
                    data: { donationId: donation._id }
                });
            } catch (notifyError) {
                console.error('Notification error in claimAssignment:', notifyError);
            }
        }

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
        const { isAvailable, vehicleType, maxWeight, serviceRadius, preferredAreas, availabilitySchedule } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (isAvailable !== undefined) user.isAvailable = isAvailable;

        if (vehicleType || maxWeight !== undefined || serviceRadius || preferredAreas || availabilitySchedule) {
            if (!user.volunteerProfile) user.volunteerProfile = {};

            if (vehicleType) user.volunteerProfile.vehicleType = vehicleType;
            if (maxWeight !== undefined) user.volunteerProfile.maxWeight = maxWeight;
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


// MAP CONTROLLER BACKEND 


exports.getAssignmentMapData = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("donation")
      .populate("donor")
      .populate("volunteer");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // ✅ FETCH CONSUMER (NGO) FROM DONATION
    const consumer = await User.findById(assignment.donation.acceptedBy);

    res.json({
      assignmentId: assignment._id,
      status: assignment.status,

      volunteerLocation: assignment.currentLocation || null,

      // ✅ DONOR = pickup
      donorLocation: assignment.donation.location,

      // ✅ CONSUMER = NGO
      consumerLocation: consumer?.location || null,

      volunteerAddress: assignment.volunteer.address,
      donorAddress: assignment.donation.pickupAddress,
      consumerAddress: consumer?.address || null,
    });
  } catch (err) {
    console.error("Map data error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateAssignmentLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        if (lat == null || lng == null) {
            return res.status(400).json({ message: "lat & lng required" });
        }

        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        assignment.currentLocation = {
            lat,
            lng,
            lastUpdated: new Date()
        };

        if (assignment.status === "accepted") {
            assignment.status = "in_transit";
            assignment.startedAt = new Date();
        }

        await assignment.save();

        res.json({ success: true });
    } catch (err) {
        console.error("Location update error:", err);
        res.status(500).json({ error: err.message });
    }

};

// @desc    Get active assignment for logged-in volunteer
// @route   GET /api/assignments/volunteer-active
// @access  Private (Volunteer)
exports.getActiveAssignmentForVolunteer = async (req, res) => {
    const assignment = await Assignment.findOne({
        volunteer: req.user._id,
        status: { $in: ["accepted", "in_transit"] }
    }).sort({ createdAt: -1 });

    if (!assignment) {
        return res.status(404).json({ message: "No active assignment" });
    }

    res.json(assignment);
};

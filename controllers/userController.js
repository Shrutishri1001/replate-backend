const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            organizationName: user.organizationName,
            organizationType: user.organizationType,
            registrationNumber: user.registrationNumber,
            dailyCapacity: user.dailyCapacity,
            address: user.address,
            city: user.city,
            state: user.state,
            pincode: user.pincode,
            location: user.location,
            isAvailable: user.isAvailable,
            vehicleType: user.vehicleType,
            volunteerProfile: user.volunteerProfile,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Editable fields
        const {
            fullName,
            phone,
            organizationName,
            organizationType,
            dailyCapacity,
            address,
            city,
            state,
            pincode,
            location,
            isAvailable,
            vehicleType
        } = req.body;

        // Update only provided fields
        if (fullName !== undefined) user.fullName = fullName;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        if (city !== undefined) user.city = city;
        if (state !== undefined) user.state = state;
        if (pincode !== undefined) user.pincode = pincode;

        // Role-specific fields
        if (user.role === 'donor' || user.role === 'ngo') {
            if (organizationName !== undefined) user.organizationName = organizationName;
            if (organizationType !== undefined) user.organizationType = organizationType;
        }

        if (user.role === 'ngo') {
            if (dailyCapacity !== undefined) user.dailyCapacity = dailyCapacity;
        }

        // Volunteer-specific fields
        if (user.role === 'volunteer') {
            if (location !== undefined) user.location = location;
            if (isAvailable !== undefined) user.isAvailable = isAvailable;
            if (vehicleType !== undefined) user.vehicleType = vehicleType;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            phone: updatedUser.phone,
            role: updatedUser.role,
            organizationName: updatedUser.organizationName,
            organizationType: updatedUser.organizationType,
            registrationNumber: updatedUser.registrationNumber,
            dailyCapacity: updatedUser.dailyCapacity,
            address: updatedUser.address,
            city: updatedUser.city,
            state: updatedUser.state,
            pincode: updatedUser.pincode,
            location: updatedUser.location,
            isAvailable: updatedUser.isAvailable,
            vehicleType: updatedUser.vehicleType,
            volunteerProfile: updatedUser.volunteerProfile,
            updatedAt: updatedUser.updatedAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile
};

const User = require('../models/User');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const Assignment = require('../models/Assignment');


// ─── Dashboard Stats ────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalDonors,
            totalNGOs,
            totalVolunteers,
            totalDonations,
            totalRequests,
            totalAssignments,
            activeUsers,
            disabledUsers,
            pendingVerifications
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'donor' }),
            User.countDocuments({ role: 'ngo' }),
            User.countDocuments({ role: 'volunteer' }),
            Donation.countDocuments(),
            Request.countDocuments(),
            Assignment.countDocuments(),
            User.countDocuments({ status: 'active' }),
            User.countDocuments({ status: 'disabled' }),
            User.countDocuments({ verificationStatus: 'pending' })
        ]);

        res.json({
            totalUsers,
            totalDonors,
            totalNGOs,
            totalVolunteers,
            totalDonations,
            totalRequests,
            totalAssignments,
            activeUsers,
            disabledUsers,
            pendingVerifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─── Users CRUD ─────────────────────────────────────────────────────

// ✅ Get all users (with optional role filter, search & pagination)
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search, status, verification, page = 1, limit = 10 } = req.query;
        const filter = {};

        if (role) filter.role = role;
        if (status) filter.status = status;
        if (verification) filter.verificationStatus = verification;
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { organizationName: { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [users, total] = await Promise.all([
            User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            User.countDocuments(filter)
        ]);

        res.json({
            users,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Create user (admin can create any role)
exports.createUser = async (req, res) => {
    try {
        const {
            email, password, fullName, phone, role,
            organizationName, organizationType,
            registrationNumber, dailyCapacity,
            address, city, state, pincode
        } = req.body;

        // Validate required fields
        if (!email || !password || !fullName || !role) {
            return res.status(400).json({ message: 'Email, password, full name, and role are required' });
        }

        // Admin can only create other admin users
        if (role !== 'admin') {
            return res.status(403).json({ message: 'Admin can only create other admin users' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const userData = {
            email, password, fullName, role,
            status: 'active',
            verificationStatus: 'approved'
        };

        // Optional fields
        if (phone) userData.phone = phone;
        if (address) userData.address = address;
        if (city) userData.city = city;
        if (state) userData.state = state;
        if (pincode) userData.pincode = pincode;

        if (role === 'donor' || role === 'ngo') {
            if (organizationName) userData.organizationName = organizationName;
            if (organizationType) userData.organizationType = organizationType;
        }

        if (role === 'ngo') {
            if (registrationNumber) userData.registrationNumber = registrationNumber;
            if (dailyCapacity) userData.dailyCapacity = dailyCapacity;
        }

        const user = await User.create(userData);
        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ✅ Get single user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Update user
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const allowedFields = [
            'fullName', 'phone', 'role', 'status', 'verificationStatus',
            'organizationName', 'organizationType', 'registrationNumber',
            'dailyCapacity', 'address', 'city', 'state', 'pincode'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Toggle user status (active/disabled)
exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = user.status === 'active' ? 'disabled' : 'active';
        await user.save();

        res.json({ message: `User ${user.status}`, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Update verification status
exports.updateVerificationStatus = async (req, res) => {
    try {
        const { verificationStatus } = req.body;
        if (!['pending', 'under_review', 'approved', 'rejected'].includes(verificationStatus)) {
            return res.status(400).json({ message: 'Invalid verification status' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.verificationStatus = verificationStatus;
        await user.save();

        res.json({ message: `Verification status updated to ${verificationStatus}`, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─── Donations ──────────────────────────────────────────────────────

// ✅ Get all donations (Food Management)
exports.getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find().populate('donor');
        res.json(donations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─── Requests ───────────────────────────────────────────────────────

// ✅ Get all NGO requests (NGO Management)
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find().populate('ngo');
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─── Assignments ────────────────────────────────────────────────────

// ✅ Get all assignments (Volunteer + Logistics)
exports.getAllAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find()
            .populate('volunteer')
            .populate('donation');
        res.json(assignments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

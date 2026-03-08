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
            .populate('donor')
            .populate({
                path: 'donation',
                populate: { path: 'acceptedBy' }
            });
        res.json(assignments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Analytics ──────────────────────────────────────────────────────

// ✅ Get Analytics Dashboard Data
exports.getAnalyticsStats = async (req, res) => {
    try {
        const { timeRange } = req.query;
        let dateFilter = {};

        if (timeRange && timeRange !== 'All Time') {
            const now = new Date();
            if (timeRange === 'This Week') {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                dateFilter.createdAt = { $gte: startOfWeek };
            } else if (timeRange === 'This Month') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter.createdAt = { $gte: startOfMonth };
            } else if (timeRange === 'This Year') {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                dateFilter.createdAt = { $gte: startOfYear };
            }
        }

        const [
            allDonations,
            completedAssignments,
            activeUsers,
        ] = await Promise.all([
            Donation.find(dateFilter).populate('donor acceptedBy'),
            Assignment.find({ ...dateFilter, status: 'completed' }).populate('volunteer donation'),
            User.countDocuments({ status: 'active' })
        ]);

        const deliveredDonations = allDonations.filter(d => d.status === 'delivered');

        // Core KPIs
        const totalDonationsCount = allDonations.length;
        const servingsDistributed = deliveredDonations.reduce((sum, d) => sum + (d.estimatedServings || 0), 0);
        const wasteReduced = Math.round(servingsDistributed * 0.3); // 1 serving ≈ 0.3kg

        // Delivery Time
        let totalTimeMs = 0;
        let timeCount = 0;
        completedAssignments.forEach(a => {
            if (a.acceptedAt && a.completedAt) {
                const diff = new Date(a.completedAt) - new Date(a.acceptedAt);
                if (diff > 0) {
                    totalTimeMs += diff;
                    timeCount++;
                }
            }
        });
        const avgDeliveryTime = timeCount > 0 ? Math.round(totalTimeMs / timeCount / 60000) : 0;

        // Success Rate
        const totalAssignments = await Assignment.countDocuments();
        const successRate = totalAssignments > 0 ? Math.round((completedAssignments.length / totalAssignments) * 100) : 0;

        // Weekly Donations Data (Last 7 Days)
        const weeklyLabels = [];
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            weeklyLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));

            const dayStart = new Date(d.setHours(0, 0, 0, 0));
            const dayEnd = new Date(d.setHours(23, 59, 59, 999));

            const dayDonations = deliveredDonations.filter(don => {
                const dDate = new Date(don.createdAt);
                return dDate >= dayStart && dDate <= dayEnd;
            });
            weeklyData.push(dayDonations.length);
        }

        // Food Type Distribution
        const foodTypeCount = {
            'Cooked Food': 0,
            'Bakery Items': 0,
            'Fruits & Vegetables': 0,
            'Packaged Food': 0,
            'Other': 0
        };
        deliveredDonations.forEach(d => {
            const type = d.foodType || 'Other';
            if (foodTypeCount[type] !== undefined) foodTypeCount[type]++;
            else foodTypeCount['Other']++;
        });
        const totalFood = deliveredDonations.length || 1;
        const foodTypeDistribution = {
            'Cooked Food': Math.round((foodTypeCount['Cooked Food'] / totalFood) * 100),
            'Bakery Items': Math.round((foodTypeCount['Bakery Items'] / totalFood) * 100),
            'Fruits & Vegetables': Math.round((foodTypeCount['Fruits & Vegetables'] / totalFood) * 100),
            'Packaged Food': Math.round((foodTypeCount['Packaged Food'] / totalFood) * 100),
            'Other': Math.round((foodTypeCount['Other'] / totalFood) * 100)
        };

        // Top Donors
        // ---- Trust Score Calculation Helper (Replicated from impactController) ----
        const calculateTrustScore = async (user, deliveredDonations, completedAssignments) => {
            const uid = user._id;
            let complianceScore = 0;
            let reliabilityScore = 0;
            let feedbackScore = 0;
            let consistencyScore = 0;

            if (user.role === 'donor') {
                const userDonations = await Donation.find({ donor: uid });
                const userDelivered = userDonations.filter(d => d.status === 'delivered');
                if (userDelivered.length > 0) {
                    const hygieneOk = userDelivered.filter(d =>
                        d.hygiene && d.hygiene.safeHandling && d.hygiene.temperatureControl &&
                        d.hygiene.properPackaging && d.hygiene.noContamination
                    );
                    complianceScore = (hygieneOk.length / userDelivered.length) * 100;
                }
                if (userDonations.length > 0) {
                    const expired = userDonations.filter(d => d.status === 'expired').length;
                    reliabilityScore = ((userDelivered.length / userDonations.length) * 100) - (expired * 5);
                    reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));
                }
                const donorAssignments = await Assignment.find({ donor: uid, rating: { $exists: true, $ne: null } });
                if (donorAssignments.length > 0) {
                    const avgRating = donorAssignments.reduce((s, a) => s + a.rating, 0) / donorAssignments.length;
                    feedbackScore = (avgRating / 5) * 100;
                }
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                const recentDonations = userDonations.filter(d => new Date(d.createdAt) >= sixMonthsAgo);
                const activeMonths = new Set(recentDonations.map(d => `${new Date(d.createdAt).getFullYear()}-${new Date(d.createdAt).getMonth()}`));
                consistencyScore = Math.min(100, (activeMonths.size / 6) * 100);

            } else if (user.role === 'ngo') {
                const accepted = await Donation.find({ acceptedBy: uid });
                const userDelivered = accepted.filter(d => d.status === 'delivered');
                if (userDelivered.length > 0) {
                    const withTimestamp = userDelivered.filter(d => d.deliveredAt).length;
                    complianceScore = (withTimestamp / userDelivered.length) * 100;
                }
                if (accepted.length > 0) {
                    reliabilityScore = (userDelivered.length / accepted.length) * 100;
                }
                feedbackScore = reliabilityScore;
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                const recentAccepted = accepted.filter(d => new Date(d.createdAt) >= sixMonthsAgo);
                const activeMonths = new Set(recentAccepted.map(d => `${new Date(d.createdAt).getFullYear()}-${new Date(d.createdAt).getMonth()}`));
                consistencyScore = Math.min(100, (activeMonths.size / 6) * 100);

            } else if (user.role === 'volunteer') {
                const userAssignments = await Assignment.find({ volunteer: uid });
                const userCompleted = userAssignments.filter(a => a.status === 'completed');
                const cancelled = userAssignments.filter(a => a.status === 'cancelled');
                const transitOrDone = userAssignments.filter(a => ['in_transit', 'completed'].includes(a.status) || a.startedAt);
                const withLocation = userAssignments.filter(a =>
                    a.currentLocation && a.currentLocation.lat && a.currentLocation.lng && a.currentLocation.lastUpdated
                );
                complianceScore = transitOrDone.length > 0 ? (withLocation.length / transitOrDone.length) * 100 : 0;
                const total = userCompleted.length + cancelled.length;
                reliabilityScore = total > 0 ? (userCompleted.length / total) * 100 : 0;
                const rated = userCompleted.filter(a => a.rating != null);
                if (rated.length > 0) {
                    const avgR = rated.reduce((s, a) => s + a.rating, 0) / rated.length;
                    feedbackScore = (avgR / 5) * 100;
                }
                const isAvail = user.isAvailable ? 50 : 0;
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                const recentCompleted = userCompleted.filter(a => new Date(a.completedAt || a.createdAt) >= sixMonthsAgo);
                const activeMonths = new Set(recentCompleted.map(a => `${new Date(a.completedAt || a.createdAt).getFullYear()}-${new Date(a.completedAt || a.createdAt).getMonth()}`));
                consistencyScore = isAvail + Math.min(50, (activeMonths.size / 6) * 50);
            }

            const trustScore = Math.round(
                (complianceScore * 0.4) +
                (reliabilityScore * 0.3) +
                (feedbackScore * 0.2) +
                (consistencyScore * 0.1)
            );

            let badge = 'none';
            if (trustScore >= 85) badge = user.role === 'donor' ? 'Platinum' : 'Gold';
            else if (trustScore >= 65) badge = user.role === 'donor' ? 'Gold' : 'Silver';
            else if (trustScore >= 40) badge = 'Silver';
            else if (trustScore >= 20) badge = 'Bronze';

            return { trustScore, badge };
        };

        // Top Donors
        const donorMap = {};
        deliveredDonations.forEach(d => {
            if (d.donor && d.donor.role === 'donor') {
                const id = d.donor._id.toString();
                if (!donorMap[id]) donorMap[id] = { user: d.donor, servings: 0 };
                donorMap[id].servings += (d.estimatedServings || 0);
            }
        });
        const topDonorsRaw = Object.values(donorMap).sort((a, b) => b.servings - a.servings).slice(0, 3);
        const topDonors = await Promise.all(topDonorsRaw.map(async d => {
            const { badge } = await calculateTrustScore(d.user, deliveredDonations, completedAssignments);
            return {
                name: d.user.organizationName || d.user.fullName,
                servings: d.servings >= 1000 ? (d.servings / 1000).toFixed(1) + 'k' : d.servings.toString(),
                badge
            };
        }));

        // Top NGOs
        const ngoMap = {};
        deliveredDonations.forEach(d => {
            if (d.acceptedBy && d.acceptedBy.role === 'ngo') {
                const id = d.acceptedBy._id.toString();
                if (!ngoMap[id]) ngoMap[id] = { user: d.acceptedBy, served: 0 };
                ngoMap[id].served += (d.estimatedServings || 0);
            }
        });
        const topNGOsRaw = Object.values(ngoMap).sort((a, b) => b.served - a.served).slice(0, 3);
        const topNGOs = await Promise.all(topNGOsRaw.map(async n => {
            const { badge } = await calculateTrustScore(n.user, deliveredDonations, completedAssignments);
            return {
                name: n.user.organizationName || n.user.fullName,
                served: n.served >= 1000 ? (n.served / 1000).toFixed(1) + 'k' : n.served.toString(),
                badge
            };
        }));

        // Top Volunteers
        const volMap = {};
        completedAssignments.forEach(a => {
            if (a.volunteer && a.volunteer.role === 'volunteer') {
                const id = a.volunteer._id.toString();
                if (!volMap[id]) volMap[id] = { user: a.volunteer, deliveries: 0, totalRating: 0, ratingCount: 0 };
                volMap[id].deliveries++;
                if (a.rating) {
                    volMap[id].totalRating += a.rating;
                    volMap[id].ratingCount++;
                }
            }
        });
        const topVolunteersRaw = Object.values(volMap).sort((a, b) => b.deliveries - a.deliveries).slice(0, 3);
        const topVolunteers = await Promise.all(topVolunteersRaw.map(async v => {
            const { badge } = await calculateTrustScore(v.user, deliveredDonations, completedAssignments);
            return {
                name: v.user.fullName,
                deliveries: v.deliveries,
                badge,
                rating: v.ratingCount > 0 ? (v.totalRating / v.ratingCount).toFixed(1) : 0
            };
        }));

        // Recent Activity
        const recentDonations = await Donation.find().sort({ createdAt: -1 }).limit(3).populate('donor acceptedBy');
        const recentActivity = recentDonations.map(d => {
            const timeDiff = Math.abs(new Date() - new Date(d.createdAt));
            const hours = Math.floor(timeDiff / 3600000);
            const mins = Math.floor((timeDiff % 3600000) / 60000);
            const timeStr = hours > 0 ? `${hours} hr ago` : (mins > 0 ? `${mins} min ago` : 'Just now');
            let msg = `${d.donor ? (d.donor.organizationName || d.donor.fullName) : 'Someone'} created a donation`;
            if (d.status === 'delivered') msg = `${d.donor ? (d.donor.organizationName || d.donor.fullName) : 'Someone'}'s donation was delivered`;
            else if (d.status === 'accepted' && d.acceptedBy) msg = `${d.acceptedBy.organizationName || d.acceptedBy.fullName} accepted a donation`;
            return { message: msg, time: timeStr };
        });

        res.json({
            totalDonations: totalDonationsCount,
            servingsDistributed,
            activeUsers,
            wasteReduced,
            avgDeliveryTime,
            successRate,
            foodTypeDistribution,
            weeklyDonations: { labels: weeklyLabels, data: weeklyData },
            topDonors: topDonors.length ? topDonors : [{ name: "No Data", servings: "0" }],
            topNGOs: topNGOs.length ? topNGOs : [{ name: "No Data", served: "0" }],
            topVolunteers: topVolunteers.length ? topVolunteers : [{ name: "No Data", deliveries: 0, rating: 0 }],
            recentActivity: recentActivity.length ? recentActivity : [{ message: "No recent activity", time: "Just now" }]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
};

const User = require('../models/User');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const Assignment = require('../models/Assignment');


// ✅ Get all users (User Management)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


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

const express = require('express');
const router = express.Router();
const {
    getDonorImpact,
    getNgoImpact,
    getVolunteerImpact,
    getAdminImpact
} = require('../controllers/impactController');

const { protect, adminOnly } = require('../middleware/auth');

// Role-specific middleware (similar to the ones used in User but local for impact routing)
const donorOnly = (req, res, next) => {
    if (req.user && req.user.role === 'donor') next();
    else res.status(403).json({ success: false, message: 'Not authorized as a donor' });
};

const ngoOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ngo') next();
    else res.status(403).json({ success: false, message: 'Not authorized as an NGO' });
};

const volunteerOnly = (req, res, next) => {
    if (req.user && req.user.role === 'volunteer') next();
    else res.status(403).json({ success: false, message: 'Not authorized as a volunteer' });
};

// Protect all routes below
router.use(protect);

router.get('/donor', donorOnly, getDonorImpact);
router.get('/ngo', ngoOnly, getNgoImpact);
router.get('/volunteer', volunteerOnly, getVolunteerImpact);
router.get('/admin', adminOnly, getAdminImpact);

module.exports = router;

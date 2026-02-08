const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

const {
    getAllUsers,
    getAllDonations,
    getAllRequests,
    getAllAssignments
} = require('../controllers/adminController');

router.get('/users', protect, adminOnly, getAllUsers);
router.get('/donations', protect, adminOnly, getAllDonations);
router.get('/requests', protect, adminOnly, getAllRequests);
router.get('/assignments', protect, adminOnly, getAllAssignments);

module.exports = router;

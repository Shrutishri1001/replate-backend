const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

const {
    getDashboardStats,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    updateVerificationStatus,
    getAllDonations,
    getAllRequests,
    getAllAssignments
} = require('../controllers/adminController');

// Dashboard
router.get('/stats', protect, adminOnly, getDashboardStats);

// Users CRUD
router.get('/users', protect, adminOnly, getAllUsers);
router.post('/users', protect, adminOnly, createUser);
router.get('/users/:id', protect, adminOnly, getUserById);
router.put('/users/:id', protect, adminOnly, updateUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/users/:id/toggle-status', protect, adminOnly, toggleUserStatus);
router.put('/users/:id/verification', protect, adminOnly, updateVerificationStatus);

// Other resources
router.get('/donations', protect, adminOnly, getAllDonations);
router.get('/requests', protect, adminOnly, getAllRequests);
router.get('/assignments', protect, adminOnly, getAllAssignments);

module.exports = router;

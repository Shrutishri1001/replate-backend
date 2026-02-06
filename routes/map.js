const express = require('express');
const router = express.Router();
const {
    getMapDonations,
    getMapVolunteers,
    getActiveAssignments,
    getAllMapData
} = require('../controllers/mapController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Map data routes
router.get('/donations', getMapDonations);
router.get('/volunteers', getMapVolunteers);
router.get('/assignments/active', getActiveAssignments);
router.get('/all', getAllMapData);

module.exports = router;

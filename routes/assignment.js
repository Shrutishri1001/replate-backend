const express = require('express');
const router = express.Router();
const {
    createAssignment,
    getVolunteerAssignments,
    acceptAssignment,
    updateLocation,
    completeAssignment,
    cancelAssignment,
    getAllAssignments,
    getAvailableAssignments,
    claimAssignment,
    updateVolunteerProfile,
    getAssignmentMapData
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/:id/map', getAssignmentMapData);

// All other routes require authentication
router.use(protect);

// Assignment routes
router.get('/available', getAvailableAssignments);
router.post('/claim', claimAssignment);
router.post('/create', createAssignment);
router.get('/', getAllAssignments);
router.get('/volunteer/:volunteerId', getVolunteerAssignments);
router.put('/:id/accept', acceptAssignment);
router.put('/:id/update-location', updateLocation);
router.put('/volunteer-profile', updateVolunteerProfile);
router.put('/:id/complete', completeAssignment);
router.put('/:id/cancel', cancelAssignment);

module.exports = router;

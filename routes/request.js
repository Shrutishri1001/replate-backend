const express = require('express');
const router = express.Router();
const {
    createRequest,
    getRequests,
    getRequest,
    acceptRequest,
    assignVolunteer,
    pickupRequest,
    deliverRequest,
    cancelRequest,
    deleteRequest
} = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Request routes
router.post('/', createRequest);
router.get('/', getRequests);
router.get('/:id', getRequest);
router.put('/:id/accept', acceptRequest);
router.put('/:id/assign-volunteer', assignVolunteer);
router.put('/:id/pickup', pickupRequest);
router.put('/:id/deliver', deliverRequest);
router.put('/:id/cancel', cancelRequest);
router.delete('/:id', deleteRequest);

module.exports = router;

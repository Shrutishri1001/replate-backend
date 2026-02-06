const express = require('express');
const router = express.Router();
const {
    createDonation,
    getDonations,
    getAvailableDonations,
    getDonation,
    updateDonation,
    deleteDonation,
    acceptDonation,
    markPickedUp,
    markDelivered
} = require('../controllers/donationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Available donations for NGOs
router.get('/available', getAvailableDonations);

// Donation CRUD
router.post('/', createDonation);
router.get('/', getDonations);
router.get('/:id', getDonation);
router.put('/:id', updateDonation);
router.delete('/:id', deleteDonation);

// Status updates
router.put('/:id/accept', acceptDonation);
router.put('/:id/pickup', markPickedUp);
router.put('/:id/deliver', markDelivered);

module.exports = router;

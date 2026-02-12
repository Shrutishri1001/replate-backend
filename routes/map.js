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
router.get('/ngos', (req, res) => {
    try {
        res.json([]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching NGO locations', error: error.message });
    }
});
router.get('/assignments/active', getActiveAssignments);
router.get('/active-assignments', getActiveAssignments);

// Route calculation
router.post('/calculate-route', (req, res) => {
    try {
        const { pickupLocation, deliveryLocation } = req.body;
        
        if (!pickupLocation || !deliveryLocation || 
            typeof pickupLocation.lat !== 'number' || typeof pickupLocation.lng !== 'number' ||
            typeof deliveryLocation.lat !== 'number' || typeof deliveryLocation.lng !== 'number') {
            return res.status(400).json({ message: 'Invalid location coordinates' });
        }

        // Return mock route data
        res.json({ 
            distance: 5.2,
            duration: '12 mins',
            route: [pickupLocation, deliveryLocation]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error calculating route', error: error.message });
    }
});

// Location search
router.get('/location-search', (req, res) => {
    try {
        res.json([]);
    } catch (error) {
        res.status(500).json({ message: 'Error searching locations', error: error.message });
    }
});

// Nearby donations
router.get('/nearby-donations', (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        
        if (!lat || !lng || !radius) {
            return res.status(400).json({ message: 'lat, lng, and radius parameters are required' });
        }

        res.json([]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching nearby donations', error: error.message });
    }
});

// Update location
router.put('/update-location', (req, res) => {
    try {
        res.json({ message: 'Location updated', location: req.body });
    } catch (error) {
        res.status(500).json({ message: 'Error updating location', error: error.message });
    }
});

router.get('/all', getAllMapData);

module.exports = router;

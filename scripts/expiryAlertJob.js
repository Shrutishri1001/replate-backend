/**
 * Expiry Alert Job — runs on a setInterval, no external dependencies.
 *
 * Every 30 minutes it:
 *  1. Finds pending donations expiring within the next 2 hours that haven't
 *     had an expiry alert sent yet.
 *  2. Notifies matched NGOs (GPS ≤ 10km + capacity) with an urgency alert.
 *  3. Notifies the donor if the food has still not been accepted.
 */

const Donation = require('../models/Donation');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');
const { calculateDistance } = require('../utils/distance');

const ALERT_WINDOW_MS = 2 * 60 * 60 * 1000;   // 2 hours
const MAX_DISTANCE_KM = 10;
const INTERVAL_MS = 30 * 60 * 1000;            // 30 minutes

const runExpiryAlerts = async () => {
    try {
        const now = new Date();
        const alertCutoff = new Date(now.getTime() + ALERT_WINDOW_MS);

        // Fetch pending donations that have not yet triggered an expiry alert
        const donations = await Donation.find({
            status: 'pending',
            expiryAlertSent: { $ne: true }
        }).populate('donor', 'fullName email');

        for (const donation of donations) {
            if (!donation.expiryDate || !donation.expiryTime) continue;

            const expiryDateTime = new Date(`${donation.expiryDate}T${donation.expiryTime}`);

            // Only act if expiry is within alert window and hasn't passed yet
            if (expiryDateTime <= now || expiryDateTime > alertCutoff) continue;

            const minutesLeft = Math.round((expiryDateTime - now) / 60000);
            const size = donation.estimatedServings || donation.quantity || 0;
            const dLat = donation.location?.lat;
            const dLng = donation.location?.lng;

            // --- Alert matched NGOs ---
            if (dLat && dLng) {
                const ngos = await User.find({ role: 'ngo', status: 'active' });
                const matchedNgos = ngos
                    .map(ngo => ({
                        ngo,
                        distance: (ngo.location?.lat && ngo.location?.lng)
                            ? calculateDistance(dLat, dLng, ngo.location.lat, ngo.location.lng)
                            : Infinity
                    }))
                    .filter(m => m.distance <= MAX_DISTANCE_KM && size <= (m.ngo.dailyCapacity || 0))
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 3);

                for (const { ngo, distance } of matchedNgos) {
                    await createNotification({
                        recipient: ngo._id,
                        title: '⚠️ Urgent: Donation Expiring Soon',
                        message: `A donation of ${size} servings is expiring in ${minutesLeft} min and is only ${distance.toFixed(1)}km away. Accept before it's too late!`,
                        type: 'new_assignment',
                        data: { donationId: donation._id }
                    });
                }
            }

            // --- Alert donor if food still not accepted ---
            if (!donation.acceptedBy) {
                await createNotification({
                    recipient: donation.donor._id || donation.donor,
                    title: '⏰ Your Food is Expiring Soon',
                    message: `Your donation "${donation.foodName}" expires in ${minutesLeft} minutes and has not been claimed yet. Consider contacting nearby NGOs directly.`,
                    type: 'status_update',
                    data: { donationId: donation._id }
                });
            }

            // Mark alert as sent so we don't fire again
            donation.expiryAlertSent = true;
            await donation.save();

            console.log(`[ExpiryAlert] Sent alerts for donation: ${donation._id} (${minutesLeft} min left)`);
        }
    } catch (err) {
        console.error('[ExpiryAlert] Error during expiry alert job:', err.message);
    }
};

const startExpiryAlertJob = () => {
    console.log('[ExpiryAlert] Expiry alert job started — checking every 30 minutes.');
    runExpiryAlerts(); // Run immediately on startup
    setInterval(runExpiryAlerts, INTERVAL_MS);
};

module.exports = { startExpiryAlertJob, runExpiryAlerts };

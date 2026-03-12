/**
 * Expiry Alert Job — runs on a setInterval, no external dependencies.
 *
 *  1. Finds pending donations expiring within the next 2 hours that haven't
 *     had an expiry alert sent yet.
 *  2. Notifies matched NGOs (GPS ≤ 10km + capacity) with an urgency alert.
 *  3. Notifies the donor if the food has still not been accepted.
 *  4. Detects donations that have ALREADY expired. Marks them as 'expired'
 *     and notifies Donor, NGO (if accepted), and Volunteer (if assigned).
 */

const Donation = require('../models/Donation');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');
const { calculateDistance } = require('../utils/distance');

const ALERT_WINDOW_MS = 2 * 60 * 60 * 1000;   // 2 hours
const MAX_DISTANCE_KM = 10;
const INTERVAL_MS = 1 * 60 * 1000;            // 1 minute (for fast expiry detection)

const runExpiryAlerts = async () => {
    try {
        const now = new Date();
        const alertCutoff = new Date(now.getTime() + ALERT_WINDOW_MS);

        // Fetch donations that either:
        // 1. Need an impending expiry alert (status: pending, no expiry alert sent)
        // 2. Are past their expiry time and not yet marked expired or delivered/cancelled

        const activeDonations = await Donation.find({
            status: { $in: ['pending', 'accepted', 'assigned', 'in_transit', 'picked_up'] }
        }).populate('donor', 'fullName email')
          .populate('acceptedBy', 'fullName _id')
          .populate('assignedTo', 'fullName _id');

        for (const donation of activeDonations) {
            if (!donation.expiryDate || !donation.expiryTime) continue;

            const expiryDateTime = new Date(`${donation.expiryDate}T${donation.expiryTime}`);

            // --- Action 1: Mark As Expired if Passed ---
            if (expiryDateTime <= now) {
                donation.status = 'expired';
                await donation.save();

                // Notify Donor
                await createNotification({
                    recipient: donation.donor._id || donation.donor,
                    title: 'Food Expired',
                    message: `Your donation "${donation.foodName}" has expired and the offering has been cancelled.`,
                    type: 'food_expired',
                    data: { donationId: donation._id }
                });

                // Notify NGO if they accepted it
                if (donation.acceptedBy) {
                    await createNotification({
                        recipient: donation.acceptedBy._id || donation.acceptedBy,
                        title: 'Accepted Food Expired',
                        message: `The donation "${donation.foodName}" you accepted has expired before pickup. It has been cancelled.`,
                        type: 'food_expired',
                        data: { donationId: donation._id }
                    });
                }

                // Notify Volunteer if they were assigned
                if (donation.assignedTo) {
                    await createNotification({
                        recipient: donation.assignedTo._id || donation.assignedTo,
                        title: 'Pickup Cancelled - Food Expired',
                        message: `Your pickup for "${donation.foodName}" has been cancelled because the food has expired.`,
                        type: 'food_expired',
                        data: { donationId: donation._id }
                    });
                }

                console.log(`[ExpiryAlert] Marked donation ${donation._id} as expired.`);
                continue; // Move to next donation
            }

            // --- Action 2: Send Approaching Expiry Alert ---
            // Only act if within alert window and hasn't had an alert sent yet
            if (expiryDateTime > alertCutoff || donation.expiryAlertSent) continue;
            
            // Impending expiry alerts only apply if it's still pending
            if (donation.status !== 'pending') continue;

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
    console.log('[ExpiryAlert] Expiry alert job started — checking every 1 minute.');
    runExpiryAlerts(); // Run immediately on startup
    setInterval(runExpiryAlerts, INTERVAL_MS);
};

module.exports = { startExpiryAlertJob, runExpiryAlerts };

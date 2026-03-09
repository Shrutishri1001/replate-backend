const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { calculateDistance } = require('../utils/distance');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const MAX_VOLUNTEER_TO_PICKUP_KM = 15;
const MAX_VOLUNTEER_TO_NGO_KM = 20;

const traceMatching = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const volunteer = await User.findOne({ email: 'vol2@foodshare.com' });
        const volunteerCity = (volunteer.city || '').toLowerCase().trim();
        const vLat = volunteer.location?.lat;
        const vLng = volunteer.location?.lng;
        const volunteerMaxWeight = Number(volunteer.volunteerProfile?.maxWeight) || 0;

        console.log(`Volunteer: ${volunteer.fullName} (${volunteer.email})`);
        console.log(`- City: "${volunteerCity}"`);
        console.log(`- Location: ${vLat}, ${vLng}`);
        console.log(`- Max Weight: ${volunteerMaxWeight}`);

        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const today = days[new Date().getDay()];
        const schedule = volunteer.volunteerProfile?.availabilitySchedule?.[today];
        const isScheduledToday = schedule ? schedule.active : true;
        console.log(`- Scheduled Today (${today}): ${isScheduledToday}`);

        const query = {
            status: 'accepted',
            assignedTo: null,
            acceptedBy: { $exists: true, $ne: null }
        };

        const donations = await Donation.find(query)
            .populate('donor', '-password')
            .populate('acceptedBy', 'location city organizationName');

        console.log(`\nFound ${donations.length} accepted donations in DB.`);

        for (const d of donations) {
            console.log(`\n--- Tracing Donation: ${d.foodName} (${d._id}) ---`);

            // 1. Scheduled check
            if (!isScheduledToday) {
                console.log('  [FAIL] Not scheduled today');
                continue;
            } else {
                console.log('  [PASS] Scheduled today');
            }

            // 2. Expiry check
            if (d.expiryDate && d.expiryTime) {
                const expiryDateTime = new Date(`${d.expiryDate}T${d.expiryTime}`);
                if (new Date() >= expiryDateTime) {
                    console.log(`  [FAIL] Expired at ${d.expiryDate} ${d.expiryTime}`);
                    continue;
                }
            }
            console.log('  [PASS] Not expired');

            // 3. Weight capacity check
            const dQty = Number(d.quantity) || 0;
            if (d.unit === 'kg' && volunteerMaxWeight > 0 && volunteerMaxWeight < dQty) {
                console.log(`  [FAIL] Capacity: ${volunteerMaxWeight}kg < ${dQty}kg`);
                continue;
            }
            console.log(`  [PASS] Capacity: ${volunteerMaxWeight}kg >= ${dQty}${d.unit}`);

            // 4. Proximity check
            const dLat = d.location?.lat || d.donor?.location?.lat;
            const dLng = d.location?.lng || d.donor?.location?.lng;
            const ngoLat = d.acceptedBy?.location?.lat;
            const ngoLng = d.acceptedBy?.location?.lng;

            const hasVolunteerGPS = (vLat != null && vLng != null);
            const hasDonationGPS = (dLat != null && dLng != null);
            const hasNgoGPS = (ngoLat != null && ngoLng != null);

            console.log(`  - Volunteer GPS: ${hasVolunteerGPS}, Donation GPS: ${hasDonationGPS}, NGO GPS: ${hasNgoGPS}`);

            if (hasVolunteerGPS && hasDonationGPS) {
                const distToPickup = calculateDistance(vLat, vLng, dLat, dLng);
                console.log(`  - Distance to Pickup: ${distToPickup.toFixed(2)} km (Limit: ${MAX_VOLUNTEER_TO_PICKUP_KM})`);
                if (distToPickup > MAX_VOLUNTEER_TO_PICKUP_KM) {
                    console.log('  [FAIL] Too far from pickup');
                    continue;
                }

                if (hasNgoGPS) {
                    const distToNgo = calculateDistance(vLat, vLng, ngoLat, ngoLng);
                    console.log(`  - Distance to NGO: ${distToNgo.toFixed(2)} km (Limit: ${MAX_VOLUNTEER_TO_NGO_KM})`);
                    if (distToNgo > MAX_VOLUNTEER_TO_NGO_KM) {
                        console.log('  [FAIL] Too far from NGO');
                        continue;
                    }
                }
            } else {
                const donationCity = (d.city || d.donor?.city || '').toLowerCase().trim();
                const ngoCity = (d.acceptedBy?.city || '').toLowerCase().trim();
                console.log(`  - Volunteer City: "${volunteerCity}", Donation City: "${donationCity}", NGO City: "${ngoCity}"`);
                if (volunteerCity && donationCity && volunteerCity !== donationCity) {
                    console.log('  [FAIL] City mismatch');
                    continue;
                }
            }
            console.log('  [SUCCESS] Donation should be visible!');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

traceMatching();

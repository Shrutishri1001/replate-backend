const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const { calculateDistance } = require('../utils/distance');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const debugMatching = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to database");

        // 1. Find NGOs who have accepted donations
        const acceptedDonations = await Donation.find({ status: 'accepted', assignedTo: null })
            .populate('donor')
            .populate('acceptedBy');

        console.log(`\nFound ${acceptedDonations.length} accepted donations without a volunteer.`);

        for (const d of acceptedDonations) {
            console.log(`\n--- Donation: ${d.foodName} (${d._id}) ---`);
            console.log(`- Status: ${d.status}`);
            console.log(`- Accepted By: ${d.acceptedBy?.organizationName || d.acceptedBy?.fullName} (${d.acceptedBy?.email})`);
            console.log(`- City: ${d.city || d.donor?.city}`);
            console.log(`- Location: ${JSON.stringify(d.location)}`);
            console.log(`- Expiry: ${d.expiryDate} ${d.expiryTime}`);

            // Check if it's expired
            if (d.expiryDate && d.expiryTime) {
                const expiryDateTime = new Date(`${d.expiryDate}T${d.expiryTime}`);
                if (new Date() >= expiryDateTime) {
                    console.log('  [X] Expired');
                }
            }

            // Find volunteers in the same city
            const city = (d.city || d.donor?.city || '').toLowerCase().trim();
            const volunteers = await User.find({ role: 'volunteer' });

            console.log(`\nPotential Volunteers (${volunteers.length} total):`);
            for (const v of volunteers) {
                const vCity = (v.city || '').toLowerCase().trim();
                console.log(`  - Volunteer: ${v.fullName} (${v.email}) | City: ${v.city}`);

                // Check filters
                const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
                const schedule = v.volunteerProfile?.availabilitySchedule?.[day];
                const isScheduled = schedule ? schedule.active : true;

                const vLat = v.location?.lat;
                const vLng = v.location?.lng;
                const dLat = d.location?.lat || d.donor?.location?.lat;
                const dLng = d.location?.lng || d.donor?.location?.lng;

                let distPass = true;
                let distMsg = 'N/A';
                if (vLat != null && vLng != null && dLat != null && dLng != null) {
                    const dist = calculateDistance(vLat, vLng, dLat, dLng);
                    distMsg = `${dist.toFixed(2)} km`;
                    if (dist > 15) distPass = false;
                } else if (vCity !== city) {
                    distPass = false;
                    distMsg = 'City mismatch';
                }

                console.log(`    - Schedule (${day}): ${isScheduled ? 'Active' : 'Inactive'}`);
                console.log(`    - Proximity/City: ${distMsg} | Pass: ${distPass}`);

                const dQty = Number(d.quantity) || 0;
                const vMax = Number(v.volunteerProfile?.maxWeight) || 0;
                let capPass = (d.unit !== 'kg' || vMax <= 0 || vMax >= dQty);
                console.log(`    - Capacity: ${vMax}kg vs ${dQty}${d.unit} | Pass: ${capPass}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugMatching();

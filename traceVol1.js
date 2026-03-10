const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const Donation = require('./models/Donation');

    const volunteer = await User.findOne({ email: 'vol1@foodshare.com' });
    if (!volunteer) {
        console.log("Volunteer 1 not found!");
        process.exit(1);
    }

    console.log(`Checking for Volunteer: ${volunteer.fullName} (${volunteer.email})`);
    console.log(`City: ${volunteer.city}, MaxWeight: ${volunteer.volunteerProfile?.maxWeight}`);

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = days[new Date().getDay()];
    const schedule = volunteer.volunteerProfile?.availabilitySchedule?.[today];
    console.log(`Today is ${today}. Schedule active: ${schedule?.active}`);

    const query = {
        status: 'accepted',
        assignedTo: null,
        acceptedBy: { $exists: true, $ne: null }
    };

    const donations = await Donation.find(query).populate('donor').populate('acceptedBy');
    console.log(`Found ${donations.length} accepted donations in DB.\n`);

    donations.forEach(d => {
        console.log(`--- Checking Donation: ${d.foodName} ---`);
        console.log(`Status: ${d.status}, Quantity: ${d.quantity} ${d.unit}, City: ${d.city}`);

        // 1. Schedule
        if (!schedule?.active) {
            console.log("X FAILED: Volunteer not active today");
        } else {
            console.log("✓ PASSED: Schedule");
        }

        // 2. Expiry
        if (d.expiryDate && d.expiryTime) {
            const expiryDateTime = new Date(`${d.expiryDate}T${d.expiryTime}`);
            if (new Date() >= expiryDateTime) {
                console.log("X FAILED: Expired");
            } else {
                console.log("✓ PASSED: Expiry");
            }
        }

        // 3. Weight
        const dQty = Number(d.quantity) || 0;
        const vMax = Number(volunteer.volunteerProfile?.maxWeight) || 0;
        if (d.unit === 'kg' && vMax > 0 && vMax < dQty) {
            console.log(`X FAILED: Capacity Mismatch (Donation ${dQty}kg > Volunteer ${vMax}kg)`);
        } else {
            console.log("✓ PASSED: Capacity");
        }

        // 4. Proximity
        const vLat = volunteer.location?.lat;
        const vLng = volunteer.location?.lng;
        const dLat = d.location?.lat || d.donor?.location?.lat;
        const dLng = d.location?.lng || d.donor?.location?.lng;

        if (vLat != null && vLng != null && dLat != null && dLng != null) {
            console.log("✓ Using GPS proximity");
        } else {
            const vCity = (volunteer.city || '').toLowerCase().trim();
            const dCity = (d.city || d.donor?.city || '').toLowerCase().trim();
            if (vCity && dCity && vCity !== dCity) {
                console.log(`X FAILED: City Mismatch ("${vCity}" vs "${dCity}")`);
            } else {
                console.log("✓ PASSED: City Match");
            }
        }
        console.log("\n");
    });

    process.exit(0);
});

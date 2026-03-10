const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const MAX_VOLUNTEER_TO_PICKUP_KM = 15;
const MAX_VOLUNTEER_TO_NGO_KM = 20;

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const Donation = require('./models/Donation');

    const volunteer = await User.findOne({ fullName: /Aravind/i });
    const volunteerCity = (volunteer.city || '').toLowerCase().trim();
    const vLat = volunteer.location?.lat;
    const vLng = volunteer.location?.lng;
    const volunteerMaxWeight = Number(volunteer.volunteerProfile?.maxWeight) || 0;

    console.log(`Volunteer: ${volunteer.fullName}, City: ${volunteerCity}, Lat: ${vLat}, Lng: ${vLng}`);

    const query = {
        status: 'accepted',
        assignedTo: null,
        acceptedBy: { $exists: true, $ne: null }
    };

    const donations = await Donation.find(query)
        .populate('donor')
        .populate('acceptedBy');

    console.log(`Found ${donations.length} accepted donations.`);

    const filtered = donations.filter(d => {
        console.log(`Checking donation: ${d.foodName}`);

        const dLat = d.location?.lat || d.donor?.location?.lat;
        const dLng = d.location?.lng || d.donor?.location?.lng;
        const ngoLat = d.acceptedBy?.location?.lat;
        const ngoLng = d.acceptedBy?.location?.lng;

        const hasVolunteerGPS = (vLat != null && vLng != null);
        const hasDonationGPS = (dLat != null && dLng != null);
        const hasNgoGPS = (ngoLat != null && ngoLng != null);

        console.log(`- hasVolunteerGPS: ${hasVolunteerGPS}, hasDonationGPS: ${hasDonationGPS}, hasNgoGPS: ${hasNgoGPS}`);

        if (hasVolunteerGPS && hasDonationGPS) {
            const distToPickup = calculateDistance(vLat, vLng, dLat, dLng);
            console.log(`- distToPickup: ${distToPickup}`);
            if (distToPickup > MAX_VOLUNTEER_TO_PICKUP_KM) return false;

            if (hasNgoGPS) {
                const distToNgo = calculateDistance(vLat, vLng, ngoLat, ngoLng);
                console.log(`- distToNgo: ${distToNgo}`);
                if (distToNgo > MAX_VOLUNTEER_TO_NGO_KM) return false;
            }
        } else {
            const donationCity = (d.city || d.donor?.city || '').toLowerCase().trim();
            const ngoCity = (d.acceptedBy?.city || '').toLowerCase().trim();
            console.log(`- volunteerCity: "${volunteerCity}", donationCity: "${donationCity}", ngoCity: "${ngoCity}"`);
            if (volunteerCity && donationCity && volunteerCity !== donationCity) {
                console.log("- City mismatch!");
                return false;
            }
        }
        return true;
    });

    console.log(`Filtered result count: ${filtered.length}`);
    process.exit(0);
});

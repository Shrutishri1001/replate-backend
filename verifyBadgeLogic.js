const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    const p1 = parseFloat(lat1), l1 = parseFloat(lon1), p2 = parseFloat(lat2), l2 = parseFloat(lon2);
    if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) return Infinity;
    const R = 6371;
    const dLat = (p2 - p1) * Math.PI / 180;
    const dLon = (l2 - l1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1 * Math.PI / 180) * Math.cos(p2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(Math.max(0, Math.min(1, a))), Math.sqrt(Math.max(0, 1 - a)));
    return R * c;
};

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const Donation = require('./models/Donation');

    const v = await User.findOne({ fullName: /Aravind/i });
    const donations = await Donation.find({ status: 'accepted', assignedTo: null }).populate('donor');

    const vLat = v.location?.lat, vLng = v.location?.lng;
    const vMaxWeight = Number(v.volunteerProfile?.maxWeight) || 0;
    const MAX_VOLUNTEER_TO_PICKUP_KM = 50;

    console.log(`Volunteer: ${v.fullName}, Lat: ${vLat}, Lng: ${vLng}`);
    console.log(`Total Accepted Donations: ${donations.length}\n`);

    const scored = donations.map(d => {
        const dLat = d.location?.lat || d.donor?.location?.lat;
        const dLng = d.location?.lng || d.donor?.location?.lng;

        let distanceScore = 15;
        let dist = Infinity;
        if (vLat != null && vLng != null && dLat != null && dLng != null) {
            dist = calculateDistance(vLat, vLng, dLat, dLng);
            distanceScore = Math.max(0, 30 * (1 - dist / MAX_VOLUNTEER_TO_PICKUP_KM));
        }

        let urgencyScore = 0;
        let expiryMs = Infinity;
        if (d.expiryDate && d.expiryTime) {
            expiryMs = new Date(`${d.expiryDate}T${d.expiryTime}`) - Date.now();
            const twelveHoursMs = 12 * 60 * 60 * 1000;
            if (expiryMs > 0) {
                urgencyScore = Math.min(50, 50 * (1 - Math.min(expiryMs, twelveHoursMs) / twelveHoursMs));
            }
        }

        const dQty = Number(d.quantity) || 0;
        const capacityFit = (d.unit !== 'kg' || vMaxWeight <= 0 || vMaxWeight >= dQty) ? 20 : 0;

        const score = Math.round(distanceScore + urgencyScore + capacityFit);
        return { name: d.foodName, score, dist, expiryMs, urgencyScore, distanceScore, capacityFit };
    }).sort((a, b) => b.score - a.score);

    scored.forEach((s, i) => {
        const isRecommended = (i === 0 && s.score >= 30);
        console.log(`${isRecommended ? '[⭐ RECOMMENDED]' : '[ ]'} ${s.name}`);
        console.log(`   Score: ${s.score} (Dist: ${s.distanceScore.toFixed(1)}, Urg: ${s.urgencyScore.toFixed(1)}, Cap: ${s.capacityFit})`);
        console.log(`   Distance: ${s.dist.toFixed(2)} km, Expiry: ${Math.round(s.expiryMs / 3600000)}h remaining\n`);
    });

    process.exit(0);
});

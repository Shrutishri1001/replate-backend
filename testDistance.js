const { calculateDistance } = require('./utils/distance');

// Bangalore to Chennai (~290km)
const lat1 = 12.9716, lon1 = 77.5946;
const lat2 = 13.0827, lon2 = 80.2707;

const dist = calculateDistance(lat1, lon1, lat2, lon2);
console.log(`Distance: ${dist.toFixed(2)} km`);

// Expect around 290-300 km
if (dist > 280 && dist < 320) {
    console.log("Formula seems correct for Large Distances.");
} else {
    console.log("Formula might be wrong.");
}

// Same point (0km)
const distZero = calculateDistance(lat1, lon1, lat1, lon1);
console.log(`Zero Distance: ${distZero.toFixed(2)} km`);

// Test with 0.1 degree shift (~11km at equator)
const distSmall = calculateDistance(0, 0, 0, 0.1);
console.log(`Small Distance (0.1 deg): ${distSmall.toFixed(2)} km`);

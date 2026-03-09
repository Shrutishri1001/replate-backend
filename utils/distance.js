/**
 * Haversine formula — calculate great-circle distance between two GPS points.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometres, or Infinity if any coord is missing
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;

    // Ensure numeric values
    const p1 = parseFloat(lat1);
    const l1 = parseFloat(lon1);
    const p2 = parseFloat(lat2);
    const l2 = parseFloat(lon2);

    if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) return Infinity;

    const R = 6371; // Earth's radius in km
    const dLat = (p2 - p1) * Math.PI / 180;
    const dLon = (l2 - l1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1 * Math.PI / 180) * Math.cos(p2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    // Clamp 'a' to [0, 1] to avoid NaN in Math.sqrt due to floating point errors
    const c = 2 * Math.atan2(Math.sqrt(Math.max(0, Math.min(1, a))), Math.sqrt(Math.max(0, 1 - a)));

    return R * c;
};

module.exports = { calculateDistance };

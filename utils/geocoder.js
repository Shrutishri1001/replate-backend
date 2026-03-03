const geocodeAddress = async (address, city, pincode) => {
    try {
        const query = `${address}, ${city}, ${pincode}`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Replate-FoodShare/1.0'
            }
        });

        if (!response.ok) {
            throw new Error('Geocoding service unavailable');
        }

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error.message);
        return null;
    }
};

module.exports = geocodeAddress;

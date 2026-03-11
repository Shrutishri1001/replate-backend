const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Donation = require('./models/Donation');
const User = require('./models/User');
const { runExpiryAlerts } = require('./scripts/expiryAlertJob');

dotenv.config();

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Create a dummy donor
    const donor = await User.findOne({ role: 'donor' });
    if (!donor) {
        console.log("No donor found");
        process.exit(1);
    }

    // 2. Create a donation that is already expired
    const now = new Date();
    const pastHour = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    
    const expiryDate = pastHour.toISOString().split('T')[0];
    const expiryTime = pastHour.toISOString().split('T')[1].substring(0, 5);

    const donation = await Donation.create({
        donor: donor._id,
        foodType: 'Cooked Food',
        foodName: 'Test Expired Notification Food',
        quantity: 10,
        unit: 'servings',
        estimatedServings: 10,
        preparationDate: expiryDate,
        preparationTime: '10:00',
        expiryDate: expiryDate,
        expiryTime: expiryTime,
        storageCondition: 'Room Temperature (20-25°C)',
        hygiene: {
            safeHandling: true,
            temperatureControl: true,
            properPackaging: true,
            noContamination: true
        },
        pickupAddress: 'Test Location',
        city: 'Testing',
        pickupDeadline: expiryTime,
        status: 'pending'
    });

    console.log(`Created test donation: ${donation._id}`);
    
    // 3. Run the alerts job
    console.log("Running expiry alerts job...");
    await runExpiryAlerts();
    
    console.log("Job finished.");
    process.exit(0);
}

test();

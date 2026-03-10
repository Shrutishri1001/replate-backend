const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Donation = require('./models/Donation');

dotenv.config();

const checkStats = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connected to: ${mongoose.connection.name}`);

        const totalDonations = await Donation.countDocuments();
        const donor1 = await User.findOne({ email: 'donor1@foodshare.com' });

        if (donor1) {
            const donor1Donations = await Donation.countDocuments({ donor: donor1._id });
            console.log(`donor1@foodshare.com ID: ${donor1._id}`);
            console.log(`Total Donations in DB: ${totalDonations}`);
            console.log(`Donations for donor1: ${donor1Donations}`);

            const sampleDonation = await Donation.findOne({ donor: donor1._id });
            if (sampleDonation) {
                console.log(`Sample Donation Donor Field Type: ${typeof sampleDonation.donor}`);
                console.log(`Sample Donation Donor Field Value: ${sampleDonation.donor}`);
            }
        } else {
            console.log("donor1@foodshare.com not found!");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStats();

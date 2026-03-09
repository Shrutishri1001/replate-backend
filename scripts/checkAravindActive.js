const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Assignment = require('../models/Assignment');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const checkAravindActive = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const aravindId = '69abb5e8013317a341019d55';
        const assignments = await Assignment.find({ volunteer: aravindId, status: { $in: ['pending', 'accepted', 'in_transit'] } });
        console.log('Active assignments:', assignments.length);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAravindActive();

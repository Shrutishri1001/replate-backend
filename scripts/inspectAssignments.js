const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Assignment = require('../models/Assignment');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const inspectAssignments = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const assignments = await Assignment.find({});
        console.log(`Total Assignments: ${assignments.length}`);
        assignments.forEach(a => {
            console.log(`ID: ${a._id} | DonoID: ${a.donation} | VolID: ${a.volunteer} | Status: ${a.status}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspectAssignments();

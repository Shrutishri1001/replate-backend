const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    donation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation',
        required: true
    },
    ngo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Please provide a rating between 1 and 5'],
        min: 1,
        max: 5
    },
    foodQuality: {
        type: String,
        enum: ['Excellent', 'Good', 'Average', 'Poor', 'Spoiled'],
        required: true
    },
    packagingQuality: {
        type: String,
        enum: ['Intact', 'Adequate', 'Poor/Leaking'],
        required: true
    },
    comments: {
        type: String,
        maxLength: 500
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

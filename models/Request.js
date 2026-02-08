const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
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
    // Volunteer assigned to this request
    volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Link to assignment if volunteer is assigned
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'assigned', 'picked_up', 'delivered', 'cancelled'],
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: Date,
    assignedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    notes: String
}, {
    timestamps: true
});

// Index for efficient queries
requestSchema.index({ ngo: 1, status: 1 });
requestSchema.index({ donation: 1 });

// Prevent duplicate requests for same donation by same NGO
requestSchema.index({ donation: 1, ngo: 1 }, { unique: true });

module.exports = mongoose.model('Request', requestSchema);

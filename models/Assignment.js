const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    // Reference to donation
    donation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation',
        required: [true, 'Donation is required']
    },

    // Reference to volunteer
    volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Volunteer is required']
    },

    // Reference to donor (for easy access)
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Donor is required']
    },

    // Assignment status
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in_transit', 'completed', 'cancelled'],
        default: 'pending'
    },

    // Volunteer's current location during transit
    currentLocation: {
        lat: {
            type: Number,
            default: null
        },
        lng: {
            type: Number,
            default: null
        },
        lastUpdated: {
            type: Date,
            default: null
        }
    },

    // Assignment lifecycle timestamps
    assignedAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date,
        default: null
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },

    // Completion details
    completionNotes: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },

    // Cancellation reason
    cancellationReason: {
        type: String,
        trim: true
    }

}, {
    timestamps: true
});

// Indexes for faster queries
assignmentSchema.index({ volunteer: 1, status: 1 });
assignmentSchema.index({ donation: 1 });
assignmentSchema.index({ status: 1, createdAt: -1 });

// Method to calculate assignment duration
assignmentSchema.methods.getDuration = function () {
    if (!this.completedAt || !this.acceptedAt) return null;

    const diff = this.completedAt - this.acceptedAt;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
};

module.exports = mongoose.model('Assignment', assignmentSchema);

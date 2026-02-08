const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    // Reference to donor
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Donor is required']
    },

    // Step 1: Food Details
    foodType: {
        type: String,
        required: [true, 'Food type is required'],
        trim: true
    },
    foodName: {
        type: String,
        required: [true, 'Food name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        enum: ['servings', 'kg', 'packets', 'pieces', 'liters'],
        default: 'servings'
    },
    estimatedServings: {
        type: Number,
        required: [true, 'Estimated servings is required'],
        min: [1, 'Estimated servings must be at least 1']
    },
    dietaryTags: [{
        type: String,
        enum: ['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free']
    }],
    foodPhoto: {
        type: String,
        trim: true
    },

    // Step 2: Safety Information
    preparationDate: {
        type: String,
        required: [true, 'Preparation date is required']
    },
    preparationTime: {
        type: String,
        required: [true, 'Preparation time is required']
    },
    expiryDate: {
        type: String,
        required: [true, 'Expiry date is required']
    },
    expiryTime: {
        type: String,
        required: [true, 'Expiry time is required']
    },
    storageCondition: {
        type: String,
        required: [true, 'Storage condition is required'],
        enum: [
            'Refrigerated (0-4°C)',
            'Room Temperature (20-25°C)',
            'Frozen (-18°C or below)',
            'Hot Hold (above 60°C)'
        ]
    },
    allergens: [{
        type: String,
        enum: ['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy', 'Fish', 'Shellfish', 'Sesame']
    }],

    // Step 3: Hygiene Declaration
    hygiene: {
        safeHandling: {
            type: Boolean,
            required: [true, 'Safe handling confirmation is required']
        },
        temperatureControl: {
            type: Boolean,
            required: [true, 'Temperature control confirmation is required']
        },
        properPackaging: {
            type: Boolean,
            required: [true, 'Proper packaging confirmation is required']
        },
        noContamination: {
            type: Boolean,
            required: [true, 'No contamination confirmation is required']
        }
    },

    // Step 4: Pickup Details
    pickupAddress: {
        type: String,
        required: [true, 'Pickup address is required'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    pickupDeadline: {
        type: String,
        required: [true, 'Pickup deadline is required']
    },
    pickupInstructions: {
        type: String,
        trim: true
    },

    // Geolocation for map display
    location: {
        lat: {
            type: Number,
            default: null
        },
        lng: {
            type: Number,
            default: null
        }
    },

    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'accepted', 'assigned', 'in_transit', 'picked_up', 'delivered', 'cancelled', 'expired'],
        default: 'pending'
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    acceptedAt: Date,

    // Assignment (when NGO/volunteer accepts)
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Timestamps for tracking
    acceptedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    cancelledAt: Date

}, {
    timestamps: true
});

// Index for faster queries
donationSchema.index({ donor: 1, status: 1 });
donationSchema.index({ city: 1, status: 1 });
donationSchema.index({ createdAt: -1 });

// Virtual for checking if donation is expired
donationSchema.virtual('isExpired').get(function () {
    if (!this.expiryDate || !this.expiryTime) return false;
    const expiryDateTime = new Date(`${this.expiryDate}T${this.expiryTime}`);
    return new Date() > expiryDateTime;
});

// Method to calculate remaining safe time
donationSchema.methods.getRemainingTime = function () {
    if (!this.expiryDate || !this.expiryTime) return null;

    const expiryDateTime = new Date(`${this.expiryDate}T${this.expiryTime}`);
    const now = new Date();
    const diff = expiryDateTime - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
};

module.exports = mongoose.model('Donation', donationSchema);

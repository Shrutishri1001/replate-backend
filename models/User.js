const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Common fields
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: ['donor', 'ngo', 'volunteer'],
        lowercase: true
    },

    // Organization fields
    organizationName: {
        type: String,
        trim: true
    },
    organizationType: {
        type: String,
        trim: true
    },

    // NGO specific fields
    registrationNumber: {
        type: String,
        trim: true
    },
    dailyCapacity: {
        type: Number,
        min: 0
    },

    // Location fields
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true
    },

    // Geolocation for map tracking
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

    // Volunteer specific fields
    isAvailable: {
        type: Boolean,
        default: false
    },
    volunteerProfile: {
        vehicleType: {
            type: String,
            enum: ['bicycle', 'two_wheeler', 'car', 'van'],
            default: 'two_wheeler'
        },
        serviceRadius: {
            type: Number,
            default: 5
        },
        preferredAreas: [{
            type: String
        }],
        availabilitySchedule: {
            mon: { active: { type: Boolean, default: true }, slots: [{ start: String, end: String }] },
            tue: { active: { type: Boolean, default: true }, slots: [{ start: String, end: String }] },
            wed: { active: { type: Boolean, default: true }, slots: [{ start: String, end: String }] },
            thu: { active: { type: Boolean, default: true }, slots: [{ start: String, end: String }] },
            fri: { active: { type: Boolean, default: true }, slots: [{ start: String, end: String }] },
            sat: { active: { type: Boolean, default: false }, slots: [{ start: String, end: String }] },
            sun: { active: { type: Boolean, default: false }, slots: [{ start: String, end: String }] }
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

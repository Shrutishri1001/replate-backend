const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email,
      password,
      fullName,
      phone,
      role,
      organizationName,
      organizationType,
      registrationNumber,
      dailyCapacity,
      address,
      city,
      state,
      pincode,
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const userData = {
      email,
      password,
      fullName,
      phone,
      role,
      address,
      city,
      state,
      pincode,
    };

    if (role === "donor" || role === "ngo") {
      userData.organizationName = organizationName;
      userData.organizationType = organizationType;
    }

    if (role === "ngo") {
      userData.registrationNumber = registrationNumber;
      userData.dailyCapacity = dailyCapacity;
    }

    if (role === "volunteer" && req.body.volunteerProfile) {
      userData.volunteerProfile = {
        vehicleType: req.body.volunteerProfile.vehicleType,
        maxWeight: req.body.volunteerProfile.maxWeight,
        availabilitySchedule: req.body.volunteerProfile.availabilitySchedule
      };
    }

    const user = await User.create(userData);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      organizationName: user.organizationName,
      organizationType: user.organizationType,
      registrationNumber: user.registrationNumber,
      dailyCapacity: user.dailyCapacity,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      status: user.status,
      verificationStatus: user.verificationStatus,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        organizationName: user.organizationName,
        organizationType: user.organizationType,
        registrationNumber: user.registrationNumber,
        dailyCapacity: user.dailyCapacity,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        status: user.status,
        verificationStatus: user.verificationStatus,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      organizationName: user.organizationName,
      organizationType: user.organizationType,
      registrationNumber: user.registrationNumber,
      dailyCapacity: user.dailyCapacity,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//live map for ngo and donor controllers
const Donation = require('../models/Donation');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
//const geocodeAddress = require("../utils/geocoder");

// @desc    Get all active donations with locations for map
// @route   GET /api/map/donations
// @access  Private
exports.getMapDonations = async (req, res) => {
  try {
    const donations = await Donation.find({
      status: { $in: ['pending', 'accepted', 'in_transit'] },
      'location.lat': { $ne: null },
      'location.lng': { $ne: null }
    })
      .populate('donor', 'fullName organizationName phone')
      .select('foodName foodType quantity unit estimatedServings pickupAddress city expiryDate expiryTime status location donor')
      .sort({ createdAt: -1 });

    const formattedDonations = donations.map(donation => ({
      id: donation._id,
      foodName: donation.foodName,
      foodType: donation.foodType,
      quantity: donation.quantity,
      unit: donation.unit,
      estimatedServings: donation.estimatedServings,
      pickupAddress: donation.pickupAddress,
      city: donation.city,
      expiryDate: donation.expiryDate,
      expiryTime: donation.expiryTime,
      status: donation.status,
      location: donation.location,
      donor: {
        name: donation.donor?.fullName || donation.donor?.organizationName,
        phone: donation.donor?.phone
      }
    }));

    res.status(200).json(formattedDonations);
  } catch (error) {
    console.error('Get map donations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all available volunteers with locations for map
// @route   GET /api/map/volunteers
// @access  Private
exports.getMapVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({
      role: 'volunteer',
      isAvailable: true,
      'location.lat': { $ne: null },
      'location.lng': { $ne: null }
    })
      .select('fullName phone location vehicleType isAvailable')
      .sort({ updatedAt: -1 });

    const formattedVolunteers = volunteers.map(volunteer => ({
      id: volunteer._id,
      name: volunteer.fullName,
      phone: volunteer.phone,
      location: volunteer.location,
      vehicleType: volunteer.vehicleType,
      isAvailable: volunteer.isAvailable
    }));

    res.status(200).json(formattedVolunteers);
  } catch (error) {
    console.error('Get map volunteers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all active assignments (in-transit) for map
// @route   GET /api/map/assignments/active
// @access  Private
exports.getActiveAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      status: { $in: ['accepted', 'in_transit'] }
    })
      .populate({
        path: 'donation',
        select: 'foodName pickupAddress location acceptedBy',
        populate: {
          path: 'acceptedBy',
          select: 'organizationName location address'
        }
      })
      .populate('volunteer', 'fullName phone vehicleType')
      .select('status currentLocation donation volunteer')
      .sort({ updatedAt: -1 });
    console.log("Active assignments:", assignments);

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment._id,
      status: assignment.status,
      currentLocation: assignment.currentLocation,

      donation: {
        id: assignment.donation?._id,
        foodName: assignment.donation?.foodName,
        pickupAddress: assignment.donation?.pickupAddress,
        location: assignment.donation?.location,

        acceptedBy: {
          name: assignment.donation?.acceptedBy?.organizationName,
          location: assignment.donation?.acceptedBy?.location,
          address: assignment.donation?.acceptedBy?.address
        }
      },

      volunteer: {
        id: assignment.volunteer?._id,
        name: assignment.volunteer?.fullName,
        phone: assignment.volunteer?.phone,
        vehicleType: assignment.volunteer?.vehicleType
      }
    }));

    res.status(200).json(formattedAssignments);
  } catch (error) {
    console.error('Get active assignments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get map data summary (all data in one call)
// @route   GET /api/map/all
// @access  Private
exports.getAllMapData = async (req, res) => {
  try {
    // Get donations
    const donations = await Donation.find({
      status: { $in: ['pending', 'accepted', 'in_transit'] },
      'location.lat': { $ne: null },
      'location.lng': { $ne: null }
    })
      .populate('donor', 'fullName organizationName phone')
      .select('foodName foodType quantity unit estimatedServings pickupAddress city expiryDate expiryTime status location donor');

    // Get volunteers
    const volunteers = await User.find({
      role: 'volunteer',
      isAvailable: true,
      'location.lat': { $ne: null },
      'location.lng': { $ne: null }
    })
      .select('fullName phone location vehicleType isAvailable');

    // Get active assignments
    const assignments = await Assignment.find({
      status: { $in: ['accepted', 'in_transit'] }
    })
      .populate('donation', 'foodName pickupAddress location')
      .populate('volunteer', 'fullName phone vehicleType')
      .select('status currentLocation donation volunteer');

    res.status(200).json({
      donations: donations.map(d => ({
        id: d._id,
        foodName: d.foodName,
        foodType: d.foodType,
        quantity: d.quantity,
        unit: d.unit,
        estimatedServings: d.estimatedServings,
        pickupAddress: d.pickupAddress,
        city: d.city,
        expiryDate: d.expiryDate,
        expiryTime: d.expiryTime,
        status: d.status,
        location: d.location,
        donor: {
          name: d.donor?.fullName || d.donor?.organizationName,
          phone: d.donor?.phone
        }
      })),
      volunteers: volunteers.map(v => ({
        id: v._id,
        name: v.fullName,
        phone: v.phone,
        location: v.location,
        vehicleType: v.vehicleType,
        isAvailable: v.isAvailable
      })),
      assignments: assignments.map(a => ({
        id: a._id,
        status: a.status,
        currentLocation: a.currentLocation,
        donation: {
          id: a.donation?._id,
          foodName: a.donation?.foodName,
          pickupAddress: a.donation?.pickupAddress,
          location: a.donation?.location
        },
        volunteer: {
          id: a.volunteer?._id,
          name: a.volunteer?.fullName,
          phone: a.volunteer?.phone,
          vehicleType: a.volunteer?.vehicleType
        }
      }))
    });
  } catch (error) {
    console.error('Get all map data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// NGO → see all donors
exports.getDonorMap = async (req, res) => {
  try {

    const donors = await User.find({
      role: "donor"
    }).select("fullName organizationName address city pincode location");

    const donations = await Donation.find({
      status: { $in: ["pending", "accepted"] }
    });

    const donorMap = donors.map((donor) => {

      const donorDonation = donations.find(
        d => String(d.donor) === String(donor._id)
      );

      return {
        id: donor._id,
        name: donor.organizationName || donor.fullName,
        location: donor.location,
        address: donor.address,
        city: donor.city,
        pincode: donor.pincode,
        foodType: donorDonation?.foodType || null,
        quantity: donorDonation?.quantity || null,
        hasDonation: !!donorDonation
      };
    });

    res.json(donorMap);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



// Donor → see all NGOs
exports.getNgoMap = async (req, res) => {
  try {

    const ngos = await User.find({
      role: "ngo"
    }).select("organizationName address city pincode location dailyCapacity");

    const data = ngos.map((ngo) => {
      return {
        id: ngo._id,
        name: ngo.organizationName,
        location: ngo.location,
        address: ngo.address,
        city: ngo.city,
        pincode: ngo.pincode,
        dailyIntake: ngo.dailyCapacity || "Not specified"
      };
    });

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
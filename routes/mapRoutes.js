const express = require("express");
const router = express.Router();

const mapController = require("../controllers/mapController");

// NGO view → donors
router.get("/donors", mapController.getDonorMap);

// Donor view → NGOs
router.get("/ngos", mapController.getNgoMap);

module.exports = router;


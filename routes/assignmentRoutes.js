const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.js");

const {
  getAssignmentMapData,
  updateAssignmentLocation,
  getActiveAssignmentForVolunteer
} = require("../controllers/assignmentController");

/* 🔴 STATIC ROUTES FIRST */
router.get(
  "/volunteer-active",
  getActiveAssignmentForVolunteer
);

/* 🔴 DYNAMIC ROUTES AFTER */
router.get("/:id/map", getAssignmentMapData);
router.patch("/:id/location", updateAssignmentLocation);

module.exports = router;

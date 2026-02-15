const express = require('express');
const { body } = require('express-validator');

const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const registerValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("role").isIn(["donor", "ngo", "volunteer"]).withMessage("Invalid role"),
  body("address").notEmpty().withMessage("Address is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("pincode").notEmpty().withMessage("Pincode is required"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/me", protect, getMe);

module.exports = router;

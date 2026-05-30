const { body, param } = require("express-validator");

/* ── Step 1: Personal ────────────────────────────────────────── */
exports.personalRules = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),

  // FIX: removed .normalizeEmail() — it mutates the email value and
  // strips dots/plus signs causing mismatch with stored value
  body("email").isEmail().withMessage("Valid email address is required"),

  // FIX: isMobilePhone("any") rejects Indian 10-digit numbers without +91
  // Use a regex that matches 7-15 digit numbers with optional + prefix
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[\d\s\-]{7,15}$/)
    .withMessage("Valid phone number is required"),

  // FIX: isDate() strictly requires YYYY-MM-DD and rejects HTML date strings
  // Use notEmpty() instead — Mongoose will handle date parsing
  body("dob").notEmpty().withMessage("Date of birth is required"),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["Male", "Female", "Other", "Prefer not to say"])
    .withMessage("Invalid gender value"),
];

/* ── Step 2: Academic ────────────────────────────────────────── */
exports.academicRules = [
  body("course").trim().notEmpty().withMessage("Course selection is required"),
  body("learningMode")
    .notEmpty()
    .withMessage("Learning mode is required")
    .isIn(["Online", "Offline", "Hybrid"])
    .withMessage("Invalid learning mode"),
  body("qualification")
    .notEmpty()
    .withMessage("Highest qualification is required"),
  body("institution")
    .trim()
    .notEmpty()
    .withMessage("Institution name is required"),
];

/* ── Full enrollment (all steps combined) ────────────────────── */
exports.enrollmentRules = [...exports.personalRules, ...exports.academicRules];

/* ── Enrollment ID param ─────────────────────────────────────── */
exports.enrollmentIdRule = [
  param("id")
    .matches(/^LA-\d{4}-\d{4}$/)
    .withMessage("Invalid enrollment ID format (e.g. LA-2025-0001)"),
];

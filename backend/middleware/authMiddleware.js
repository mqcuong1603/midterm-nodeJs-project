import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { body, validationResult } from "express-validator";
import { formatError } from "../utils/errorResponse.js";

// protect by jwt middleware
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json(formatError("Not authorized, no token", 401));
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Find user from token
    req.user = await User.findById(decoded.id).select("-password");

    next();
  } catch (error) {
    res.status(401).json(formatError("Not authorized, token failed", 401));
  }
};

// Validate register middleware
export const validateRegistration = [
  // Username validation
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .bail()
    .isString()
    .withMessage("Username must be a string")
    .bail()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),

  // Email validation
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email")
    .bail()
    .trim()
    .normalizeEmail(),

  // Password validation
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .bail()
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage(
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  // Confirm password validation
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .bail()
    .isString()
    .withMessage("Confirm password must be a string")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  // Check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        formatError(
          "Validation failed",
          400,
          errors.array().map((err) => ({
            field: err.param,
            message: err.msg,
          }))
        )
      );
    }
    next();
  },
];

// Check if user exists when register by email middleware
export const checkUserExists = async (req, res, next) => {
  try {
    const { email } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json(
        formatError("User already exists", 400, [
          {
            field: "email",
            message: "User already exists",
            value: email,
          },
        ])
      );
    }

    next();
  } catch (error) {
    res.status(500).json(formatError(error.message));
  }
};

// Validate login middleware
export const validateLogin = [
  // Email validation
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email")
    .bail()
    .trim()
    .normalizeEmail(),

  // Password validation
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password must be a string"),

  // Check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        formatError(
          "Validation failed",
          400,
          errors.array().map((err) => ({
            field: err.param,
            message: err.msg,
          }))
        )
      );
    }
    next();
  },
];

// Check credentials of user login middleware
export const checkCredentials = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json(formatError("Invalid email or password", 401));
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json(formatError("Invalid email or password", 401));
    }

    // If validation passes, attach user to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json(formatError("Server error", 500));
  }
};

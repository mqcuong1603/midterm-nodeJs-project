import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { formatError, formatSuccess } from "../utils/errorResponse.js";

// Generate JWT Token helper function
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Register user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const user = await User.create({
      username,
      email,
      password,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json(
      formatSuccess(
        {
          _id: user._id,
          username: user.username,
          email: user.email,
          token,
        },
        "User registered successfully"
      )
    );
  } catch (error) {
    res.status(500).json(formatError(error.message));
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const user = req.user;

    const token = generateToken(user._id);

    res.json(
      formatSuccess(
        {
          _id: user._id,
          username: user.username,
          email: user.email,
          token,
        },
        "Login successful"
      )
    );
  } catch (error) {
    res.status(500).json(formatError(error.message));
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json(formatError("User not found", 404));
    }
    res.json(formatSuccess(user, "User profile retrieved successfully"));
  } catch (error) {
    res.status(500).json(formatError(error.message));
  }
};

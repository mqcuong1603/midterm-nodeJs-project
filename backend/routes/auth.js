// routes/auth.js
import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../controllers/authController.js";

import {
  protect,
  validateRegistration,
  checkUserExists,
  validateLogin,
  checkCredentials,
} from "../middleware/authMiddleware.js";

import { authLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validateRegistration,
  checkUserExists,
  registerUser
);

router.post("/login", authLimiter, validateLogin, checkCredentials, loginUser);
router.get("/profile", protect, getUserProfile);

export default router;

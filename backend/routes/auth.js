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
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", validateRegistration, checkUserExists, registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);

export default router;

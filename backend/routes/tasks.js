// routes/tasks.js
import express from "express";
import {
  getAllTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

import {
  validateTaskCreation,
  taskNotFound,
} from "../middleware/taskMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(protect);

router.get("/", getAllTasks);
router.post("/", validateTaskCreation, createTask);
router.get("/:id", taskNotFound, getTaskById);
router.patch("/:id", updateTask);
router.delete("/:id", taskNotFound, deleteTask);

export default router;

import Task from "../models/Task.js";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import { formatError } from "../utils/errorResponse.js";

//Task creation validation
export const validateTaskCreation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .bail()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters"),

  body("description")
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Description must be at least 3 characters"),

  body("priority")
    .notEmpty()
    .withMessage("Priority is required")
    .bail()
    .isString()
    .withMessage("Priority must be a string")
    .bail()
    .trim()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium or high"),

  body("dueDate").optional().isDate().withMessage("Due date must be a date"),

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

//Task not found validation
export const taskNotFound = async (req, res, next) => {
  try {
    // Check if ID format is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json(formatError("Invalid task ID format", 400));
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) return res.status(404).json(formatError("Task not found", 404));

    req.task = task;
    next();
  } catch (error) {
    res.status(500).json(formatError(error.message));
  }
};

export const validateTaskUpdate = [
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Description must be at least 3 characters"),

  body("completed")
    .optional()
    .isBoolean()
    .withMessage("Completed must be a boolean"),

  body("priority")
    .optional()
    .isString()
    .withMessage("Priority must be a string")
    .bail()
    .trim()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium or high"),

  body("dueDate").optional().isDate().withMessage("Due date must be a date"),

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

import Task from "../models/Task.js";
import { body, validationResult } from "express-validator";

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
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// controllers/taskController.js
import Task from "../models/Task.js";
import { formatError, formatSuccess } from "../utils/errorResponse.js";

// Get all tasks with pagination
export const getAllTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTasks = await Task.countDocuments({ user: req.user._id });

    res.json(
      formatSuccess(
        {
          tasks,
          totalPages: Math.ceil(totalTasks / limit),
          currentPage: page,
          totalTasks: totalTasks,
          hasMore: page < Math.ceil(totalTasks / limit),
        },
        "Tasks retrieved successfully"
      )
    );
  } catch (error) {
    res.status(500).json(formatError(error.message));
  }
};

//Create a task
export const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    const task = new Task({
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      user: req.user._id,
    });

    const newTask = await task.save();
    res.status(201).json(formatSuccess(newTask, "Task created successfully"));
  } catch (error) {
    res.status(400).json(formatError(error.message, 400));
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    res.json(formatSuccess(req.task, "Task retrieved successfully"));
  } catch (error) {
    res.status(500).json(formatError(error.message));
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const { title, description, completed, priority, dueDate } = req.body;

    const task = req.task;

    // Update task fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (completed !== undefined) task.completed = completed;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) {
      try {
        task.dueDate = new Date(dueDate);
        if (isNaN(task.dueDate.getTime())) {
          return res.status(400).json(formatError("Invalid date format", 400));
        }
      } catch (error) {
        return res.status(400).json(formatError("Invalid date format", 400));
      }
    }

    const updatedTask = await task.save();
    res.json(formatSuccess(updatedTask, "Task updated successfully"));
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json(formatError(error.message));
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    // Use findByIdAndDelete instead of the deprecated remove() method
    await Task.findByIdAndDelete(req.task._id);
    res.json(formatSuccess(null, "Task deleted successfully"));
  } catch (error) {
    res.status(500).json(formatError(error.message));
  }
};

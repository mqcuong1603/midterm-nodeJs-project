// controllers/taskController.js
import Task from "../models/Task.js";
import { formatError, formatSuccess } from "../utils/errorResponse.js";
import { sendTaskToQueue } from "../utils/rabbitmq.js";

// Get all tasks with pagination
export const getAllTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get total tasks first
    const totalTasks = await Task.countDocuments({ user: req.user._id });

    // Calculate total pages
    const totalPages = Math.max(1, Math.ceil(totalTasks / limit));

    // Validate requested page number
    const validatedPage = Math.min(Math.max(1, page), totalPages);

    const skip = (validatedPage - 1) * limit;

    const tasks = await Task.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(
      formatSuccess(
        {
          tasks,
          totalPages,
          currentPage: validatedPage,
          totalTasks,
          hasMore: validatedPage < totalPages,
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

    // Try to send task to queue for async processing, but continue even if it fails
    try {
      await sendTaskToQueue({
        action: "TASK_CREATED",
        taskId: newTask._id.toString(),
        userId: req.user._id.toString(),
        title: newTask.title,
        timestamp: new Date().toISOString(),
      });
    } catch (queueError) {
      // Log error but don't fail the API request
      console.error("Failed to queue task for async processing:", queueError);
    }

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

    // Store previous state to detect changes
    const previousCompleted = task.completed;

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

    // If task completion status changed, send to queue for processing
    if (previousCompleted !== updatedTask.completed) {
      try {
        await sendTaskToQueue({
          action: "TASK_STATUS_CHANGED",
          taskId: updatedTask._id.toString(),
          userId: req.user._id.toString(),
          title: updatedTask.title,
          oldStatus: previousCompleted ? "completed" : "pending",
          newStatus: updatedTask.completed ? "completed" : "pending",
          timestamp: new Date().toISOString(),
        });
      } catch (queueError) {
        // Log error but don't fail the API request
        console.error(
          "Failed to queue task status change for async processing:",
          queueError
        );
      }
    }

    res.json(formatSuccess(updatedTask, "Task updated successfully"));
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json(formatError(error.message));
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.task._id.toString();
    const userId = req.user._id.toString();
    const taskTitle = req.task.title;

    // Use findByIdAndDelete instead of the deprecated remove() method
    await Task.findByIdAndDelete(req.task._id);

    // Send task deletion event to queue for processing
    try {
      await sendTaskToQueue({
        action: "TASK_DELETED",
        taskId: taskId,
        userId: userId,
        title: taskTitle,
        timestamp: new Date().toISOString(),
      });
    } catch (queueError) {
      // Log error but don't fail the API request
      console.error(
        "Failed to queue task deletion for async processing:",
        queueError
      );
    }

    res.json(formatSuccess(null, "Task deleted successfully"));
  } catch (error) {
    res.status(500).json(formatError(error.message));
  }
};

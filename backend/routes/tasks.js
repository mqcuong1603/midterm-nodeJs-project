import express from "express";
const router = express.Router();

// GET all tasks
router.get("/", async (req, res) => {
  try {
    // Your code to get tasks from database
    res.json({ message: "Get all tasks" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add other routes as needed (POST, PUT, DELETE)

export default router;

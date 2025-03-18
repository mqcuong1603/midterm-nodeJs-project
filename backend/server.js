import express, { json } from "express";
import cors from "cors";
import { connect } from "mongoose";
import taskRoutes from "./routes/tasks.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json());

// Connect to MongoDB
connect(process.env.MONGO_URI || "mongodb://db:27017/taskapp")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Routes
app.use("/api/tasks", taskRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Backend API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from "express";
import { json } from "express";
import cors from "cors";
import { connect } from "mongoose";
import cookieParser from "cookie-parser";
import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from parent directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json());
app.use(cookieParser());

// Connect to MongoDB
connect(process.env.MONGO_URI || "mongodb://db:27017/taskapp")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

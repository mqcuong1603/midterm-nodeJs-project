// task-processor/index.js
import amqp from "amqplib";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://app-db:27017/taskmanagement";
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// RabbitMQ connection
let connection = null;
let channel = null;

const QUEUE_NAMES = {
  TASKS: "tasks_queue",
  NOTIFICATIONS: "notifications_queue",
};

// Connect to RabbitMQ
const connectRabbitMQ = async () => {
  try {
    const rabbitmqHost = process.env.RABBITMQ_HOST || "rabbitmq";
    const rabbitmqUser = process.env.RABBITMQ_USER || "guest";
    const rabbitmqPass = process.env.RABBITMQ_PASSWORD || "guest";

    const connectionString = `amqp://${rabbitmqUser}:${rabbitmqPass}@${rabbitmqHost}`;
    connection = await amqp.connect(connectionString);

    // Handle connection errors
    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      setTimeout(connectRabbitMQ, 5000);
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed, trying to reconnect...");
      setTimeout(connectRabbitMQ, 5000);
    });

    channel = await connection.createChannel();

    // Ensure queues exist
    await channel.assertQueue(QUEUE_NAMES.TASKS, { durable: true });
    await channel.assertQueue(QUEUE_NAMES.NOTIFICATIONS, { durable: true });

    console.log("Connected to RabbitMQ successfully");

    // Start consuming messages
    await startTaskConsumer();
    return true;
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
    setTimeout(connectRabbitMQ, 5000);
    return false;
  }
};

// Process messages from tasks queue
const startTaskConsumer = async () => {
  try {
    await channel.prefetch(1); // Process one message at a time

    await channel.consume(QUEUE_NAMES.TASKS, async (msg) => {
      if (msg) {
        try {
          console.log("Received task message");
          const content = JSON.parse(msg.content.toString());
          await processTaskMessage(content);
          channel.ack(msg);
        } catch (error) {
          console.error("Error processing task message:", error);
          // Negative acknowledgment - requeue the message
          channel.nack(msg, false, true);
        }
      }
    });

    console.log("Task consumer started successfully");
  } catch (error) {
    console.error("Error starting task consumer:", error);
    setTimeout(startTaskConsumer, 5000);
  }
};

// Process individual task messages
const processTaskMessage = async (message) => {
  console.log("Processing task message:", JSON.stringify(message, null, 2));

  try {
    switch (message.action) {
      case "TASK_CREATED":
        await processTaskCreated(message);
        break;
      case "TASK_STATUS_CHANGED":
        await processTaskStatusChanged(message);
        break;
      case "TASK_DELETED":
        await processTaskDeleted(message);
        break;
      default:
        console.warn(`Unknown task action: ${message.action}`);
    }
  } catch (error) {
    console.error("Error processing task message:", error);
    throw error; // Rethrow to trigger message nack
  }
};

// Process task creation events
const processTaskCreated = async (message) => {
  console.log(`Processing new task creation: ${message.taskId}`);

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Send notification about new task
  await sendNotification({
    type: "TASK_CREATED",
    userId: message.userId,
    taskId: message.taskId,
    title: message.title,
    message: `New task "${message.title}" has been created.`,
    timestamp: new Date().toISOString(),
  });

  console.log(`Task creation processed: ${message.taskId}`);
};

// Process task status change events
const processTaskStatusChanged = async (message) => {
  console.log(
    `Processing task status change: ${message.taskId} (${message.oldStatus} -> ${message.newStatus})`
  );

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Special handling for task completion
  if (message.newStatus === "completed") {
    console.log(
      `Task ${message.taskId} marked as completed, performing additional processing`
    );

    // Example: Update user statistics, generate reports, etc.
    // This would be actual business logic in a real application

    // Send completion notification
    await sendNotification({
      type: "TASK_COMPLETED",
      userId: message.userId,
      taskId: message.taskId,
      title: message.title,
      message: `Congratulations! Your task "${message.title}" has been completed.`,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`Task status change processed: ${message.taskId}`);
};

// Process task deletion events
const processTaskDeleted = async (message) => {
  console.log(`Processing task deletion: ${message.taskId}`);

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Example: Remove related data, clean up resources, etc.

  // Send deletion notification
  await sendNotification({
    type: "TASK_DELETED",
    userId: message.userId,
    taskId: message.taskId,
    title: message.title,
    message: `Task "${message.title}" has been deleted.`,
    timestamp: new Date().toISOString(),
  });

  console.log(`Task deletion processed: ${message.taskId}`);
};

// Send notification to notification queue
const sendNotification = async (notification) => {
  try {
    if (!channel) {
      throw new Error("RabbitMQ channel not available");
    }

    const success = channel.sendToQueue(
      QUEUE_NAMES.NOTIFICATIONS,
      Buffer.from(JSON.stringify(notification)),
      { persistent: true }
    );

    if (success) {
      console.log(
        `Notification sent: ${notification.type} for task ${notification.taskId}`
      );
    } else {
      console.error("Failed to send notification - channel buffer full");
    }

    return success;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

// Graceful shutdown
const shutdown = () => {
  console.log("Shutting down gracefully...");

  if (channel) {
    channel.close();
  }

  if (connection) {
    connection.close();
  }

  mongoose.connection.close();
  process.exit(0);
};

// Handle process termination
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start the application
const start = async () => {
  try {
    await connectDB();
    await connectRabbitMQ();
    console.log("Task processor service is running");
  } catch (error) {
    console.error("Failed to start task processor:", error);
    process.exit(1);
  }
};

start();

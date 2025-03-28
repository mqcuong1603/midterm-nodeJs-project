// utils/rabbitmq.js
import amqp from "amqplib";

let connection = null;
let channel = null;
let isConnecting = false;
let connectionRetries = 0;
const MAX_RETRIES = 5; // Maximum number of retries
const RETRY_INTERVAL = 5000; // Retry every 5 seconds

const QUEUE_NAMES = {
  TASKS: "tasks_queue",
  NOTIFICATIONS: "notifications_queue",
};

/**
 * Initialize connection to RabbitMQ with retry logic
 */
export const initialize = async () => {
  // If already connecting, don't try again
  if (isConnecting) return false;

  try {
    isConnecting = true;
    connectionRetries++;

    if (connectionRetries > MAX_RETRIES) {
      console.warn(
        `Maximum RabbitMQ connection retries (${MAX_RETRIES}) reached. Falling back to direct operation.`
      );
      return false;
    }

    const rabbitmqHost = process.env.RABBITMQ_HOST || "rabbitmq";
    const rabbitmqUser = process.env.RABBITMQ_USER || "guest";
    const rabbitmqPass = process.env.RABBITMQ_PASSWORD || "guest";

    console.log(
      `Connecting to RabbitMQ at ${rabbitmqHost} (attempt ${connectionRetries}/${MAX_RETRIES})`
    );

    const connectionString = `amqp://${rabbitmqUser}:${rabbitmqPass}@${rabbitmqHost}`;
    connection = await amqp.connect(connectionString);

    // Handle connection closure and reconnect
    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      connection = null;
      channel = null;
      isConnecting = false;

      // Attempt reconnection after a delay
      setTimeout(initialize, RETRY_INTERVAL);
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed, will try to reconnect...");
      connection = null;
      channel = null;
      isConnecting = false;

      setTimeout(initialize, RETRY_INTERVAL);
    });

    // Create channel
    channel = await connection.createChannel();

    // Declare queues with durable option to survive broker restarts
    await channel.assertQueue(QUEUE_NAMES.TASKS, { durable: true });
    await channel.assertQueue(QUEUE_NAMES.NOTIFICATIONS, { durable: true });

    console.log("Connected to RabbitMQ successfully!");
    isConnecting = false;
    connectionRetries = 0; // Reset retry counter on successful connection

    return true;
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
    connection = null;
    channel = null;
    isConnecting = false;

    // Attempt reconnection after a delay
    setTimeout(initialize, RETRY_INTERVAL);
    return false;
  }
};

/**
 * Send task to processing queue, with fallback to direct operation
 * @param {Object} task - Task object to be processed
 */
export const sendTaskToQueue = async (task) => {
  try {
    if (!channel) {
      const connected = await initialize();
      if (!connected) {
        console.log(
          "RabbitMQ not available, skipping async processing for task:",
          task?.taskId
        );
        return false;
      }
    }

    const success = channel.sendToQueue(
      QUEUE_NAMES.TASKS,
      Buffer.from(JSON.stringify(task)),
      { persistent: true } // Message will be saved to disk
    );

    if (success) {
      console.log(`Task sent to queue: ${task.action} for task ${task.taskId}`);
    } else {
      console.warn("Failed to send task to queue - channel buffer full");
    }

    return success;
  } catch (error) {
    console.error("Error sending task to queue:", error);
    // If we fail to send the message, we should log but not throw
    // This ensures the API can still return successfully
    return false;
  }
};

/**
 * Send notification to notification queue
 * @param {Object} notification - Notification object
 */
export const sendNotification = async (notification) => {
  try {
    if (!channel) {
      const connected = await initialize();
      if (!connected) {
        console.log(
          "RabbitMQ not available, skipping notification:",
          notification?.type
        );
        return false;
      }
    }

    const success = channel.sendToQueue(
      QUEUE_NAMES.NOTIFICATIONS,
      Buffer.from(JSON.stringify(notification)),
      { persistent: true }
    );

    if (success) {
      console.log(`Notification sent: ${notification.type}`);
    } else {
      console.warn("Failed to send notification - channel buffer full");
    }

    return success;
  } catch (error) {
    console.error("Error sending notification to queue:", error);
    return false;
  }
};

/**
 * Set up a consumer for a specific queue
 * @param {string} queueName - Name of the queue to consume from
 * @param {Function} callback - Callback function to handle messages
 */
export const consumeQueue = async (queueName, callback) => {
  try {
    if (!channel) {
      const connected = await initialize();
      if (!connected) {
        console.log(`RabbitMQ not available, cannot consume from ${queueName}`);
        return false;
      }
    }

    await channel.consume(queueName, (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString());
          callback(content);
          channel.ack(message);
        } catch (error) {
          console.error(`Error processing message from ${queueName}:`, error);
          // Reject and requeue if processing fails
          channel.nack(message, false, true);
        }
      }
    });

    console.log(`Consumer set up for queue: ${queueName}`);
    return true;
  } catch (error) {
    console.error(`Error consuming from queue ${queueName}:`, error);
    return false;
  }
};

// Initialize connection when module is imported but don't block
initialize().catch((err) => {
  console.error("Failed to initialize RabbitMQ connection:", err);
});

// Close connection gracefully when application shuts down
process.on("SIGINT", () => {
  if (channel) channel.close();
  if (connection) connection.close();
});

export default {
  initialize,
  sendTaskToQueue,
  sendNotification,
  consumeQueue,
  QUEUE_NAMES,
};

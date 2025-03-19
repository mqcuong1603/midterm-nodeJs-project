// This script will run when MongoDB container is created
db = db.getSiblingDB("taskapp");

// Create collections
db.createCollection("users");
db.createCollection("tasks");

// Create a test user first
const userId = new ObjectId();

db.users.insertOne({
  _id: userId,
  username: "testuser",
  email: "test@example.com",
  // This is a hashed version of "password123" - in a real app, you'd use bcrypt in your code, not store pre-hashed passwords
  password: "$2a$10$XlhRvBvMAi7fJ0v3ZFnKJu8XwF3QGZIQlNBH9d1RU9NOFEk8xKCnm",
  createdAt: new Date(),
});

// Insert tasks with the user reference and new fields
db.tasks.insertMany([
  {
    title: "Learn Docker",
    description: "Study Docker and containerization",
    completed: false,
    priority: "high",
    dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    user: userId,
    createdAt: new Date(),
  },
  {
    title: "Build a Node.js app",
    description: "Create a web application with Node.js and Express",
    completed: true,
    priority: "medium",
    dueDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    user: userId,
    createdAt: new Date(),
  },
  {
    title: "Deploy with Docker Compose",
    description: "Set up Docker Compose for the project",
    completed: false,
    priority: "high",
    dueDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    user: userId,
    createdAt: new Date(),
  },
]);

print("Database initialized with test user and tasks");

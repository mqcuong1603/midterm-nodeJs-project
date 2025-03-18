// This script will run when MongoDB container is created
db = db.getSiblingDB("taskapp");

// Create collections
db.createCollection("tasks");

// Optional: Insert initial data
db.tasks.insertMany([
  {
    title: "Learn Docker",
    description: "Study Docker and containerization",
    completed: false,
    createdAt: new Date(),
  },
  {
    title: "Build a Node.js app",
    description: "Create a web application with Node.js and Express",
    completed: true,
    createdAt: new Date(),
  },
]);

print("Database initialized");

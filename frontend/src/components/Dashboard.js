import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import TaskModal from "./tasks/TaskModal";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({
    isOpen: false,
    mode: "add",
    task: null,
  });

  useEffect(() => {
    // This would typically fetch tasks from your API
    const fetchTasks = async () => {
      try {
        // Simulate API request
        setTimeout(() => {
          setTasks([
            {
              id: 1,
              title: "Complete project documentation",
              completed: false,
              priority: "medium",
              description: "",
              dueDate: "",
            },
            {
              id: 2,
              title: "Implement authentication",
              completed: true,
              priority: "high",
              description: "Set up JWT authentication for the app",
              dueDate: "",
            },
            {
              id: 3,
              title: "Design dashboard UI",
              completed: false,
              priority: "low",
              description: "Create a responsive design for the dashboard",
              dueDate: "",
            },
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const openModal = (mode, task = null) => {
    setModal({ isOpen: true, mode, task });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: "add", task: null });
  };

  const handleTaskUpdated = (updatedTask, isDeleted = false) => {
    if (isDeleted) {
      // Remove the deleted task
      setTasks(tasks.filter((task) => task.id !== modal.task.id));
    } else if (modal.mode === "edit") {
      // Update the existing task
      setTasks(
        tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
    } else {
      // Add the new task with a unique ID
      const newTask = {
        ...updatedTask,
        id: Math.max(0, ...tasks.map((t) => t.id)) + 1, // Generate a new ID
      };
      setTasks([newTask, ...tasks]);
    }
  };

  if (loading || isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.username}</h1>
        <p>Manage your tasks below</p>
      </div>

      <div className="dashboard-content">
        <div className="tasks-container">
          <h2>Your Tasks</h2>

          {tasks.length === 0 ? (
            <p>No tasks found. Create your first task.</p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`task-item ${task.completed ? "completed" : ""}`}
                >
                  <div className="task-content">
                    <span className="task-title">{task.title}</span>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    {task.priority && (
                      <span className={`task-priority ${task.priority}`}>
                        {task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)}
                      </span>
                    )}
                  </div>
                  <div className="task-actions">
                    <button
                      className="task-button edit"
                      onClick={() => openModal("edit", task)}
                    >
                      Edit
                    </button>
                    <button
                      className="task-button delete"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this task?"
                          )
                        ) {
                          handleTaskUpdated(null, true);
                          setModal({ ...modal, task });
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button className="add-task-button" onClick={() => openModal("add")}>
            Add New Task
          </button>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        task={modal.task}
        mode={modal.mode}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default Dashboard;

import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
            },
            { id: 2, title: "Implement authentication", completed: true },
            { id: 3, title: "Design dashboard UI", completed: false },
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
                  <span className="task-title">{task.title}</span>
                  <div className="task-actions">
                    <button className="task-button edit">Edit</button>
                    <button className="task-button delete">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button className="add-task-button">Add New Task</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

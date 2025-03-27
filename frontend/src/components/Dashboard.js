import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import TaskModal from "./tasks/TaskModal";
import axios from "axios";
import "./Dashboard.css";

// Create an axios instance with authentication
const api = axios.create({
  baseURL: "http://localhost:3000", // Replace with your actual backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const Dashboard = () => {
  const { user: contextUser, loading: authLoading, logout } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [modal, setModal] = useState({
    isOpen: false,
    mode: "add",
    task: null,
  });

  // Function to fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/api/auth/profile");
      
      if (response.data && response.data.success) {
        setUserProfile(response.data.data);
      } else {
        throw new Error("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load profile. Please try again.");
      
      // If unauthorized, log out
      if (error.response && error.response.status === 401) {
        if (logout) logout();
      }
    }
  };

  // Function to fetch tasks from API
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/tasks");
      
      if (response.data && response.data.success) {
        // Use the tasks from the API response
        setTasks(response.data.data.tasks);
      } else {
        throw new Error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to load tasks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user profile and tasks when component mounts
    const loadData = async () => {
      await fetchUserProfile();
      await fetchTasks();
    };
    
    loadData();
  }, []);

  const openModal = (mode, task = null) => {
    setModal({ isOpen: true, mode, task });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: "add", task: null });
  };

  // Handle task creation, update, or deletion via API
  const handleTaskUpdated = async (taskData, isDeleted = false) => {
    try {
      if (isDeleted) {
        const taskToDelete = modal.task || taskData;
        if (!taskToDelete || !taskToDelete._id) {
          throw new Error("No task selected for deletion");
        }
        
        // Delete task from API
        await api.delete(`/api/tasks/${taskToDelete._id}`);
        
        // Update local state after successful API call
        setTasks(tasks.filter((task) => task._id !== taskToDelete._id));
        setError(null); // Clear any previous errors
        closeModal();
      } else if (modal.mode === "edit" && modal.task) {
        // Update existing task in API
        const response = await api.patch(`/api/tasks/${modal.task._id}`, taskData);
        
        if (response.data && response.data.success) {
          // Update local state with the updated task from API
          const updatedTaskFromApi = response.data.data;
          setTasks(
            tasks.map((task) => (task._id === updatedTaskFromApi._id ? updatedTaskFromApi : task))
          );
          setError(null); // Clear any previous errors
        }
        closeModal();
      } else {
        // Add new task to API
        const response = await api.post("/api/tasks", taskData);
        
        if (response.data && response.data.success) {
          // Add the new task from API response to local state
          const newTask = response.data.data;
          setTasks([newTask, ...tasks]);
          setError(null); // Clear any previous errors
        }
        closeModal();
      }
    } catch (error) {
      console.error("Task operation failed:", error);
      const errorMessage = error.response?.data?.message || 
                          "Failed to update task. Please try again.";
      
      // Show error message
      setError(errorMessage);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setPriorityFilter(e.target.value);
  };

  // Filter tasks based on search term and priority filter
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      (task.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (task.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });

  const handleLogout = () => {
    if (logout) logout();
  };

  // Display loading state while auth loading or user profile/tasks loading
  if (authLoading || isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Use user profile from API if available, otherwise fall back to context user
  const user = userProfile || contextUser;

  return (
    <div className="dashboard-container">
      {/* Header with app name, welcome message, and logout */}
      <div className="dashboard-header">
        <div className="app-title">Task Manager</div>
        <div className="welcome-message">
          Welcome, {user?.username || 'User'}
        </div>
      </div>

      {/* Display error message if profile fetch failed */}
      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      {/* Search and filters section */}
      <div className="dashboard-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="controls-right">
          <div className="filter-container">
            <select 
              value={priorityFilter} 
              onChange={handleFilterChange}
              className="priority-filter"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <button 
            className="add-task-button" 
            onClick={() => openModal("add")}
          >
            + Add new task
          </button>
        </div>
      </div>

      {/* Tasks section title */}
      <div className="tasks-section-title">
        <h2>Your tasks</h2>
      </div>

      {/* Tasks table */}
      <div className="tasks-table-container">
        {filteredTasks.length === 0 ? (
          <p className="no-tasks-message">No tasks found. Create your first task.</p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th className="th-title">Title of task</th>
                <th className="th-description">Description</th>
                <th className="th-priority">Priority</th>
                <th className="th-duedate">Due date</th>
                <th className="th-actions"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr 
                  key={task._id} 
                  className={`task-row ${task.completed ? "completed" : ""}`}
                >
                  <td className="td-title">{task.title}</td>
                  <td className="td-description">{task.description || "-"}</td>
                  <td className="td-priority">
                    <span className={`priority-badge ${task.priority}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </td>
                  <td className="td-duedate">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="td-actions">
                    <button
                      className="task-button edit"
                      onClick={() => openModal("edit", task)}
                    >
                      Edit
                    </button>
                    <button
                      className="task-button delete"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this task?")) {
                          // Pass the task directly to handleTaskUpdated
                          handleTaskUpdated(task, true);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
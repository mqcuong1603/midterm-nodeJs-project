// Dashboard.js
import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import TaskModal from "./tasks/TaskModal";
import axios from "axios";
import "./Dashboard.css";
import {
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaPlusCircle,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

// Create an axios instance with authentication
const api = axios.create({
  baseURL: "http://localhost:3000",
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
  const {
    user: contextUser,
    loading: authLoading,
    logout,
  } = useContext(AuthContext);

  const [userProfile, setUserProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "dueDate",
    direction: "asc",
  });
  const [modal, setModal] = useState({
    isOpen: false,
    mode: "add",
    task: null,
    validationError: null,
  });
  const [descriptionModal, setDescriptionModal] = useState({
    isOpen: false,
    task: null,
  });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    task: null,
  });

  // Fetch user profile
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
      if (error.response && error.response.status === 401) {
        if (logout) logout();
      }
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/tasks");
      if (response.data && response.data.success) {
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

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      await fetchUserProfile();
      await fetchTasks();
    };
    loadData();
  }, []);

  // Modal and interaction methods
  const openModal = (mode, task = null) => {
    setModal({
      isOpen: true,
      mode,
      task,
      validationError: null,
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      mode: "add",
      task: null,
      validationError: null,
    });
  };

  const openDescriptionModal = (task) => {
    setDescriptionModal({ isOpen: true, task });
  };

  const closeDescriptionModal = () => {
    setDescriptionModal({ isOpen: false, task: null });
  };

  const openDeleteConfirmModal = (task) => {
    setDeleteConfirmModal({ isOpen: true, task });
  };

  const closeDeleteConfirmModal = () => {
    setDeleteConfirmModal({ isOpen: false, task: null });
  };

  // Task operations
  const handleTaskUpdated = async (taskData, isDeleted = false) => {
    try {
      // Validation
      if (!isDeleted) {
        if (!taskData.title || taskData.title.trim() === "") {
          throw new Error("Title is required");
        }
        if (!taskData.description || taskData.description.trim() === "") {
          throw new Error("Description is required");
        }
      }

      if (isDeleted) {
        const taskToDelete = deleteConfirmModal.task || taskData;
        if (!taskToDelete || !taskToDelete._id) {
          throw new Error("No task selected for deletion");
        }

        await api.delete(`/api/tasks/${taskToDelete._id}`);
        setTasks(tasks.filter((task) => task._id !== taskToDelete._id));
        setError(null);
        closeDeleteConfirmModal();
      } else if (modal.mode === "edit" && modal.task) {
        const response = await api.patch(
          `/api/tasks/${modal.task._id}`,
          taskData
        );

        if (response.data && response.data.success) {
          const updatedTaskFromApi = response.data.data;
          setTasks(
            tasks.map((task) =>
              task._id === updatedTaskFromApi._id ? updatedTaskFromApi : task
            )
          );
          setError(null);
        }
        closeModal();
      } else {
        const response = await api.post("/api/tasks", taskData);

        if (response.data && response.data.success) {
          const newTask = response.data.data;
          setTasks([newTask, ...tasks]);
          setError(null);
        }
        closeModal();
      }
    } catch (error) {
      console.error("Task operation failed:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update task. Please try again.";

      setError(errorMessage);

      if (
        errorMessage.includes("Title is required") ||
        errorMessage.includes("Description is required")
      ) {
        setModal((prevModal) => ({
          ...prevModal,
          validationError: errorMessage,
        }));
      }
    }
  };

  // Filtering and sorting logic
  const filteredTasks = useMemo(() => {
    // Sort first to maintain sort order during filtering
    const sortedTasks = [...tasks].sort((a, b) => {
      // Priority sorting
      if (sortConfig.key === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityOrder[a.priority] || 0;
        const priorityB = priorityOrder[b.priority] || 0;
        return sortConfig.direction === "asc"
          ? priorityA - priorityB
          : priorityB - priorityA;
      }

      // Due date sorting
      if (sortConfig.key === "dueDate") {
        const dateA = a.dueDate ? new Date(a.dueDate) : new Date(9999, 0, 1);
        const dateB = b.dueDate ? new Date(b.dueDate) : new Date(9999, 0, 1);

        return sortConfig.direction === "asc"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }

      return 0;
    });

    // Then filter
    return sortedTasks.filter((task) => {
      const matchesSearch =
        (task.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (task.description?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        );

      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchTerm, priorityFilter, sortConfig]);

  // Compute task summary
  const taskSummary = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((task) => task.completed).length,
      pending: tasks.filter((task) => !task.completed).length,
    }),
    [tasks]
  );

  // Render methods
  if (authLoading || isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your tasks...</div>
      </div>
    );
  }

  const user = userProfile || contextUser;

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="welcome-message">
          <span>Welcome, {user?.username || "User"}</span>
        </div>
        <button className="logout-button" onClick={() => logout()}>
          Logout
        </button>
      </div>

      {/* Error Alert */}
      {error && <div className="error-alert">{error}</div>}

      {/* Dashboard Controls */}
      <div className="dashboard-controls">
        {/* Search Input */}
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Additional Controls */}
        <div className="controls-right">
          {/* Priority Filter */}
          <div className="filter-container">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="priority-filter"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <FaFilter className="filter-icon" />
          </div>

          {/* Sort Dropdown */}
          <div className="sort-container">
            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split("-");
                setSortConfig({ key, direction });
              }}
              className="priority-filter"
            >
              <option value="dueDate-asc">Due Date (Closest)</option>
              <option value="dueDate-desc">Due Date (Furthest)</option>
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="priority-asc">Priority (Low to High)</option>
            </select>
            <FaSortAmountDown className="sort-icon" />
          </div>

          {/* Add Task Button */}
          <button className="add-task-button" onClick={() => openModal("add")}>
            <FaPlusCircle /> Add Task
          </button>
        </div>
      </div>

      {/* Task Summary */}
      <div className="task-summary">
        <div className="summary-item">
          <FaCheckCircle className="summary-icon completed" />
          <span>Completed: {taskSummary.completed}</span>
        </div>
        <div className="summary-item">
          <FaExclamationCircle className="summary-icon pending" />
          <span>Pending: {taskSummary.pending}</span>
        </div>
        <div className="summary-item">
          <span>Total Tasks: {taskSummary.total}</span>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="tasks-table-container">
        {filteredTasks.length === 0 ? (
          <p className="no-tasks-message">
            No tasks found. Create your first task!
          </p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th className="th-title">Title</th>
                <th className="th-priority">Priority</th>
                <th className="th-duedate">Due Date</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task._id}
                  className={`task-row ${task.completed ? "completed" : ""}`}
                >
                  <td
                    className="td-title clickable"
                    onClick={() => openDescriptionModal(task)}
                  >
                    {task.title}
                  </td>
                  <td className="td-priority">
                    <span className={`priority-badge ${task.priority}`}>
                      {task.priority.charAt(0).toUpperCase() +
                        task.priority.slice(1)}
                    </span>
                  </td>
                  <td className="td-duedate">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "-"}
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
                      onClick={() => openDeleteConfirmModal(task)}
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
        validationError={modal.validationError}
      />

      {/* Description Modal */}
      {descriptionModal.isOpen && (
        <div className="modal-overlay" onClick={closeDescriptionModal}>
          <div
            className="description-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{descriptionModal.task?.title}</h3>
            <div className="description-content">
              {descriptionModal.task?.description || "No description provided."}
            </div>
            <button className="close-button" onClick={closeDescriptionModal}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete the task "
              {deleteConfirmModal.task?.title}"?
            </p>
            <div className="modal-actions">
              <button
                className="task-button delete"
                onClick={() => handleTaskUpdated(deleteConfirmModal.task, true)}
              >
                Delete
              </button>
              <button
                className="task-button cancel"
                onClick={closeDeleteConfirmModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

// Dashboard.js
import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import TaskModal from "./tasks/TaskModal";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaPlusCircle,
  FaCheckCircle,
  FaExclamationCircle,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

// Create an axios instance with authentication
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000",
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

  // Toggle task completion status
  const toggleTaskCompletion = async (task) => {
    try {
      // Only send the completed field to avoid validation issues with dates
      const response = await api.patch(`/api/tasks/${task._id}`, {
        completed: !task.completed,
      });

      if (response.data && response.data.success) {
        const updatedTaskFromApi = response.data.data;
        setTasks(
          tasks.map((t) =>
            t._id === updatedTaskFromApi._id ? updatedTaskFromApi : t
          )
        );
        setError(null);
      }
    } catch (error) {
      console.error("Failed to update task completion status:", error);
      setError("Failed to update task status. Please try again.");
    }
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
      <div className="container text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading your tasks...</p>
      </div>
    );
  }

  const user = userProfile || contextUser;

  return (
    <div className="container-fluid px-4 py-3">
      {/* Dashboard Header */}
      <div className="row align-items-center mb-4">
        <div className="col">
          <h2 className="mb-0">Welcome, {user?.username || "User"}</h2>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          />
        </div>
      )}

      {/* Dashboard Controls */}
      <div className="row mb-4 g-3 align-items-center">
        {/* Search Input */}
        <div className="col-12 col-md-4">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Priority Filter */}
        <div className="col-6 col-md-2">
          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="col-6 col-md-2">
          <select
            className="form-select"
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={(e) => {
              const [key, direction] = e.target.value.split("-");
              setSortConfig({ key, direction });
            }}
          >
            <option value="dueDate-asc">Due Date (Closest)</option>
            <option value="dueDate-desc">Due Date (Furthest)</option>
            <option value="priority-desc">Priority (High to Low)</option>
            <option value="priority-asc">Priority (Low to High)</option>
          </select>
        </div>

        {/* Add Task Button */}
        <div className="col-12 col-md-4 text-end">
          <button className="btn btn-primary" onClick={() => openModal("add")}>
            <FaPlusCircle className="me-2" /> Add Task
          </button>
        </div>
      </div>

      {/* Task Summary */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body d-flex justify-content-between">
              <div className="d-flex align-items-center">
                <FaCheckCircle className="text-success me-2" />
                <span>Completed: {taskSummary.completed}</span>
              </div>
              <div className="d-flex align-items-center">
                <FaExclamationCircle className="text-warning me-2" />
                <span>Pending: {taskSummary.pending}</span>
              </div>
              <div>
                <span>Total Tasks: {taskSummary.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="row">
        <div className="col-12">
          {filteredTasks.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              No tasks found. Create your first task!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped">
                <thead className="table-light text-center">
                  <tr>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th className="text-center">Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {filteredTasks.map((task) => (
                    <tr
                      key={task._id}
                      className={task.completed ? "table-success" : ""}
                    >
                      <td
                        onClick={() => openDescriptionModal(task)}
                        style={{
                          cursor: "pointer",
                          textDecoration: task.completed
                            ? "line-through"
                            : "none",
                          color: task.completed ? "#198754" : "inherit",
                        }}
                      >
                        {task.title}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            task.priority === "high"
                              ? "bg-danger"
                              : task.priority === "medium"
                              ? "bg-warning"
                              : "bg-secondary"
                          }`}
                        >
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                        </span>
                      </td>
                      <td>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="text-center">
                        <div className="d-grid">
                          <button
                            className={`btn ${
                              task.completed
                                ? "btn-success"
                                : "btn-outline-secondary"
                            } btn-sm rounded-pill px-3`}
                            onClick={() => toggleTaskCompletion(task)}
                            title={
                              task.completed
                                ? "Mark as incomplete"
                                : "Mark as complete"
                            }
                          >
                            {task.completed ? (
                              <>
                                <FaCheck className="me-1" /> Completed
                              </>
                            ) : (
                              <>
                                <FaTimes className="me-1" /> Pending
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => openModal("edit", task)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => openDeleteConfirmModal(task)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Task Modal (keep the existing TaskModal component) */}
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
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          onClick={closeDescriptionModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{descriptionModal.task?.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDescriptionModal}
                />
              </div>
              <div className="modal-body">
                {descriptionModal.task?.description ||
                  "No description provided."}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeDescriptionModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDeleteConfirmModal}
                />
              </div>
              <div className="modal-body">
                Are you sure you want to delete the task "
                {deleteConfirmModal.task?.title}"?
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-danger"
                  onClick={() =>
                    handleTaskUpdated(deleteConfirmModal.task, true)
                  }
                >
                  Delete
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={closeDeleteConfirmModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

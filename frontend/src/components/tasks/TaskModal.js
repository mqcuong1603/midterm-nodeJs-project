import React, { useState, useEffect } from "react";
import "./TaskModal.css";

const TaskModal = ({ isOpen, onClose, task, onTaskUpdated, mode }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    completed: false,
  });
  const [error, setError] = useState("");

  // Initialize form data when task changes
  useEffect(() => {
    if (task && mode === "edit") {
      // Format the date for the input if it exists
      const formattedDate = task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "";

      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        dueDate: formattedDate,
        completed: task.completed || false,
      });
    } else {
      // Reset form for new task
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        completed: false,
      });
    }
  }, [task, mode]);

  const onChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    // Prepare data for submission to API
    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      completed: formData.completed,
    };

    // Only include dueDate if it's set
    if (formData.dueDate) {
      taskData.dueDate = formData.dueDate;
    }

    // Send data to parent component to handle API call
    onTaskUpdated(taskData, false);
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    onTaskUpdated(null, true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{mode === "edit" ? "Edit Task" : "Add New Task"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={onChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={onChange}
            />
          </div>

          {mode === "edit" && (
            <div className="form-group checkbox-group">
              <label htmlFor="completed">
                <input
                  type="checkbox"
                  id="completed"
                  name="completed"
                  checked={formData.completed}
                  onChange={onChange}
                />
                Mark as completed
              </label>
            </div>
          )}

          <div className="modal-actions">
            <button type="submit" className="save-button">
              Save Task
            </button>

            {mode === "edit" && (
              <button
                type="button"
                className="delete-button"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}

            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;

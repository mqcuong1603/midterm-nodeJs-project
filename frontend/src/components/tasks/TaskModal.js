import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const TaskModal = ({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
  mode,
  validationError,
}) => {
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
    <div className="modal fade show d-block" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {mode === "edit" ? "Edit Task" : "Add New Task"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {(error || validationError) && (
              <div className="alert alert-danger">
                {error || validationError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Title
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  rows="3"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="priority" className="form-label">
                  Priority
                </label>
                <select
                  className="form-select"
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

              <div className="mb-3">
                <label htmlFor="dueDate" className="form-label">
                  Due Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={onChange}
                />
              </div>

              {mode === "edit" && (
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="completed"
                    name="completed"
                    checked={formData.completed}
                    onChange={onChange}
                  />
                  <label className="form-check-label" htmlFor="completed">
                    Mark as completed
                  </label>
                </div>
              )}

              <div className="modal-footer">
                {mode === "edit" && (
                  <button
                    type="button"
                    className="btn btn-danger me-auto"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

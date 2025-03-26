import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import TaskModal from "./tasks/TaskModal";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
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
              description: "Write detailed documentation for the project",
              dueDate: "2025-04-15",
            },
            {
              id: 2,
              title: "Implement authentication",
              completed: true,
              priority: "high",
              description: "Set up JWT authentication for the app",
              dueDate: "2025-03-30",
            },
            {
              id: 3,
              title: "Design dashboard UI",
              completed: false,
              priority: "low",
              description: "Create a responsive design for the dashboard",
              dueDate: "2025-04-10",
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
    closeModal();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setPriorityFilter(e.target.value);
  };

  // Filter tasks based on search term and priority filter
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });

  const handleLogout = () => {
    if (logout) logout();
  };

  if (loading || isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header with app name, welcome message, and logout */}
      <div className="dashboard-header">
        <div className="app-title">Task Manager</div>
        <div className="welcome-message">
          Welcome, {user?.username || 'User'}
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Rest of the component remains the same */}
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
                  key={task.id} 
                  className={`task-row ${task.completed ? "completed" : ""}`}
                >
                  <td className="td-title">{task.title}</td>
                  <td className="td-description">{task.description}</td>
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
                          handleTaskUpdated(null, true);
                          setModal({ ...modal, task });
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
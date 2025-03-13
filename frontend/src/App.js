import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const API_URL = 'http://localhost:3000/api/tasks';

  useEffect(() => {
    // Fetch tasks when component mounts
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTask }),
      });
      
      const data = await response.json();
      setTasks([data, ...tasks]);
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleComplete = async (id, completed) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !completed }),
      });
      
      setTasks(tasks.map(task => 
        task._id === id ? { ...task, completed: !completed } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      
      setTasks(tasks.filter(task => task._id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Task Manager</h1>
        
        <form onSubmit={addTask} className="task-form">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task"
          />
          <button type="submit">Add Task</button>
        </form>
        
        <div className="task-list">
          {tasks.length === 0 ? (
            <p>No tasks yet. Add one above!</p>
          ) : (
            tasks.map(task => (
              <div key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <span onClick={() => toggleComplete(task._id, task.completed)}>
                  {task.title}
                </span>
                <button onClick={() => deleteTask(task._id)}>Delete</button>
              </div>
            ))
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
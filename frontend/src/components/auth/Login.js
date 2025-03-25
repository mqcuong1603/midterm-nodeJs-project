import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: 'http://localhost:3000', // Replace with your actual backend URL
  headers: {
    'Content-Type': 'application/json'
  }
});

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password
      });

      // Extract token from response
      const token = response.data.data?.token || response.data.token;
      
      if (token) {
        // Store token in localStorage
        localStorage.setItem("token", token);
        
        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        setError("Login failed. No authentication token received.");
      }
    } catch (err) {
      console.error("Login error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      // Handle different error response formats
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map(
          (error) => error.message || error.msg
        );
        setError(errorMessages.join(", "));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="auth-link">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")}>Register</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
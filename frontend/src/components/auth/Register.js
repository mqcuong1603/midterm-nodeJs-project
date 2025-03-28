import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

// Create an axios instance with the base URL using environment variable
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();

  const { username, email, password, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/register", {
        username,
        email,
        password,
        confirmPassword,
      });

      // Clear form and show success message
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Set registration success and redirect to login
      setRegistrationSuccess(true);

      // Optional: You can use a setTimeout to automatically redirect
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Registration error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map(
          (error) => error.message || error.msg
        );
        setError(errorMessages.join(", "));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>

        {registrationSuccess && (
          <div className="success-message">
            Registration successful! Redirecting to login...
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <form
          onSubmit={onSubmit}
          style={{ display: registrationSuccess ? "none" : "block" }}
        >
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={onChange}
              required
              minLength="3"
              disabled={loading || registrationSuccess}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              disabled={loading || registrationSuccess}
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
              minLength="8"
              disabled={loading || registrationSuccess}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
              disabled={loading || registrationSuccess}
            />
          </div>
          <button
            type="submit"
            className="auth-button"
            disabled={loading || registrationSuccess}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="auth-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default Register;

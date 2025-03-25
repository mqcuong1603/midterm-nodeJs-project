import axios from "axios";

// Using a relative path makes the code more portable across environments
const API_URL = "/api/auth";

const authService = {
  // Login user
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data.data;
  },

  // Register user
  register: async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await axios.get(`${API_URL}/profile`);
    return response.data.data;
  },
};

export default authService;

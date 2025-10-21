import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
  withCredentials: false, // Don't send cookies
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      "Making API request:",
      config.method?.toUpperCase(),
      config.url
    );
    console.log("Request data:", config.data);
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log("API response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("API response error:", error);
    if (error.code === "ECONNREFUSED") {
      console.error(
        "Connection refused - is the backend running on port 8000?"
      );
    }
    return Promise.reject(error);
  }
);

// PasswordAuth API service
export const passwordAuthAPI = {
  // Register a new user
  async register(username, password, email) {
    try {
      console.log("Attempting registration with:", { username, email });
      const response = await apiClient.post("/api/PasswordAuth/register", {
        username,
        password,
        email,
      });
      console.log("Registration response:", response.data);

      // Check if the response contains an error
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error headers:", error.response?.headers);

      // Handle different types of errors
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 404) {
        throw new Error(
          "API endpoint not found. Please check backend configuration."
        );
      } else if (error.code === "ECONNREFUSED") {
        throw new Error(
          "Cannot connect to backend server. Is it running on port 8000?"
        );
      } else {
        throw new Error(error.message || "Registration failed");
      }
    }
  },

  // Authenticate user
  async authenticate(username, password) {
    try {
      const response = await apiClient.post("/api/PasswordAuth/authenticate", {
        username,
        password,
      });

      // Check if the response contains an error
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || error.message || "Authentication failed"
      );
    }
  },

  // Change password
  async changePassword(username, currentPassword, newPassword) {
    try {
      const response = await apiClient.post(
        "/api/PasswordAuth/changePassword",
        {
          username,
          currentPassword,
          newPassword,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Password change failed");
    }
  },

  // Change email
  async changeEmail(username, password, newEmail) {
    try {
      const response = await apiClient.post("/api/PasswordAuth/changeEmail", {
        username,
        password,
        newEmail,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Email change failed");
    }
  },

  // Get email for username
  async getEmail(username) {
    try {
      const response = await apiClient.post("/api/PasswordAuth/_getEmail", {
        username,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to get email");
    }
  },

  // Check if username is registered
  async isRegistered(username) {
    try {
      const response = await apiClient.post("/api/PasswordAuth/_isRegistered", {
        username,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to check registration status"
      );
    }
  },

  // Deactivate account
  async deactivateAccount(username, password) {
    try {
      const response = await apiClient.post(
        "/api/PasswordAuth/deactivateAccount",
        {
          username,
          password,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Account deactivation failed"
      );
    }
  },
};

// SleepSchedule API service
export const sleepScheduleAPI = {
  // Add a sleep slot for a specific date
  async addSleepSlot(userId, bedTimeStr, wakeTimeStr, dateStr) {
    try {
      const response = await apiClient.post("/api/SleepSchedule/addSleepSlot", {
        u: userId,
        bedTimeStr,
        wakeTimeStr,
        dateStr,
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to add sleep slot"
      );
    }
  },

  // Remove a sleep slot for a specific date
  async removeSleepSlot(userId, dateStr) {
    try {
      const response = await apiClient.post(
        "/api/SleepSchedule/removeSleepSlot",
        {
          u: userId,
          dateStr,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to remove sleep slot"
      );
    }
  },

  // Get sleep slot for a specific date
  async getSleepSlot(userId, dateStr) {
    try {
      const response = await apiClient.post(
        "/api/SleepSchedule/_getSleepSlot",
        {
          u: userId,
          dateStr,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to get sleep slot"
      );
    }
  },

  // Get all sleep slots for a user
  async getAllSleepSlots(userId) {
    try {
      const response = await apiClient.post(
        "/api/SleepSchedule/_getAllSleepSlotsForUser",
        {
          u: userId,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to get sleep slots"
      );
    }
  },
};

export default apiClient;

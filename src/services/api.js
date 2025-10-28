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
  async addSleepSlot(
    userId,
    bedTimeStr,
    wakeTimeStr,
    dateStr,
    toleranceMins = 10
  ) {
    try {
      console.log("API: addSleepSlot called with:");
      console.log("  u:", userId);
      console.log("  bedTimeStr:", bedTimeStr);
      console.log("  wakeTimeStr:", wakeTimeStr);
      console.log("  dateStr:", dateStr);
      console.log("  toleranceMins:", toleranceMins);

      const response = await apiClient.post("/api/SleepSchedule/addSleepSlot", {
        u: userId,
        bedTimeStr,
        wakeTimeStr,
        dateStr,
        toleranceMins,
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

  // Report bedtime for a specific date
  async reportBedTime(userId, reportedTimeStr, dateStr) {
    try {
      const response = await apiClient.post(
        "/api/SleepSchedule/reportBedTime",
        {
          u: userId,
          reportedTimeStr,
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
          "Failed to report bedtime"
      );
    }
  },

  // Report wake-up time for a specific date
  async reportWakeUpTime(userId, reportedTimeStr, dateStr) {
    try {
      const response = await apiClient.post(
        "/api/SleepSchedule/reportWakeUpTime",
        {
          u: userId,
          reportedTimeStr,
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
          "Failed to report wake-up time"
      );
    }
  },
};

// CompetitionManager API service
export const competitionManagerAPI = {
  // Start a new competition
  async startCompetition(name, participants, startDateStr, endDateStr) {
    try {
      const response = await apiClient.post(
        "/api/CompetitionManager/startCompetition",
        {
          name,
          participants,
          startDateStr,
          endDateStr,
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
          "Failed to start competition"
      );
    }
  },

  // Record a sleep adherence event
  async recordStat(userId, dateStr, eventType, success) {
    try {
      const response = await apiClient.post(
        "/api/CompetitionManager/recordStat",
        {
          u: userId,
          dateStr,
          eventType,
          success,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || error.message || "Failed to record stat"
      );
    }
  },

  // End a competition
  async endCompetition(competitionId) {
    try {
      const response = await apiClient.post(
        "/api/CompetitionManager/endCompetition",
        {
          competitionId,
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
          "Failed to end competition"
      );
    }
  },

  // Get leaderboard for a competition
  async getLeaderboard(competitionId) {
    try {
      console.log("API: Fetching leaderboard for competition:", competitionId);
      const response = await apiClient.post(
        "/api/CompetitionManager/_getLeaderboard",
        {
          competitionId,
        }
      );

      console.log("API: Leaderboard response:", response.data);
      console.log("API: Response status:", response.status);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Check if the response is an array
      if (!Array.isArray(response.data)) {
        console.warn(
          "API: Leaderboard response is not an array:",
          response.data
        );
        // If it's wrapped in another structure, try to extract it
        if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }

      return response.data;
    } catch (error) {
      console.error("API: Leaderboard error:", error);
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to get leaderboard"
      );
    }
  },

  // Remove a participant from competition
  async removeParticipant(competitionId, userId) {
    try {
      const response = await apiClient.post(
        "/api/CompetitionManager/removeParticipant",
        {
          competitionId,
          userId,
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
          "Failed to remove participant"
      );
    }
  },

  // Get all competitions for a user
  async getCompetitionsForUser(userId) {
    try {
      console.log("API: Getting competitions for user:", userId);

      const response = await apiClient.post(
        "/api/CompetitionManager/_getCompetitionsForUser",
        {
          u: userId,
        }
      );

      console.log("API: Raw response:", response);
      console.log("API: Response data:", response.data);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      console.error("API: Error getting competitions:", error);
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to get competitions for user"
      );
    }
  },

  // Get reported dates for a user in a competition
  async getReportedDates(competitionId, userId, eventType) {
    try {
      const response = await apiClient.post(
        "/api/CompetitionManager/_getReportedDates",
        {
          competitionId,
          userId,
          eventType,
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
          "Failed to get reported dates"
      );
    }
  },
};

// Accountability API service
export const accountabilityAPI = {
  // Add a new accountability partner
  async addPartner(user, partner, notifyTypes, reportFrequency) {
    try {
      const response = await apiClient.post("/api/Accountability/addPartner", {
        user,
        partner,
        notifyTypes,
        reportFrequency,
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to add accountability partner"
      );
    }
  },

  // Remove an accountability partner
  async removePartner(user, partner) {
    try {
      const response = await apiClient.post(
        "/api/Accountability/removePartner",
        {
          user,
          partner,
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
          "Failed to remove accountability partner"
      );
    }
  },

  // Update partner preferences
  async updatePreferences(user, partner, notifyTypes, reportFrequency) {
    try {
      const response = await apiClient.post(
        "/api/Accountability/updatePreferences",
        {
          user,
          partner,
          notifyTypes,
          reportFrequency,
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
          "Failed to update partner preferences"
      );
    }
  },

  // Record adherence failure
  async recordFailure(user, date, failureType) {
    try {
      const response = await apiClient.post(
        "/api/Accountability/recordFailure",
        {
          user,
          date,
          failureType,
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
          "Failed to record failure"
      );
    }
  },

  // Report all failures from start to end date
  async reportAllFailuresFromStartToEnd(user, startDate, endDate) {
    try {
      const response = await apiClient.post(
        "/api/Accountability/reportAllFailuresFromStartToEnd",
        {
          user,
          startDate,
          endDate,
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
          "Failed to report failures"
      );
    }
  },

  // Generate notification message
  async generateNotificationMessage(user, date) {
    try {
      const response = await apiClient.post(
        "/api/Accountability/generateNotificationMessage",
        {
          user,
          date,
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
          "Failed to generate notification message"
      );
    }
  },

  // Get partnerships for a user
  async getPartnerships(user) {
    try {
      const response = await apiClient.post(
        "/api/Accountability/_getPartnerships",
        {
          user,
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
          "Failed to get partnerships"
      );
    }
  },
};

export default apiClient;

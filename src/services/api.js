import axios from "axios";
import authStore from "../stores/authStore";

const API_BASE_URL = "http://localhost:8000";

// Helper function to get session from auth store
function getSession() {
  const session = authStore.getSession();
  if (!session) {
    console.error("No session found in authStore. Current auth state:", {
      isLoggedIn: authStore.isLoggedIn(),
      currentUser: authStore.getUser(),
      session: authStore.getSession(),
    });
    throw new Error("No active session. Please log in.");
  }
  return session;
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout (increased for competition page with many participants)
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
  async register(username, password) {
    try {
      console.log("Attempting registration with:", { username });
      const response = await apiClient.post("/api/PasswordAuth/register", {
        username,
        password,
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

  // Get username for a user id
  async getUsername(userId) {
    try {
      const response = await apiClient.post("/api/PasswordAuth/_getUsername", {
        userId,
      });
      // Success response is an array: [{ username: string }]
      // Error response is an empty array: []
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0].username;
      }
      return null; // User not found or error
    } catch (error) {
      // On error, return null (API spec says error response is empty array)
      return null;
    }
  },

  // Get user ID by username
  async getUserByUsername(username) {
    try {
      const response = await apiClient.post(
        "/api/PasswordAuth/_getUserByUsername",
        {
          username,
        }
      );
      // Success response is an array: [{ user: ID }]
      // Error response is an empty array: []
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0].user;
      }
      return null; // User not found or error
    } catch (error) {
      // On error, return null (API spec says error response is empty array)
      return null;
    }
  },

  // Check if username is registered
  async isRegistered(username) {
    try {
      const response = await apiClient.post("/api/PasswordAuth/_isRegistered", {
        username,
      });
      // Success response: [{ isRegistered: boolean }]
      // Error response: { error: string }
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Return the array response (spec says Query returns array)
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to check registration status"
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

// Sessioning API service
export const sessioningAPI = {
  // Delete/logout session
  async deleteSession(session) {
    try {
      const response = await apiClient.post("/api/Sessioning/delete", {
        session,
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to delete session"
      );
    }
  },

  // Get user ID from session
  async getUser(session) {
    try {
      console.log("sessioningAPI.getUser called with session:", session);
      const response = await apiClient.post("/api/Sessioning/_getUser", {
        session,
      });

      console.log("_getUser response:", response.data);
      console.log("Response type:", typeof response.data);
      console.log("Is array:", Array.isArray(response.data));
      console.log(
        "Array length:",
        Array.isArray(response.data) ? response.data.length : "N/A"
      );

      // Success response is an array: [{ user: ID }]
      // Error response is an empty array: []
      if (Array.isArray(response.data) && response.data.length > 0) {
        const userId = response.data[0].user;
        console.log("Extracted userId:", userId);
        return userId;
      }
      console.warn("_getUser returned empty array or invalid response");
      return null; // Session not found or error
    } catch (error) {
      console.error("_getUser error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      // On error, return null (API spec says error response is empty array)
      return null;
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
      const session = getSession();
      console.log("API: addSleepSlot called with:");
      console.log("  u:", userId);
      console.log("  bedTimeStr:", bedTimeStr);
      console.log("  wakeTimeStr:", wakeTimeStr);
      console.log("  dateStr:", dateStr);
      console.log("  toleranceMins:", toleranceMins);

      const response = await apiClient.post("/api/SleepSchedule/addSleepSlot", {
        session,
        bedTimeStr,
        wakeTimeStr,
        toleranceMins,
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
      const session = getSession();
      const response = await apiClient.post(
        "/api/SleepSchedule/removeSleepSlot",
        {
          session,
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

      // Success response: [{ SleepSlot }] (array with value)
      // Error response: [] (empty array)
      if (Array.isArray(response.data)) {
        return response.data;
      }

      // If not an array, return empty array (error response format)
      return [];
    } catch (error) {
      // On error, return empty array (API spec says error response is empty array)
      return [];
    }
  },

  // Get all sleep slots for a user
  async getAllSleepSlots(userId) {
    try {
      // This is an EXCLUSION (Requesting framework), so it uses session
      const session = getSession();
      const response = await apiClient.post(
        "/api/SleepSchedule/_getAllSleepSlotsForUser",
        {
          session,
        }
      );

      // Success response: [{ SleepSlot }] (array)
      // Error response: [] (empty array)
      if (Array.isArray(response.data)) {
        return response.data;
      }

      // If not an array, return empty array (error response format)
      return [];
    } catch (error) {
      // On error, return empty array (API spec says error response is empty array)
      return [];
    }
  },

  // Report bedtime for a specific date
  async reportBedTime(userId, reportedTimeStr, dateStr) {
    try {
      const session = getSession();
      const response = await apiClient.post(
        "/api/SleepSchedule/reportBedTime",
        {
          session,
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
      const session = getSession();
      const response = await apiClient.post(
        "/api/SleepSchedule/reportWakeUpTime",
        {
          session,
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
      const session = getSession();
      const response = await apiClient.post(
        "/api/CompetitionManager/startCompetition",
        {
          session,
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

      // Success response: { winners: ID[] | null }
      // Note: winners can be null if all participants tie (per spec description)
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
      // This is an EXCLUSION (Requesting framework), so it uses session
      const session = getSession();
      console.log("API: Fetching leaderboard for competition:", competitionId);
      const response = await apiClient.post(
        "/api/CompetitionManager/_getLeaderboard",
        {
          session,
          competitionId,
        }
      );

      console.log("API: Leaderboard response:", response.data);
      console.log("API: Response status:", response.status);

      const data = response.data;

      if (data?.error) {
        throw new Error(data.error);
      }

      // New sync shape: { results: [...] }
      if (Array.isArray(data?.results)) {
        return data.results;
      }

      // Legacy shapes
      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data?.leaderboard)) {
        return data.leaderboard;
      }

      return [];
    } catch (error) {
      console.error("API: Leaderboard error:", error);
      // On error, return empty array (API spec says error response is empty array)
      return [];
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
      const session = getSession();
      console.log("API: Getting competitions for user:", userId);

      const response = await apiClient.post(
        "/api/CompetitionManager/_getCompetitionsForUser",
        {
          session,
        }
      );

      console.log("API: Raw response:", response);
      console.log("API: Response data:", response.data);
      if (response?.data?.results) {
        console.log(
          "API: Results keys sample:",
          response.data.results.map((item) => Object.keys(item || {}))
        );
      }

      const data = response.data;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Success response when sync wraps results: { results: [...] }
      if (data && Array.isArray(data.results)) {
        return data.results;
      }

      // Backward compatibility: handle array response directly
      if (Array.isArray(data)) {
        return data;
      }

      // If response nested further (e.g., { data: [...] })
      if (data && Array.isArray(data.data)) {
        return data.data;
      }

      // Default: empty array on unexpected format
      return [];
    } catch (error) {
      console.error("API: Error getting competitions:", error);
      // On error, return empty array (API spec says error response is empty array)
      return [];
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

      // Success response: [{ date: string }] (array of objects)
      // Error response: [] (empty array)
      // Note: API spec says array of objects, but backend might return string[]
      // Handle both formats for compatibility
      if (Array.isArray(response.data)) {
        // If it's an array of objects with date property, return as is
        // If it's an array of strings, convert to array of objects
        if (response.data.length > 0 && typeof response.data[0] === "string") {
          return response.data.map((date) => ({ date }));
        }
        return response.data;
      }

      // If not an array, return empty array (error response format)
      return [];
    } catch (error) {
      // On error, return empty array (API spec says error response is empty array)
      return [];
    }
  },
};

// Accountability API service
export const accountabilityAPI = {
  // Add a new accountability partner
  async addPartner(user, partner, notifyTypes) {
    try {
      const session = getSession();
      const response = await apiClient.post("/api/Accountability/addPartner", {
        session,
        partner,
        notifyTypes,
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
  // Note: user parameter is not used since this is an EXCLUSION (Requesting framework)
  // The backend extracts the user from the session automatically
  async removePartner(user, partner) {
    try {
      // This is an EXCLUSION (Requesting framework), so it uses session
      // The user parameter is kept for backward compatibility but is not sent to the API
      const session = getSession();
      const response = await apiClient.post(
        "/api/Accountability/removePartner",
        {
          session,
          partner,
        }
      );

      // Success response from sync: { success: true }
      // Error response: { error: string }
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Success response
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
  // Note: user parameter is not used since this is an EXCLUSION (Requesting framework)
  // The backend extracts the user from the session automatically
  async updatePreferences(user, partner, notifyTypes) {
    try {
      // This is an EXCLUSION (Requesting framework), so it uses session
      // The user parameter is kept for backward compatibility but is not sent to the API
      const session = getSession();
      const response = await apiClient.post(
        "/api/Accountability/updatePreferences",
        {
          session,
          partner,
          notifyTypes,
        }
      );

      // Success response from sync: { success: true }
      // Error response: { error: string }
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Success response
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

      // Success response: { message: string } (changed from report to message)
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
  // Note: user parameter is not used since this is an EXCLUSION (Requesting framework)
  // The backend extracts the user from the session automatically
  async getPartnerships(user) {
    try {
      // This is an EXCLUSION (Requesting framework), so it uses session
      // The user parameter is kept for backward compatibility but is not sent to the API
      const session = getSession();
      const response = await apiClient.post(
        "/api/Accountability/_getPartnerships",
        {
          session,
        }
      );

      console.log("getPartnerships response:", response.data);
      console.log("getPartnerships response type:", typeof response.data);
      console.log("getPartnerships is array:", Array.isArray(response.data));

      // Success response from sync: { results: [{ partnership: Partnership }] }
      // Backend returns Array<{ partnership: Partnership }>, sync wraps it in { results: ... }
      // Error response: [] (empty array) or { error: string }
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Check if response has results property (from sync)
      if (response.data.results && Array.isArray(response.data.results)) {
        console.log(
          "getPartnerships: Results array, length:",
          response.data.results.length
        );
        // Extract partnership objects from { partnership: Partnership } structure
        // Backend returns Array<{ partnership: Partnership }>, so we need to extract the partnership property
        const partnerships = response.data.results.map((item) => {
          // If item has a partnership property, extract it
          if (item.partnership) {
            return item.partnership;
          }
          // Otherwise, item itself is the partnership (backward compatibility)
          return item;
        });
        console.log(
          "getPartnerships: Extracted partnerships, length:",
          partnerships.length
        );
        return partnerships;
      }

      // Fallback: if response.data is directly an array (backward compatibility)
      if (Array.isArray(response.data)) {
        console.log(
          "getPartnerships: Direct array, length:",
          response.data.length
        );
        // Extract partnership objects from { partnership: Partnership } structure
        const partnerships = response.data.map((item) => {
          if (item.partnership) {
            return item.partnership;
          }
          return item;
        });
        return partnerships;
      }

      // If not an array, return empty array (error response format)
      console.warn(
        "getPartnerships: Response is not an array, returning empty array"
      );
      return [];
    } catch (error) {
      console.error("Error getting partnerships:", error);
      // On error, return empty array (API spec says error response is empty array)
      return [];
    }
  },

  // Get accountability seekers for a user (people who added current user)
  async getSeekersForUser(user) {
    try {
      const response = await apiClient.post(
        "/api/Accountability/_getAccountabilitySeekersForUser",
        {
          mentor: user,
        }
      );

      // Success response: ["string"] (array of user IDs)
      // Error response: { error: string } (object)
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Return the array response (spec says Query returns array)
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to get accountability seekers"
      );
    }
  },

  // Get all stored reports for a user-accountabilitySeeker pair
  async getAllReports(user, accountabilitySeeker) {
    try {
      const response = await apiClient.post(
        "/api/Accountability/_getAllReports",
        {
          user,
          accountabilitySeeker,
        }
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(
        error.response?.data?.error || error.message || "Failed to get reports"
      );
    }
  },

  // Trigger updateReports to generate and append summaries as needed
  async updateReports(user, date) {
    try {
      const response = await apiClient.post(
        "/api/Accountability/updateReports",
        {
          user,
          date,
        }
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to update reports"
      );
    }
  },
};

export default apiClient;

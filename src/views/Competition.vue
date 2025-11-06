<template>
  <div class="competition-container">
    <div class="competition-card">
      <!-- Competition Selection -->
      <div class="competition-header">
        <h2>🏆 Competition Dashboard</h2>
        <p>Select a competition to view details and leaderboard</p>
      </div>

      <div class="competition-selection">
        <div class="form-group">
          <label for="competitionSelect" class="form-label"
            >Select Competition</label
          >
          <select
            id="competitionSelect"
            v-model="selectedCompetitionId"
            @change="loadCompetitionDetails"
            class="form-select"
            :disabled="isLoading"
          >
            <option value="">Choose a competition...</option>
            <option
              v-for="competition in competitions"
              :key="competition.id"
              :value="competition.id"
            >
              {{ competition.name }} ({{ formatDate(competition.startDate) }} -
              {{ formatDate(competition.endDate) }})
            </option>
          </select>
        </div>
      </div>

      <!-- Competition Details -->
      <div v-if="selectedCompetition && !isLoading" class="competition-details">
        <!-- Trophy Header -->
        <div class="trophy-header">
          <div class="trophy-icon">🏆</div>
          <h1 class="competition-title">
            Competition {{ selectedCompetition.name }}
          </h1>
        </div>

        <!-- Competition Info -->
        <div class="competition-info">
          <div class="info-item">
            <span class="info-label">Start Date:</span>
            <span class="info-value">{{
              formatDate(selectedCompetition.startDate)
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">End Date:</span>
            <span class="info-value">{{
              formatDate(selectedCompetition.endDate)
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status:</span>
            <span
              class="info-value"
              :class="{
                'status-active': selectedCompetition.active,
                'status-ended': !selectedCompetition.active,
              }"
            >
              {{ selectedCompetition.active ? "Active" : "Ended" }}
            </span>
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="leaderboard-section">
          <h3>Leaderboard</h3>
          <div class="leaderboard-table">
            <div class="table-header">
              <div class="col-position">Position</div>
              <div class="col-username">Username</div>
              <div class="col-score">Score</div>
              <div class="col-report">Bedtime</div>
              <div class="col-report">Wake-up</div>
            </div>
            <div
              v-for="(entry, index) in leaderboard"
              :key="entry.userId"
              class="table-row"
              :class="{
                'first-place': index === 0 && entry.totalScore > 0,
                'second-place': index === 1 && entry.totalScore > 0,
                'third-place': index === 2 && entry.totalScore > 0,
              }"
            >
              <div class="col-position">
                <span v-if="index === 0 && entry.totalScore > 0" class="medal"
                  >🥇</span
                >
                <span
                  v-else-if="index === 1 && entry.totalScore > 0"
                  class="medal"
                  >🥈</span
                >
                <span
                  v-else-if="index === 2 && entry.totalScore > 0"
                  class="medal"
                  >🥉</span
                >
                <span v-else class="position-number">{{ entry.position }}</span>
              </div>
              <div class="col-username">
                {{ entry.username || entry.userId }}
              </div>
              <div class="col-score">{{ entry.totalScore }}</div>
              <div class="col-report">{{ entry.bedtimeReports || "0/0" }}</div>
              <div class="col-report">{{ entry.wakeupReports || "0/0" }}</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="competition-actions">
          <button
            @click="showRulesModal = true"
            class="btn btn-secondary btn-large"
          >
            Score Breakdown Rules
          </button>
          <button
            v-if="canEndCompetition"
            @click="endCompetition"
            class="btn btn-danger btn-large"
            :disabled="isEnding"
          >
            <span v-if="isEnding" class="loading-spinner"></span>
            {{ isEnding ? "Ending..." : "End Competition" }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>
          {{
            selectedCompetitionId
              ? "Loading competition details..."
              : "Loading competitions..."
          }}
        </p>
      </div>

      <!-- No Competitions Message -->
      <div
        v-if="!isLoading && competitions.length === 0 && !errorMessage"
        class="no-competitions"
      >
        <div class="no-competitions-icon">🏆</div>
        <h3>No Competitions Found</h3>
        <p>
          You haven't joined any competitions yet. Create a new competition to
          get started!
        </p>
        <router-link to="/competition-create" class="btn btn-primary">
          Create Competition
        </router-link>
      </div>

      <!-- Error Messages -->
      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Competition Finished Modal -->
    <div
      v-if="showFinishedModal"
      class="modal-overlay"
      @click="closeFinishedModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>🎉 Competition Finished!</h2>
          <button @click="closeFinishedModal" class="modal-close">
            &times;
          </button>
        </div>

        <div class="modal-body">
          <div class="winners-section">
            <h3>Winners:</h3>
            <div class="winners-list">
              <span
                v-for="(winner, index) in winners"
                :key="winner"
                class="winner-name"
                :class="{ 'first-winner': index === 0 }"
              >
                {{ winner }}
                <span v-if="index < winners.length - 1">, </span>
              </span>
            </div>
          </div>

          <div class="podium-section">
            <h3>Final Results</h3>
            <div class="podium">
              <div
                v-for="(entry, index) in topParticipants"
                :key="entry.userId"
                class="podium-bar"
                :class="`place-${index + 1}`"
                :style="{ height: getPodiumHeight(index) }"
              >
                <div class="podium-position">{{ index + 1 }}</div>
                <div class="podium-user">{{ entry.userId }}</div>
                <div class="podium-score">{{ entry.totalScore }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeFinishedModal" class="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Rules Modal -->
    <div
      v-if="showRulesModal"
      class="modal-overlay"
      @click="showRulesModal = false"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>📊 Score Breakdown Rules</h2>
          <button @click="showRulesModal = false" class="modal-close">
            &times;
          </button>
        </div>

        <div class="modal-body">
          <div class="rules-section">
            <h3>How Scores Work:</h3>
            <ul class="rules-list">
              <li><strong>+1</strong> for every successful bedtime report</li>
              <li><strong>+1</strong> for every successful wake-up report</li>
              <li>
                <strong>+0</strong> for every failed report (too early or too
                late outside your tolerance)
              </li>
              <li>
                <strong>-1</strong> penalty applied at the end for every missing
                bedtime report
              </li>
              <li>
                <strong>-1</strong> penalty applied at the end for every missing
                wake-up report
              </li>
            </ul>

            <p class="rules-note">
              <strong>Note:</strong> Success depends on your sleep schedule
              tolerance settings. Be consistent and report every night to
              maximize your score!
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showRulesModal = false" class="btn btn-primary">
            Got it!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  competitionManagerAPI,
  passwordAuthAPI,
  sessioningAPI,
} from "../services/api";
import authStore from "../stores/authStore";

export default {
  name: "Competition",
  data() {
    return {
      competitions: [], // Populated from CompetitionManager API
      selectedCompetitionId: "",
      selectedCompetition: null,
      leaderboard: [],
      winners: [],
      isLoading: false,
      isEnding: false,
      errorMessage: "",
      showFinishedModal: false,
      showRulesModal: false,
    };
  },
  computed: {
    canEndCompetition() {
      if (!this.selectedCompetition || !this.selectedCompetition.active) {
        return false;
      }

      const today = new Date();
      const endDate = new Date(this.selectedCompetition.endDate);

      return today >= endDate;
    },
    topParticipants() {
      return this.leaderboard.slice(0, Math.min(3, this.leaderboard.length));
    },
  },
  mounted() {
    this.loadCompetitions();
  },
  methods: {
    async loadCompetitions() {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        // OLD WAY (for reversion): const userId = authStore.getUserId();
        // NEW WAY: Get user ID from session using _getUser
        const session = authStore.getSession();
        if (!session) {
          throw new Error("Please log in to view competitions");
        }
        const userId = await sessioningAPI.getUser(session);
        if (!userId) {
          throw new Error(
            "Failed to load user information. Please log in again."
          );
        }

        const competitionsData =
          await competitionManagerAPI.getCompetitionsForUser(userId);

        console.log("Raw API response:", competitionsData);
        console.log("Response type:", typeof competitionsData);
        console.log("Is array:", Array.isArray(competitionsData));

        // Handle different response formats
        let competitionsArray = competitionsData;

        // If the response is wrapped in an array (as per API spec), use it directly
        if (Array.isArray(competitionsData)) {
          competitionsArray = competitionsData;
        }
        // If it's an object with a data property, extract it
        else if (competitionsData && competitionsData.data) {
          competitionsArray = competitionsData.data;
        }
        // If it's a single object, wrap it in an array
        else if (competitionsData && typeof competitionsData === "object") {
          competitionsArray = [competitionsData];
        }
        // If it's null or undefined, use empty array
        else {
          competitionsArray = [];
        }

        console.log("Processed competitions array:", competitionsArray);

        // Transform the API response to match our component's expected format
        this.competitions = competitionsArray.map((comp) => ({
          id: comp._id,
          name: comp.name,
          startDate: comp.startDate,
          endDate: comp.endDate,
          active: comp.active,
          participants: comp.participants,
          winners: comp.winners,
        }));

        console.log("Transformed competitions:", this.competitions);
      } catch (error) {
        this.errorMessage = error.message;
        this.competitions = [];
      } finally {
        this.isLoading = false;
      }
    },

    async loadCompetitionDetails() {
      if (!this.selectedCompetitionId) {
        this.selectedCompetition = null;
        this.leaderboard = [];
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";

      try {
        // Find the selected competition
        this.selectedCompetition = this.competitions.find(
          (comp) => comp.id === this.selectedCompetitionId
        );

        if (!this.selectedCompetition) {
          throw new Error("Competition not found");
        }

        // Load leaderboard
        console.log(
          "Loading leaderboard for competition:",
          this.selectedCompetitionId
        );
        const leaderboardData = await competitionManagerAPI.getLeaderboard(
          this.selectedCompetitionId
        );
        console.log("Leaderboard data received:", leaderboardData);
        console.log("Leaderboard data type:", typeof leaderboardData);
        console.log("Is array?", Array.isArray(leaderboardData));

        // Check if response has error field
        if (leaderboardData && leaderboardData.error) {
          console.error("Leaderboard error:", leaderboardData.error);
          throw new Error(leaderboardData.error);
        }

        // Ensure it's an array
        if (!Array.isArray(leaderboardData)) {
          console.warn("Leaderboard data is not an array:", leaderboardData);
          this.leaderboard = [];
        } else {
          // Calculate total days in competition
          const startDate = new Date(this.selectedCompetition.startDate);
          const endDate = new Date(this.selectedCompetition.endDate);
          const totalDays =
            Math.floor(
              (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;

          // Fetch report counts for each participant and convert userId to username
          this.leaderboard = await Promise.all(
            leaderboardData.map(async (entry) => {
              try {
                // Get username for display
                const username = await passwordAuthAPI.getUsername(
                  entry.userId
                );

                const [bedtimeDates, wakeupDates] = await Promise.all([
                  competitionManagerAPI.getReportedDates(
                    this.selectedCompetitionId,
                    entry.userId,
                    "BEDTIME"
                  ),
                  competitionManagerAPI.getReportedDates(
                    this.selectedCompetitionId,
                    entry.userId,
                    "WAKETIME"
                  ),
                ]);

                const bedtimeCount = Array.isArray(bedtimeDates)
                  ? bedtimeDates.length
                  : 0;
                const wakeupCount = Array.isArray(wakeupDates)
                  ? wakeupDates.length
                  : 0;

                return {
                  ...entry,
                  username: username || entry.userId, // Display username, fallback to userId
                  bedtimeReports: `${bedtimeCount}/${totalDays}`,
                  wakeupReports: `${wakeupCount}/${totalDays}`,
                };
              } catch (error) {
                console.error(
                  `Error getting report counts for ${entry.userId}:`,
                  error
                );
                // Handle timeout errors gracefully - show ?/? instead of 0/0
                if (
                  error.code === "ECONNABORTED" ||
                  error.message?.includes("timeout")
                ) {
                  console.warn(`Timeout fetching reports for ${entry.userId}`);
                  return {
                    ...entry,
                    username: entry.username || entry.userId, // Preserve username if already set
                    bedtimeReports: "?/?",
                    wakeupReports: "?/?",
                  };
                }
                return {
                  ...entry,
                  username: entry.userId, // Fallback to userId if username lookup fails
                  bedtimeReports: "0/0",
                  wakeupReports: "0/0",
                };
              }
            })
          );
        }
      } catch (error) {
        // Handle timeout errors with a user-friendly message
        if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          this.errorMessage =
            "Request timed out. The competition may have many participants. Please try again or contact support.";
          console.error("Competition page timeout:", error);
        } else {
          this.errorMessage = error.message;
        }
      } finally {
        this.isLoading = false;
      }
    },

    async endCompetition() {
      if (!this.selectedCompetitionId) {
        return;
      }

      this.isEnding = true;
      this.errorMessage = "";

      try {
        const result = await competitionManagerAPI.endCompetition(
          this.selectedCompetitionId
        );
        this.winners = result.winners || [];

        // Update competition status
        this.selectedCompetition.active = false;

        // Reload leaderboard to get final scores
        await this.loadCompetitionDetails();

        // Show finished modal
        this.showFinishedModal = true;
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.isEnding = false;
      }
    },

    closeFinishedModal() {
      this.showFinishedModal = false;
    },

    formatDate(dateObj) {
      // The backend's parseDateString creates a UTC date: "2025-10-27" -> "2025-10-27T00:00:00.000Z"
      // MongoDB stores this UTC timestamp. When we parse it and display in EDT, it shows the previous day!
      // Solution: Extract the UTC date components to get back the original date
      const date = new Date(dateObj);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      const localDate = new Date(year, month, day);

      return localDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },

    getPodiumHeight(index) {
      const heights = ["120px", "90px", "60px"];
      return heights[index] || "40px";
    },
  },
};
</script>

<style scoped>
.competition-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.competition-card {
  background: rgba(30, 42, 71, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  padding: 30px;
  color: #e6eaf8;
}

.competition-header {
  text-align: center;
  margin-bottom: 30px;
}

.competition-header h2 {
  color: #f8f9fc;
  margin-bottom: 10px;
  font-size: 1.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.competition-selection {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #f8f9fc;
}

.form-select {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 16px;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e6eaf8;
  transition: all 0.4s ease;
}

.form-select option {
  background: #1e2a47;
  color: #e6eaf8;
}

.form-select:hover {
  border-color: rgba(167, 139, 250, 0.3);
  box-shadow: 0 0 8px rgba(167, 139, 250, 0.2);
  background: rgba(30, 42, 71, 0.7);
}

.form-select:focus {
  outline: none;
  border-color: rgba(167, 139, 250, 0.5);
  background: rgba(30, 42, 71, 0.8);
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.15),
    0 0 12px rgba(167, 139, 250, 0.3);
}

.trophy-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(224, 231, 255, 0.3);
  border: 1px solid #d6bcfa;
  border-radius: 12px;
}

.trophy-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.competition-title {
  font-size: 2rem;
  color: #a78bfa;
  margin: 0;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.04em;
  text-shadow: 0 2px 4px rgba(167, 139, 250, 0.3);
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.competition-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.info-label {
  font-weight: 600;
  color: rgba(230, 234, 248, 0.7);
}

.info-value {
  color: #e6eaf8;
}

.status-active {
  color: #28a745 !important;
  font-weight: 600;
}

.status-ended {
  color: #dc3545 !important;
  font-weight: 600;
}

.leaderboard-section {
  margin-bottom: 30px;
}

.leaderboard-section h3 {
  color: #a78bfa;
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.leaderboard-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: grid;
  grid-template-columns: 80px 1fr 100px 100px 100px;
  background: linear-gradient(90deg, #5b5fe9, #a78bfa);
  color: white;
  font-weight: 700;
  padding: 15px;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px 100px 100px;
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background-color 0.3s ease;
  background: rgba(30, 42, 71, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e6eaf8;
}

.table-row:hover {
  background-color: rgba(45, 59, 104, 0.7);
}

.table-row:last-child {
  border-bottom: none;
}

.first-place {
  background: linear-gradient(135deg, #d4af37, #c9a529);
  color: #0d1b2a !important;
}

.first-place .col-username,
.first-place .col-score,
.first-place .col-report,
.first-place .col-position {
  color: #0d1b2a;
  font-weight: 600;
}

.second-place {
  background: linear-gradient(135deg, #a8a8a8, #c0c0c0);
  color: #0d1b2a !important;
}

.second-place .col-username,
.second-place .col-score,
.second-place .col-report,
.second-place .col-position {
  color: #0d1b2a;
  font-weight: 600;
}

.third-place {
  background: linear-gradient(135deg, #b8860b, #cd853f);
  color: #0d1b2a !important;
}

.third-place .col-username,
.third-place .col-score,
.third-place .col-report,
.third-place .col-position {
  color: #0d1b2a;
  font-weight: 600;
}

.col-position {
  display: flex;
  align-items: center;
  justify-content: center;
}

.medal {
  font-size: 24px;
}

.position-number {
  font-weight: 600;
  color: #6c757d;
}

.col-username {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.col-score {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.col-report {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.95rem;
}

.competition-actions {
  text-align: center;
  margin-top: 30px;
}

.loading-state {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-banner {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.no-competitions {
  text-align: center;
  padding: 60px 20px;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin: 20px 0;
  color: #e6eaf8;
}

.no-competitions-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.no-competitions h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.5rem;
}

.no-competitions p {
  color: #6c757d;
  margin-bottom: 30px;
  font-size: 1.1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(30, 42, 71, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  color: #e6eaf8;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h2 {
  margin: 0;
  color: #e6eaf8;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 20px;
}

.winners-section {
  text-align: center;
  margin-bottom: 30px;
}

.winners-section h3 {
  color: #e6eaf8;
  margin-bottom: 15px;
  font-size: 1.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.winners-list {
  font-size: 1.2rem;
  font-weight: 600;
  color: #e6eaf8;
}

.first-winner {
  color: #ffd700;
  font-size: 1.4rem;
}

.rules-section {
  margin-bottom: 20px;
}

.rules-section h3 {
  color: #e6eaf8;
  margin-bottom: 15px;
  font-size: 1.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.rules-list li {
  padding: 10px 0;
  color: #e6eaf8;
  font-size: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.rules-list li strong {
  color: #a78bfa;
  font-weight: 600;
}

.rules-list li:last-child {
  border-bottom: none;
}

.rules-note {
  padding: 15px;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-left: 4px solid #5b5fe9;
  border-radius: 4px;
  color: #e6eaf8;
  font-size: 0.95rem;
  margin: 20px 0 0 0;
}

.rules-note strong {
  color: #a78bfa;
  font-weight: 600;
}

.podium-section h3 {
  color: #e6eaf8;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.podium {
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 20px;
  min-height: 150px;
}

.podium-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: end;
  background: linear-gradient(90deg, #5b5fe9, #a78bfa);
  border-radius: 8px 8px 0 0;
  min-width: 80px;
  padding: 10px;
  color: white;
  position: relative;
}

.podium-bar.place-1 {
  background: linear-gradient(135deg, #ffd700, #f39c12);
}

.podium-bar.place-2 {
  background: linear-gradient(135deg, #c0c0c0, #95a5a6);
}

.podium-bar.place-3 {
  background: linear-gradient(135deg, #cd7f32, #e67e22);
}

.podium-position {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 10px;
}

.podium-user {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 5px;
  text-align: center;
}

.podium-score {
  font-size: 1.1rem;
  font-weight: 700;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(90deg, #5b5fe9, #a78bfa);
  color: white;
  border-radius: 12px;
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(90deg, #a78bfa, #5b5fe9);
  box-shadow: 0 4px 16px rgba(167, 139, 250, 0.5),
    0 0 10px rgba(167, 139, 250, 0.4);
  transform: translateY(-2px) scale(1.02);
  transition: all 0.4s ease;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-secondary {
  background: #e5e7eb;
  color: #0d1b2a;
  margin-right: 10px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #9bb8ff;
  border-color: #9bb8ff;
  box-shadow: 0 0 10px rgba(155, 184, 255, 0.4);
  transition: all 0.4s ease;
}

.btn-large {
  padding: 15px 30px;
  font-size: 18px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

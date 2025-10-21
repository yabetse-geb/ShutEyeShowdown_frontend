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
              {{ competition.name }} ({{ competition.startDate }} -
              {{ competition.endDate }})
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
              <div class="col-username">{{ entry.userId }}</div>
              <div class="col-score">{{ entry.totalScore }}</div>
            </div>
          </div>
        </div>

        <!-- End Competition Button -->
        <div class="competition-actions">
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
  </div>
</template>

<script>
import { competitionManagerAPI } from "../services/api";
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
        const username = authStore.getUsername();
        if (!username) {
          throw new Error("Please log in to view competitions");
        }

        const competitionsData =
          await competitionManagerAPI.getCompetitionsForUser(username);

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
        const leaderboardData = await competitionManagerAPI.getLeaderboard(
          this.selectedCompetitionId
        );
        this.leaderboard = leaderboardData;
      } catch (error) {
        this.errorMessage = error.message;
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

    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
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
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.competition-header {
  text-align: center;
  margin-bottom: 30px;
}

.competition-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
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
  color: #2c3e50;
}

.form-select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 16px;
  background-color: white;
  transition: border-color 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: #3498db;
}

.trophy-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
}

.trophy-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.competition-title {
  font-size: 2.5rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
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
  background: #f8f9fa;
  border-radius: 8px;
}

.info-label {
  font-weight: 600;
  color: #6c757d;
}

.info-value {
  color: #2c3e50;
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
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.leaderboard-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  background: #3498db;
  color: white;
  font-weight: 600;
  padding: 15px;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  padding: 15px;
  border-bottom: 1px solid #e1e8ed;
  transition: background-color 0.3s ease;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.table-row:last-child {
  border-bottom: none;
}

.first-place {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
}

.second-place {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
}

.third-place {
  background: linear-gradient(135deg, #cd7f32, #daa520);
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
  background: #f8f9fa;
  border-radius: 12px;
  margin: 20px 0;
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
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
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
  color: #2c3e50;
  margin-bottom: 15px;
}

.winners-list {
  font-size: 1.2rem;
  font-weight: 600;
}

.first-winner {
  color: #ffd700;
  font-size: 1.4rem;
}

.podium-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
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
  background: linear-gradient(135deg, #3498db, #2980b9);
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
  border-top: 1px solid #e1e8ed;
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
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
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

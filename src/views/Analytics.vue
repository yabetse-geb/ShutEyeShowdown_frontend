<template>
  <div class="analytics-container">
    <div class="analytics-card">
      <div class="analytics-header">
        <h2>📊 Sleep Analytics</h2>
        <p>Your personal sleep performance insights</p>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your analytics...</p>
      </div>

      <div v-else-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <div v-else class="analytics-content">
        <!-- Current Week Report -->
        <div class="stats-section">
          <h3>📅 Current Week Report</h3>
          <div class="week-table">
            <div class="week-row week-header">
              <div class="week-col day">Day</div>
              <div class="week-col date">Date</div>
              <div class="week-col status">Bedtime</div>
              <div class="week-col status">Wake-up</div>
            </div>
            <div v-for="(d, idx) in weekReport" :key="idx" class="week-row">
              <div class="week-col day">{{ d.dayName }}</div>
              <div class="week-col date">{{ d.dateStr }}</div>
              <div
                class="week-col status"
                :class="statusClass(d.bedTimeSuccess)"
              >
                {{ statusLabel(d.bedTimeSuccess) }}
              </div>
              <div
                class="week-col status"
                :class="statusClass(d.wakeUpSuccess)"
              >
                {{ statusLabel(d.wakeUpSuccess) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import authStore from "../stores/authStore";
import { sleepScheduleAPI, sessioningAPI } from "../services/api";

export default {
  name: "Analytics",
  data() {
    return {
      isLoading: false,
      errorMessage: "",
      weekReport: [],
    };
  },
  async mounted() {
    if (authStore.isLoggedIn()) {
      await this.loadAnalytics();
    }
  },
  methods: {
    async buildCurrentWeekReportFromAPI() {
      // OLD WAY (for reversion): const userId = authStore.getUserId();
      // NEW WAY: Get user ID from session using _getUser
      const session = authStore.getSession();
      if (!session) {
        this.weekReport = [];
        return;
      }
      const userId = await sessioningAPI.getUser(session);
      if (!userId) {
        this.weekReport = [];
        return;
      }

      const today = new Date();
      const startOfWeek = this.getStartOfWeek(today);
      const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      const requests = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toLocaleDateString("en-CA");
        requests.push(
          sleepScheduleAPI
            .getSleepSlot(userId, dateStr)
            .then((resp) => ({ dateStr, resp }))
            .catch(() => ({ dateStr, resp: null }))
        );
      }

      const results = await Promise.all(requests);
      this.weekReport = results.map((item, idx) => {
        let slot = null;
        if (Array.isArray(item.resp)) {
          slot = item.resp.length > 0 ? item.resp[0] : null;
        } else if (
          item &&
          item.resp &&
          typeof item.resp === "object" &&
          !item.resp.error
        ) {
          slot = item.resp;
        }
        const toTriState = (v) =>
          v === true ? true : v === false ? false : null;
        const bedTimeSuccess = slot ? toTriState(slot.bedTimeSuccess) : null;
        const wakeUpSuccess = slot ? toTriState(slot.wakeUpSuccess) : null;
        return {
          dayName: days[idx],
          dateStr: item.dateStr,
          bedTimeSuccess,
          wakeUpSuccess,
        };
      });
    },

    statusLabel(val) {
      if (val === true) return "Succeeded";
      if (val === false) return "Failed";
      return "Not reported";
    },

    statusClass(val) {
      return {
        success: val === true,
        failure: val === false,
        pending: val === null || val === undefined,
      };
    },
    async loadAnalytics() {
      this.isLoading = true;
      this.errorMessage = "";

      try {
        // OLD WAY (for reversion): const userId = authStore.getUserId();
        // NEW WAY: Get user ID from session using _getUser (called in buildCurrentWeekReportFromAPI)
        const session = authStore.getSession();
        if (!session) {
          throw new Error("Please log in to view analytics");
        }

        // Build current week report using per-day _getSleepSlot API
        await this.buildCurrentWeekReportFromAPI();
      } catch (error) {
        console.error("Error loading analytics:", error);
        this.errorMessage = error.message || "Error loading analytics";
      } finally {
        this.isLoading = false;
      }
    },

    getStartOfWeek(date) {
      const dayOfWeek = date.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek;
    },
  },
};
</script>

<style scoped>
.analytics-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.analytics-card {
  background: rgba(30, 42, 71, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  padding: 30px;
  color: #e6eaf8;
}

.analytics-header {
  text-align: center;
  margin-bottom: 40px;
}

.analytics-header h2 {
  color: #f8f9fc;
  margin-bottom: 10px;
  font-size: 2.2rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.analytics-header p {
  color: #e0e7ff;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.stats-section {
  margin-bottom: 40px;
}

.stats-section h3 {
  color: #e6eaf8;
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  border-bottom: 2px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 10px;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

/* Week report table */
.week-table {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(30, 42, 71, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.week-row {
  display: grid;
  grid-template-columns: 160px 150px 1fr 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(30, 42, 71, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e6eaf8;
}

.week-header {
  background: rgba(30, 42, 71, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-weight: 600;
  color: #e6eaf8;
}

.week-col.day {
  color: #e6eaf8;
  font-weight: 500;
}

.week-col.date {
  color: rgba(230, 234, 248, 0.8);
}

.week-col.status {
  font-weight: 600;
}

.week-col.status.success {
  color: #68d391;
}

.week-col.status.failure {
  color: #fc8181;
}

.week-col.status.pending {
  color: rgba(230, 234, 248, 0.7);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  background: rgba(45, 59, 104, 0.7);
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.12);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #a78bfa;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #e6eaf8;
  margin-bottom: 5px;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.stat-label {
  color: rgba(230, 234, 248, 0.8);
  font-size: 0.95rem;
  font-weight: 500;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
  letter-spacing: 0.02em;
}

.day-analysis {
  max-width: 600px;
  margin: 0 auto;
}

.best-day-card {
  background: linear-gradient(90deg, #5b5fe9, #a78bfa);
  color: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
}

.best-day-name {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.best-day-stats {
  display: flex;
  justify-content: space-around;
}

.best-day-stat {
  display: flex;
  flex-direction: column;
}

.stat-value-small {
  font-size: 2rem;
  font-weight: 700;
}

.stat-label-small {
  font-size: 0.9rem;
  opacity: 0.9;
}

.activity-list {
  background: rgba(30, 42, 71, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.activity-item:hover {
  background: rgba(45, 59, 104, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.12);
}

.activity-icon {
  font-size: 1.5rem;
  color: #a78bfa;
}

.activity-text {
  flex: 1;
  color: #e6eaf8;
  font-weight: 500;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.activity-date {
  color: rgba(230, 234, 248, 0.7);
  font-size: 0.9rem;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.no-activity {
  text-align: center;
  color: rgba(230, 234, 248, 0.7);
  padding: 30px;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.loading-state {
  text-align: center;
  padding: 60px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #a78bfa;
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
  text-align: center;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .best-day-stats {
    flex-direction: column;
    gap: 15px;
  }
}
</style>

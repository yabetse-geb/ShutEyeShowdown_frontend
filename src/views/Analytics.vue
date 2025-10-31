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
        <!-- Competition Stats -->
        <div class="stats-section">
          <h3>🏆 Competition Performance</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📈</div>
              <div class="stat-value">
                {{ competitionStats.totalCompetitions }}
              </div>
              <div class="stat-label">Total Competitions</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-value">{{ competitionStats.winRate }}%</div>
              <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🔥</div>
              <div class="stat-value">{{ competitionStats.longestStreak }}</div>
              <div class="stat-label">Best Streak (Days)</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⭐</div>
              <div class="stat-value">{{ competitionStats.avgScore }}</div>
              <div class="stat-label">Average Score</div>
            </div>
          </div>
        </div>

        <!-- Sleep Quality Stats -->
        <div class="stats-section">
          <h3>😴 Sleep Quality</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">⏰</div>
              <div class="stat-value">{{ sleepStats.avgSleepDuration }}</div>
              <div class="stat-label">Avg Sleep Duration</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-value">{{ sleepStats.successRate }}%</div>
              <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-value">{{ sleepStats.bedtimeConsistency }}%</div>
              <div class="stat-label">Bedtime Consistency</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🌅</div>
              <div class="stat-value">{{ sleepStats.wakeupConsistency }}%</div>
              <div class="stat-label">Wake-up Consistency</div>
            </div>
          </div>
        </div>

        <!-- Day of Week Analysis -->
        <div class="stats-section">
          <h3>📅 Best Performing Day</h3>
          <div class="day-analysis">
            <div class="best-day-card">
              <div class="best-day-name">{{ bestDay }}</div>
              <div class="best-day-stats">
                <div class="best-day-stat">
                  <span class="stat-value-small"
                    >{{ dayStats.successRate }}%</span
                  >
                  <span class="stat-label-small">Success Rate</span>
                </div>
                <div class="best-day-stat">
                  <span class="stat-value-small">{{
                    dayStats.avgDuration
                  }}</span>
                  <span class="stat-label-small">Avg Duration</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="stats-section">
          <h3>📝 Recent Activity</h3>
          <div class="activity-list">
            <div
              v-for="(activity, index) in recentActivity"
              :key="index"
              class="activity-item"
            >
              <span class="activity-icon">{{ activity.icon }}</span>
              <span class="activity-text">{{ activity.text }}</span>
              <span class="activity-date">{{ activity.date }}</span>
            </div>
            <div v-if="recentActivity.length === 0" class="no-activity">
              No recent activity to display
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import authStore from "../stores/authStore";
import { sleepScheduleAPI, competitionManagerAPI } from "../services/api";

export default {
  name: "Analytics",
  data() {
    return {
      isLoading: false,
      errorMessage: "",
      weekReport: [],
      competitionStats: {
        totalCompetitions: 0,
        winRate: 0,
        longestStreak: 0,
        avgScore: 0,
      },
      sleepStats: {
        avgSleepDuration: "N/A",
        successRate: 0,
        bedtimeConsistency: 0,
        wakeupConsistency: 0,
      },
      bestDay: "N/A",
      dayStats: {
        successRate: 0,
        avgDuration: "N/A",
      },
      recentActivity: [],
    };
  },
  async mounted() {
    if (authStore.isLoggedIn()) {
      await this.loadAnalytics();
    }
  },
  methods: {
    buildCurrentWeekReport(sleepSlots) {
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

      const slotsByKey = new Map();
      const ymdFromUTC = (d) => {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const da = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
      };
      const keyFromAnyDateVal = (val) => {
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        const ymd = ymdFromUTC(d);
        // Critical: Use new Date("YYYY-MM-DD") so it parses at UTC midnight consistently
        return new Date(ymd).getTime();
      };
      const keyFromLocalDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        const ymd = `${y}-${m}-${da}`;
        return new Date(ymd).getTime();
      };
      const normalizeBool = (v) => {
        if (v === true || v === "true") return true;
        if (v === false || v === "false") return false;
        return null;
      };
      if (Array.isArray(sleepSlots)) {
        sleepSlots.forEach((s) => {
          if (s && s.date) {
            const key = keyFromAnyDateVal(s.date);
            if (key !== null) {
              slotsByKey.set(key, {
                ...s,
                bedTimeSuccess: normalizeBool(s.bedTimeSuccess),
                wakeUpSuccess: normalizeBool(s.wakeUpSuccess),
              });
            }
          }
        });
      }

      const report = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toLocaleDateString("en-CA");
        const lookupKey = keyFromLocalDate(date);
        const slot = slotsByKey.get(lookupKey);
        report.push({
          dayName: days[i],
          dateStr,
          bedTimeSuccess: slot ? slot.bedTimeSuccess : null,
          wakeUpSuccess: slot ? slot.wakeUpSuccess : null,
        });
      }
      this.weekReport = report;
    },

    async buildCurrentWeekReportFromAPI() {
      const userId = authStore.getUserId();
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
        const userId = authStore.getUserId();
        const username = authStore.getUsername();

        if (!userId || !username) {
          throw new Error("Please log in to view analytics");
        }

        // Load all data in parallel
        const [sleepSlots, competitions] = await Promise.all([
          sleepScheduleAPI.getAllSleepSlots(userId),
          competitionManagerAPI.getCompetitionsForUser(username),
        ]);

        // Build current week report using per-day _getSleepSlot API
        await this.buildCurrentWeekReportFromAPI();

        // Process competition stats
        this.processCompetitionStats(competitions);

        // Process sleep stats
        this.processSleepStats(sleepSlots);

        // Calculate best performing day
        this.calculateBestDay(sleepSlots);

        // Get recent activity
        this.getRecentActivity(sleepSlots, competitions);
      } catch (error) {
        console.error("Error loading analytics:", error);
        this.errorMessage = error.message || "Error loading analytics";
      } finally {
        this.isLoading = false;
      }
    },

    processCompetitionStats(competitions) {
      if (!Array.isArray(competitions) || competitions.length === 0) {
        this.competitionStats = {
          totalCompetitions: 0,
          winRate: 0,
          longestStreak: 0,
          avgScore: 0,
        };
        return;
      }

      this.competitionStats.totalCompetitions = competitions.length;

      // Calculate win rate (ended competitions where user is a winner)
      const endedCompetitions = competitions.filter((c) => !c.active);
      if (endedCompetitions.length > 0) {
        const wins = endedCompetitions.filter(
          (c) =>
            c.winners &&
            Array.isArray(c.winners) &&
            c.winners.includes(authStore.getUsername())
        ).length;
        this.competitionStats.winRate = Math.round(
          (wins / endedCompetitions.length) * 100
        );
      }

      // Placeholder for streak calculation
      this.competitionStats.longestStreak = 0;

      // Placeholder for avg score
      this.competitionStats.avgScore = 0;
    },

    processSleepStats(sleepSlots) {
      if (!Array.isArray(sleepSlots) || sleepSlots.length === 0) {
        this.sleepStats = {
          avgSleepDuration: "N/A",
          successRate: 0,
          bedtimeConsistency: 0,
          wakeupConsistency: 0,
        };
        return;
      }

      // Filter slots with data
      const slotsWithData = sleepSlots.filter(
        (s) =>
          s.bedTime &&
          s.wakeUpTime &&
          s.bedTimeSuccess !== null &&
          s.wakeUpSuccess !== null
      );

      if (slotsWithData.length === 0) {
        this.sleepStats = {
          avgSleepDuration: "N/A",
          successRate: 0,
          bedtimeConsistency: 0,
          wakeupConsistency: 0,
        };
        return;
      }

      // Calculate average sleep duration
      const durations = slotsWithData.map((slot) => {
        const bedtime = this.parseTime(slot.bedTime);
        const wakeup = this.parseTime(slot.wakeUpTime);
        let duration = wakeup - bedtime;
        if (duration < 0) duration += 1440;
        return duration;
      });

      const avgDuration =
        durations.reduce((a, b) => a + b, 0) / durations.length;
      const avgHours = Math.floor(avgDuration / 60);
      const avgMins = Math.round(avgDuration % 60);
      this.sleepStats.avgSleepDuration =
        avgMins > 0 ? `${avgHours}h ${avgMins}m` : `${avgHours}h`;

      // Calculate success rate
      const successes = slotsWithData.filter(
        (s) => s.bedTimeSuccess && s.wakeUpSuccess
      ).length;
      this.sleepStats.successRate = Math.round(
        (successes / slotsWithData.length) * 100
      );

      // Calculate consistency (placeholder - would need to analyze time variance)
      this.sleepStats.bedtimeConsistency = 0;
      this.sleepStats.wakeupConsistency = 0;
    },

    calculateBestDay(sleepSlots) {
      if (!Array.isArray(sleepSlots) || sleepSlots.length === 0) {
        this.bestDay = "N/A";
        return;
      }

      // Group by day of week
      const dayStats = {};
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      sleepSlots.forEach((slot) => {
        if (slot.date && slot.bedTime && slot.wakeUpTime) {
          const date = new Date(slot.date);
          const dayName = days[date.getDay()];

          if (!dayStats[dayName]) {
            dayStats[dayName] = { successes: 0, total: 0, durations: [] };
          }

          if (slot.bedTimeSuccess && slot.wakeUpSuccess) {
            dayStats[dayName].successes++;
          }
          dayStats[dayName].total++;

          // Calculate duration
          const bedtime = this.parseTime(slot.bedTime);
          const wakeup = this.parseTime(slot.wakeUpTime);
          let duration = wakeup - bedtime;
          if (duration < 0) duration += 1440;
          dayStats[dayName].durations.push(duration);
        }
      });

      // Find best day
      let bestSuccessRate = 0;
      let bestDayName = "N/A";

      Object.entries(dayStats).forEach(([day, stats]) => {
        if (stats.total > 0) {
          const successRate = (stats.successes / stats.total) * 100;
          if (successRate > bestSuccessRate) {
            bestSuccessRate = successRate;
            bestDayName = day;
          }
        }
      });

      this.bestDay = bestDayName;

      if (bestDayName !== "N/A") {
        const stats = dayStats[bestDayName];
        this.dayStats.successRate = Math.round(bestSuccessRate);

        if (stats.durations.length > 0) {
          const avgDur =
            stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length;
          const hours = Math.floor(avgDur / 60);
          const mins = Math.round(avgDur % 60);
          this.dayStats.avgDuration =
            mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
      }
    },

    getRecentActivity(sleepSlots, competitions) {
      const activities = [];

      // Add recent competitions
      if (Array.isArray(competitions) && competitions.length > 0) {
        competitions.slice(0, 3).forEach((comp) => {
          activities.push({
            icon: "🏆",
            text: `Competition: ${comp.name}`,
            date: this.formatDate(comp.startDate),
          });
        });
      }

      // Add recent sleep reports
      if (Array.isArray(sleepSlots) && sleepSlots.length > 0) {
        sleepSlots.slice(0, 5).forEach((slot) => {
          if (slot.bedTimeSuccess !== null || slot.wakeUpSuccess !== null) {
            activities.push({
              icon: "😴",
              text: "Sleep report submitted",
              date: slot.date,
            });
          }
        });
      }

      // Sort by date and take most recent
      this.recentActivity = activities.slice(0, 10);
    },

    parseTime(timeStr) {
      if (!timeStr) return 0;
      const parts = timeStr.split(":");
      if (parts.length < 2) return 0;
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      return hours * 60 + minutes;
    },

    formatDate(dateObj) {
      const date = new Date(dateObj);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
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
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.analytics-header {
  text-align: center;
  margin-bottom: 40px;
}

.analytics-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 2.5rem;
}

.analytics-header p {
  color: #6c757d;
  font-size: 1.1rem;
}

.stats-section {
  margin-bottom: 40px;
}

.stats-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.8rem;
  border-bottom: 2px solid #e1e8ed;
  padding-bottom: 10px;
}

/* Week report table */
.week-table {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  overflow: hidden;
}

.week-row {
  display: grid;
  grid-template-columns: 160px 150px 1fr 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f5;
}

.week-header {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.week-col.day {
  color: #2c3e50;
}

.week-col.date {
  color: #6c757d;
}

.week-col.status {
  font-weight: 600;
}

.week-col.status.success {
  color: #2f855a;
}

.week-col.status.failure {
  color: #c53030;
}

.week-col.status.pending {
  color: #718096;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  color: #6c757d;
  font-size: 0.95rem;
  font-weight: 500;
}

.day-analysis {
  max-width: 600px;
  margin: 0 auto;
}

.best-day-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: #f8f9fa;
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
  background: white;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: box-shadow 0.3s ease;
}

.activity-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activity-icon {
  font-size: 1.5rem;
}

.activity-text {
  flex: 1;
  color: #2c3e50;
  font-weight: 500;
}

.activity-date {
  color: #6c757d;
  font-size: 0.9rem;
}

.no-activity {
  text-align: center;
  color: #6c757d;
  padding: 30px;
}

.loading-state {
  text-align: center;
  padding: 60px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
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

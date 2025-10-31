<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          {{
            authStore.isLoggedIn()
              ? `Welcome back, ${authStore.getUsername()}!`
              : "Welcome to Shut Eye Showdown"
          }}
        </h1>
        <p class="hero-subtitle">
          {{
            authStore.isLoggedIn()
              ? "Ready to track your sleep and compete with friends?"
              : "The ultimate sleep tracking and competition platform"
          }}
        </p>
        <div class="hero-buttons">
          <router-link
            v-if="authStore.isLoggedIn()"
            to="/sleep-report"
            class="btn btn-primary"
            >Report Sleep Activity</router-link
          >
          <router-link v-else to="/login" class="btn btn-primary"
            >Report Sleep Activity</router-link
          >
        </div>
      </div>
    </section>

    <section v-if="authStore.isLoggedIn()" class="today-section">
      <div class="container today-card">
        <h2 class="section-title-small">Today's Schedule</h2>
        <div class="today-grid">
          <div class="today-item">
            <div class="today-label">Bedtime</div>
            <div class="today-value">{{ todayBedtime || "Not set" }}</div>
          </div>
          <div class="today-item">
            <div class="today-label">Wake-up</div>
            <div class="today-value">{{ todayWakeup || "Not set" }}</div>
          </div>
          <div class="today-actions">
            <router-link to="/sleep-schedule" class="btn btn-primary"
              >Edit Schedule</router-link
            >
          </div>
        </div>
        <div v-if="todayError" class="today-error">{{ todayError }}</div>
      </div>
    </section>
  </div>
</template>

<script>
import authStore from "../stores/authStore";
import { sleepScheduleAPI } from "../services/api";

export default {
  name: "Home",
  data() {
    return {
      authStore,
      todayBedtime: "",
      todayWakeup: "",
      todayError: "",
    };
  },
  async mounted() {
    if (authStore.isLoggedIn()) {
      await this.loadTodaySlot();
    }
  },
  methods: {
    formatTimeForDisplay(timeStr) {
      if (!timeStr) return "";
      let hours24 = null;
      let minutes = null;

      if (typeof timeStr === "string" && timeStr.includes("T")) {
        // ISO string from backend (UTC). Convert to local time.
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
          hours24 = d.getHours();
          minutes = d.getMinutes();
        }
      }

      if (hours24 === null || minutes === null) {
        // Fallback: assume HH:MM string
        const t = timeStr.includes("T") ? timeStr.split("T")[1] : timeStr;
        const hhmm = t.substring(0, 5);
        const parts = hhmm.split(":");
        if (parts.length >= 2) {
          hours24 = parseInt(parts[0], 10);
          minutes = parseInt(parts[1], 10);
        }
      }

      if (
        hours24 === null ||
        minutes === null ||
        isNaN(hours24) ||
        isNaN(minutes)
      ) {
        return "";
      }

      const period = hours24 >= 12 ? "PM" : "AM";
      let hours12 = hours24 % 12;
      if (hours12 === 0) hours12 = 12;
      const minutesStr = String(minutes).padStart(2, "0");
      return `${hours12}:${minutesStr} ${period}`;
    },
    async loadTodaySlot() {
      try {
        this.todayError = "";
        const userId = authStore.getUserId();
        if (!userId) return;
        const today = new Date();
        const dateStr = today.toLocaleDateString("en-CA");
        const resp = await sleepScheduleAPI.getSleepSlot(userId, dateStr);
        let slot = null;
        if (Array.isArray(resp)) {
          slot = resp.length > 0 ? resp[0] : null;
        } else if (resp && typeof resp === "object" && !resp.error) {
          slot = resp;
        }
        if (slot && slot.bedTime && slot.wakeUpTime) {
          this.todayBedtime = this.formatTimeForDisplay(slot.bedTime);
          this.todayWakeup = this.formatTimeForDisplay(slot.wakeUpTime);
        } else {
          this.todayBedtime = "";
          this.todayWakeup = "";
        }
      } catch (e) {
        console.warn("Home: failed to load today's schedule", e);
        this.todayError = "Failed to load today's schedule.";
      }
    },
  },
};
</script>

<style scoped>
.home {
  min-height: calc(100vh - 200px);
}

.hero {
  background: #fafbfc;
  color: #1a202c;
  padding: 3rem 2rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.hero-content {
  max-width: 480px;
  margin: 0 auto;
}

.hero-title {
  font-size: 2.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  line-height: 1.3;
  color: #2d3748;
}

.hero-subtitle {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  color: #718096;
  font-weight: 400;
}

.hero-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-direction: column;
  align-items: stretch;
}

.btn {
  width: 100%;
  text-align: center;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
}

.btn-primary:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: transparent;
  color: #667eea;
  border: 1.5px solid #667eea;
}

.btn-secondary:hover {
  background-color: #f7fafc;
  border-color: #764ba2;
}

.today-section {
  padding: 3rem 2rem;
  background: #ffffff;
}

.today-card {
  max-width: 560px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title-small {
  font-size: 1.35rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #2d3748;
}

.today-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  align-items: stretch;
}

.today-item {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
}

.today-label {
  font-size: 0.8rem;
  color: #718096;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.today-value {
  font-size: 1.4rem;
  font-weight: 600;
  color: #2d3748;
}

.today-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
}

.today-error {
  color: #c53030;
  font-size: 0.875rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .hero {
    padding: 2rem 1.5rem;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
    text-align: center;
  }

  .today-section {
    padding: 2rem 1.5rem;
  }

  .today-card {
    padding: 1.5rem;
  }

  .today-grid {
    grid-template-columns: 1fr;
  }

  .today-actions {
    flex-direction: column;
    width: 100%;
  }

  .today-actions .btn {
    width: 100%;
  }
}
</style>

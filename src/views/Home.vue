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
  background: transparent;
  color: #f8f9fc;
  padding: 3rem 2rem;
  text-align: center;
}

.hero-content {
  max-width: 480px;
  margin: 0 auto;
}

.hero-title {
  font-size: 2.2rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  line-height: 1.3;
  color: #f8f9fc;
  text-shadow: 0 2px 8px rgba(13, 27, 42, 0.3);
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.hero-subtitle {
  font-size: 1rem;
  margin-bottom: 2rem;
  color: #e0e7ff;
  font-weight: 400;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
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
  background: linear-gradient(90deg, #5b5fe9, #a78bfa);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(91, 95, 233, 0.3);
  border-radius: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background: linear-gradient(90deg, #a78bfa, #5b5fe9);
  box-shadow: 0 4px 16px rgba(167, 139, 250, 0.5),
    0 0 10px rgba(167, 139, 250, 0.4);
  transform: translateY(-2px) scale(1.02);
  transition: all 0.4s ease;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #0d1b2a;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
}

.btn-secondary:hover {
  background-color: #9bb8ff;
  border-color: #9bb8ff;
  color: #0d1b2a;
  box-shadow: 0 0 10px rgba(155, 184, 255, 0.4);
  transition: all 0.4s ease;
}

.today-section {
  padding: 3rem 2rem;
  background: transparent;
}

.today-card {
  max-width: 560px;
  margin: 0 auto;
  background: rgba(30, 42, 71, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: all 0.4s ease;
  color: #e6eaf8;
}

.today-card:hover {
  background: rgba(45, 59, 104, 0.9);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  border-color: rgba(255, 255, 255, 0.12);
}

.section-title-small {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  color: #f8f9fc;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.today-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  align-items: stretch;
}

.today-item {
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.4s ease;
}

.today-item:hover {
  background: rgba(45, 59, 104, 0.75);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.12);
}

.today-label {
  font-size: 0.8rem;
  color: #a78bfa;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.today-value {
  font-size: 1.4rem;
  font-weight: 500;
  color: #e6eaf8;
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

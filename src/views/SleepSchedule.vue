<template>
  <div class="sleep-schedule-container">
    <div class="sleep-schedule-card">
      <div class="schedule-header">
        <h2>Sleep Schedule</h2>
        <p>Set your bedtime and wake-up times for each day of the week</p>
        <div class="week-info">
          <p><strong>Current Week:</strong> {{ getCurrentWeekRange() }}</p>
        </div>
        <div class="schedule-info">
          <p>
            <strong>Note:</strong> PM bedtime is for the current day, AM bedtime
            is for the next day. Wake-up time will automatically be set for the
            next day if it's earlier than bedtime (e.g., 11 PM bedtime, 7 AM
            wake-up = Monday night to Tuesday morning).
          </p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="schedule-form">
        <div class="days-grid">
          <div v-for="(day, index) in daysOfWeek" :key="day" class="day-row">
            <div class="day-label">
              <span class="day-name">{{ day }}</span>
            </div>

            <div class="time-inputs">
              <div class="time-input-group">
                <label :for="`bedtime-${index}`" class="time-label"
                  >Bedtime</label
                >
                <input
                  :id="`bedtime-${index}`"
                  v-model="schedule[day].bedtime"
                  type="time"
                  class="time-input"
                  :class="{ error: errors[`${day}.bedtime`] }"
                />
                <span v-if="errors[`${day}.bedtime`]" class="error-message">
                  {{ errors[`${day}.bedtime`] }}
                </span>
              </div>

              <div class="time-input-group">
                <label :for="`wakeup-${index}`" class="time-label"
                  >Wake Up</label
                >
                <input
                  :id="`wakeup-${index}`"
                  v-model="schedule[day].wakeup"
                  type="time"
                  class="time-input"
                  :class="{ error: errors[`${day}.wakeup`] }"
                />
                <span v-if="errors[`${day}.wakeup`]" class="error-message">
                  {{ errors[`${day}.wakeup`] }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="success-banner">
          {{ successMessage }}
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary btn-large"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading-spinner"></span>
            {{ isLoading ? "Saving..." : "Save Schedule" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { sleepScheduleAPI } from "../services/api";
import authStore from "../stores/authStore";

export default {
  name: "SleepSchedule",
  data() {
    return {
      daysOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      schedule: {
        Monday: { bedtime: "", wakeup: "" },
        Tuesday: { bedtime: "", wakeup: "" },
        Wednesday: { bedtime: "", wakeup: "" },
        Thursday: { bedtime: "", wakeup: "" },
        Friday: { bedtime: "", wakeup: "" },
        Saturday: { bedtime: "", wakeup: "" },
        Sunday: { bedtime: "", wakeup: "" },
      },
      errors: {},
      isLoading: false,
      errorMessage: "",
      successMessage: "",
    };
  },
  async mounted() {
    await this.loadExistingSchedule();
  },
  methods: {
    async loadExistingSchedule() {
      try {
        const userId = authStore.getUserId();
        if (!userId) {
          this.errorMessage = "Please log in to view your sleep schedule";
          return;
        }

        // Calculate the current week (Monday to Sunday) based on today's date
        const today = new Date();
        const startOfWeek = this.getStartOfWeek(today);

        // Load schedule for the current week
        for (let i = 0; i < 7; i++) {
          // Calculate the actual date for this day of the week
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          const dateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD format

          try {
            const sleepSlot = await sleepScheduleAPI.getSleepSlot(
              userId,
              dateStr
            );
            if (sleepSlot && sleepSlot.length > 0) {
              const slot = sleepSlot[0];
              this.schedule[this.daysOfWeek[i]].bedtime =
                this.formatTimeForInput(slot.bedTime);
              this.schedule[this.daysOfWeek[i]].wakeup =
                this.formatTimeForInput(slot.wakeUpTime);
            }
          } catch (error) {
            // No existing schedule for this day, that's fine
            console.log(`No schedule found for ${dateStr}`);
          }
        }
      } catch (error) {
        console.error("Error loading schedule:", error);
      }
    },

    formatTimeForInput(timeStr) {
      if (!timeStr) return "";
      // Convert from "HH:MM" format to "HH:MM" for time input
      return timeStr.substring(0, 5);
    },

    validateSchedule() {
      this.errors = {};
      let isValid = true;

      this.daysOfWeek.forEach((day) => {
        const bedtime = this.schedule[day].bedtime;
        const wakeup = this.schedule[day].wakeup;

        if (bedtime && wakeup) {
          // For sleep schedules, we allow bedtime to be later than wake-up time
          // because wake-up could be the next day (e.g., 11 PM bedtime, 7 AM wake-up)
          // We just need to ensure both times are provided
          const bedtimeMinutes = this.timeToMinutes(bedtime);
          const wakeupMinutes = this.timeToMinutes(wakeup);

          // Basic validation: ensure times are reasonable
          if (
            bedtimeMinutes < 0 ||
            bedtimeMinutes >= 1440 ||
            wakeupMinutes < 0 ||
            wakeupMinutes >= 1440
          ) {
            this.errors[`${day}.bedtime`] = "Please enter valid times";
            isValid = false;
          }
        } else if (bedtime || wakeup) {
          // If only one time is provided, show error
          this.errors[`${day}.bedtime`] =
            "Both bedtime and wake-up time are required";
          isValid = false;
        }
      });

      return isValid;
    },

    timeToMinutes(timeStr) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    },

    async handleSubmit() {
      this.clearMessages();

      if (!this.validateSchedule()) {
        return;
      }

      this.isLoading = true;

      try {
        const userId = authStore.getUserId();
        if (!userId) {
          throw new Error("Please log in to save your sleep schedule");
        }

        const today = new Date();
        const startOfWeek = this.getStartOfWeek(today);

        // Save schedule for each day of the week
        for (let i = 0; i < 7; i++) {
          const day = this.daysOfWeek[i];
          const bedtime = this.schedule[day].bedtime;
          const wakeup = this.schedule[day].wakeup;

          if (bedtime && wakeup) {
            // Calculate the actual date for this day of the week
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD format

            // Bedtime logic:
            // PM bedtime → current day (e.g., 11 PM Monday)
            // AM bedtime → next day (e.g., 1 AM Tuesday)
            const bedtimeHours = parseInt(bedtime.split(":")[0]);
            let bedDateStr = dateStr;
            if (bedtimeHours < 12) {
              // AM bedtime is next day
              const bedDate = new Date(date);
              bedDate.setDate(date.getDate() + 1);
              bedDateStr = bedDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format in local time
            }
            const bedTimeStr = `${bedDateStr}T${bedtime}`;

            // Wake-up time logic:
            // If wake-up time > bedtime time → same day
            // If wake-up time < bedtime time → next day
            const bedtimeMinutes = this.timeToMinutes(bedtime);
            const wakeupMinutes = this.timeToMinutes(wakeup);

            let wakeDateStr = bedDateStr;
            if (wakeupMinutes < bedtimeMinutes) {
              // Wake-up is next day after bedtime
              const wakeDate = new Date(bedDateStr);
              wakeDate.setDate(new Date(bedDateStr).getDate() + 1);
              wakeDateStr = wakeDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format in local time
            }

            const wakeTimeStr = `${wakeDateStr}T${wakeup}`;

            try {
              // Remove existing slot if it exists
              await sleepScheduleAPI.removeSleepSlot(userId, dateStr);
            } catch (error) {
              // Ignore errors when removing (slot might not exist)
            }

            // Add new slot
            await sleepScheduleAPI.addSleepSlot(
              userId,
              bedTimeStr,
              wakeTimeStr,
              dateStr
            );
          }
        }

        this.successMessage = "Sleep schedule saved successfully!";

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = "";
        }, 3000);
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    clearMessages() {
      this.errorMessage = "";
      this.successMessage = "";
      this.errors = {};
    },

    getCurrentWeekRange() {
      const today = new Date();
      const startOfWeek = this.getStartOfWeek(today);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

      const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      };

      return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    },

    getStartOfWeek(date) {
      // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayOfWeek = date.getDay();

      // Calculate days to subtract to get to Monday
      // If it's Sunday (0), we need to go back 6 days to get to Monday
      // If it's Monday (1), we need to go back 0 days
      // If it's Tuesday (2), we need to go back 1 day
      // etc.
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - daysToSubtract);

      return startOfWeek;
    },
  },
};
</script>

<style scoped>
.sleep-schedule-container {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.sleep-schedule-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 800px;
}

.schedule-header {
  text-align: center;
  margin-bottom: 2rem;
}

.schedule-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.schedule-header p {
  color: #666;
  font-size: 0.95rem;
}

.week-info {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 1rem;
}

.week-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #1976d2;
  line-height: 1.4;
}

.schedule-info {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.schedule-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.4;
}

.schedule-form {
  margin-bottom: 1.5rem;
}

.days-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.day-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.day-label {
  display: flex;
  align-items: center;
}

.day-name {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.time-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.time-input-group {
  display: flex;
  flex-direction: column;
}

.time-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 0.25rem;
}

.time-input {
  padding: 0.5rem;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background-color: white;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.time-input.error {
  border-color: #e74c3c;
  background-color: #fdf2f2;
}

.error-message {
  display: block;
  color: #e74c3c;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.error-banner {
  background-color: #fdf2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1rem;
}

.success-banner {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1rem;
}

.form-actions {
  text-align: center;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .sleep-schedule-container {
    padding: 1rem;
  }

  .sleep-schedule-card {
    padding: 1.5rem;
  }

  .day-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .time-inputs {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .day-name {
    font-size: 0.9rem;
  }
}
</style>

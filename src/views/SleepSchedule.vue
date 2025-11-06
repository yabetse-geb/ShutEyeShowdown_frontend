<template>
  <div class="sleep-schedule-container">
    <div class="sleep-schedule-card">
      <div class="schedule-header">
        <h2>Sleep Schedule</h2>
        <p>Set your bedtime and wake-up times for each day of the week</p>
        <div class="week-info">
          <p><strong>Current Week:</strong> {{ getCurrentWeekRange() }}</p>
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

              <div class="time-input-group">
                <label :for="`tolerance-${index}`" class="time-label"
                  >Tolerance</label
                >
                <select
                  :id="`tolerance-${index}`"
                  v-model="schedule[day].tolerance"
                  class="time-input tolerance-input"
                >
                  <option value="5">5 min (Strict)</option>
                  <option value="10">10 min (Recommended)</option>
                  <option value="30">30 min (Flexible)</option>
                </select>
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
import { sleepScheduleAPI, sessioningAPI } from "../services/api";
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
        Monday: { bedtime: "", wakeup: "", tolerance: "10" },
        Tuesday: { bedtime: "", wakeup: "", tolerance: "10" },
        Wednesday: { bedtime: "", wakeup: "", tolerance: "10" },
        Thursday: { bedtime: "", wakeup: "", tolerance: "10" },
        Friday: { bedtime: "", wakeup: "", tolerance: "10" },
        Saturday: { bedtime: "", wakeup: "", tolerance: "10" },
        Sunday: { bedtime: "", wakeup: "", tolerance: "10" },
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
        // OLD WAY (for reversion): const userId = authStore.getUserId();
        // NEW WAY: Get user ID from session using _getUser
        const session = authStore.getSession();
        if (!session) {
          this.errorMessage = "Please log in to view your sleep schedule";
          return;
        }
        const userId = await sessioningAPI.getUser(session);
        if (!userId) {
          this.errorMessage =
            "Failed to load user information. Please log in again.";
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
      // Handle both ISO date strings and time strings
      // If it's an ISO date string, extract just the time part
      if (timeStr.includes("T")) {
        const timePart = timeStr.split("T")[1];
        return timePart.substring(0, 5); // Extract HH:MM
      }
      // If it's already just a time string, return it
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
        // OLD WAY (for reversion): const userId = authStore.getUserId();
        // NEW WAY: Get user ID from session using _getUser
        const session = authStore.getSession();
        if (!session) {
          throw new Error("Please log in to save your sleep schedule");
        }
        const userId = await sessioningAPI.getUser(session);
        if (!userId) {
          throw new Error(
            "Failed to load user information. Please log in again."
          );
        }

        const today = new Date();
        const startOfWeek = this.getStartOfWeek(today);

        // Save schedule for each day of the week
        for (let i = 0; i < 7; i++) {
          const day = this.daysOfWeek[i];
          const bedtime = this.schedule[day].bedtime;
          const wakeup = this.schedule[day].wakeup;

          console.log(`${day}: bedtime="${bedtime}", wakeup="${wakeup}"`);

          if (bedtime && wakeup) {
            console.log(`Processing ${day}...`);
            // Calculate the actual date for this day of the week
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            // Set time to midnight for consistent date handling
            date.setHours(0, 0, 0, 0);
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
              bedDate.setHours(0, 0, 0, 0);
              bedDateStr = bedDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format in local time
            }
            const bedTimeStr = `${bedDateStr}T${bedtime}`;

            // Wake-up time logic:
            // Always calculate relative to bedtime date
            // If wake-up time < bedtime time → next day after bedtime date
            // Otherwise → same day as bedtime date
            const bedtimeMinutes = this.timeToMinutes(bedtime);
            const wakeupMinutes = this.timeToMinutes(wakeup);

            // Start with the bedtime date
            let wakeDateStr = bedDateStr;

            if (wakeupMinutes < bedtimeMinutes) {
              // Wake-up is next day after bedtime date
              // Parse bedDateStr as local date
              const bedDateParts = bedDateStr.split("-");
              const bedDate = new Date(
                parseInt(bedDateParts[0]),
                parseInt(bedDateParts[1]) - 1,
                parseInt(bedDateParts[2])
              );
              bedDate.setDate(bedDate.getDate() + 1);
              wakeDateStr = bedDate.toLocaleDateString("en-CA"); // YYYY-MM-DD format
            }

            const wakeTimeStr = `${wakeDateStr}T${wakeup}`;

            // Add new slot - extract tolerance from schedule
            const toleranceMins = parseInt(this.schedule[day].tolerance) || 10;

            console.log(`Saving schedule for ${day}:`);
            console.log(`  Bedtime: ${bedTimeStr}`);
            console.log(`  Wake up: ${wakeTimeStr}`);
            console.log(`  Date: ${dateStr}`);
            console.log(`  Tolerance: ${toleranceMins} minutes`);

            // Backend addSleepSlot expects dateStr in YYYY-MM-DD format
            // parseDateString will normalize it to start of day in local time
            console.log(`  dateStr for addSleepSlot: ${dateStr}`);

            try {
              // Remove existing slot if it exists using the same format
              await sleepScheduleAPI.removeSleepSlot(userId, dateStr);
            } catch (error) {
              // Ignore errors when removing (slot might not exist)
            }

            try {
              const result = await sleepScheduleAPI.addSleepSlot(
                userId,
                bedTimeStr,
                wakeTimeStr,
                dateStr,
                toleranceMins
              );
              console.log(`  Successfully added sleep slot for ${day}`);
            } catch (slotError) {
              console.error(`  Error adding sleep slot for ${day}:`, slotError);
              // Continue processing other days even if one fails
              this.errorMessage = `Failed to save schedule for ${day}. Please try again.`;
            }
          }
        }

        this.successMessage = "Sleep schedule saved successfully!";

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = "";
        }, 3000);
      } catch (error) {
        console.error("Error saving sleep schedule:", error);
        // Check if it's a session error
        if (
          error.message &&
          (error.message.includes("session") ||
            error.message.includes("log in"))
        ) {
          this.errorMessage = "Your session has expired. Please log in again.";
        } else {
          this.errorMessage =
            error.message || "Failed to save sleep schedule. Please try again.";
        }
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
      // Set time to midnight to ensure consistent date comparison
      startOfWeek.setHours(0, 0, 0, 0);

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
  background: transparent;
}

.sleep-schedule-card {
  background: rgba(30, 42, 71, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  padding: 2.5rem;
  width: 100%;
  max-width: 800px;
  color: #e6eaf8;
}

.schedule-header {
  text-align: center;
  margin-bottom: 2rem;
}

.schedule-header h2 {
  font-size: 1.8rem;
  font-weight: 500;
  color: #e6eaf8;
  margin-bottom: 0.5rem;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.schedule-header p {
  color: rgba(230, 234, 248, 0.8);
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.week-info {
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 1rem;
}

.week-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #9bb8ff;
  line-height: 1.4;
}

.schedule-info {
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.schedule-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #e6eaf8;
  line-height: 1.4;
}

.schedule-info p + p {
  margin-top: 0.5rem;
}

.tolerance-note {
  font-size: 0.85rem !important;
  color: rgba(230, 234, 248, 0.7) !important;
  font-style: italic;
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
  grid-template-columns: 100px 1fr;
  gap: 1rem;
  align-items: start;
  padding: 1rem;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.day-row:hover {
  background: rgba(45, 59, 104, 0.7);
  border-color: rgba(255, 255, 255, 0.12);
}

.day-label {
  display: flex;
  align-items: center;
}

.day-name {
  font-weight: 600;
  color: #e6eaf8;
  font-size: 1rem;
}

.time-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.tolerance-input {
  min-width: 150px;
}

select.time-input {
  cursor: pointer;
}

select.time-input option {
  background: #1e2a47;
  color: #e6eaf8;
}

.time-input-group {
  display: flex;
  flex-direction: column;
}

.time-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(230, 234, 248, 0.8);
  margin-bottom: 0.25rem;
}

.time-input {
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.4s ease;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e6eaf8;
}

.time-input::placeholder {
  color: rgba(230, 234, 248, 0.5);
}

.time-input:hover {
  border-color: rgba(167, 139, 250, 0.3);
  background: rgba(30, 42, 71, 0.7);
}

.time-input:focus {
  outline: none;
  border-color: rgba(167, 139, 250, 0.5);
  background: rgba(30, 42, 71, 0.8);
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.15),
    0 0 8px rgba(167, 139, 250, 0.3);
}

.time-input.error {
  border-color: #e74c3c;
  background: rgba(253, 242, 242, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
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
  background: linear-gradient(90deg, #5b5fe9, #a78bfa);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(90deg, #a78bfa, #5b5fe9);
  box-shadow: 0 4px 16px rgba(167, 139, 250, 0.5),
    0 0 10px rgba(167, 139, 250, 0.4);
  transform: translateY(-2px) scale(1.02);
  transition: all 0.4s ease;
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

  .tolerance-input {
    min-width: 100%;
  }

  .day-name {
    font-size: 0.9rem;
  }
}
</style>

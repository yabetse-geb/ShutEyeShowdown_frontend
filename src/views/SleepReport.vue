<template>
  <div class="sleep-report-container">
    <div class="sleep-report-card">
      <div class="report-header">
        <h2>Report Sleep Event</h2>
        <p>Record when you went to bed or woke up</p>
      </div>

      <form @submit.prevent="handleSubmit" class="report-form">
        <div class="form-group">
          <label for="event-type" class="form-label">Event Type</label>
          <select
            id="event-type"
            v-model="formData.eventType"
            class="form-select"
            :class="{ error: errors.eventType }"
            required
          >
            <option value="">Select event type</option>
            <option value="sleeping">Going to Sleep</option>
            <option value="waking">Waking Up</option>
          </select>
          <span v-if="errors.eventType" class="error-message">
            {{ errors.eventType }}
          </span>
        </div>

        <div class="form-group">
          <label for="nightDate" class="form-label">Night Being Reported</label>
          <p class="form-help-text">
            Select the night (date) you went to bed for this sleep report
          </p>
          <input
            id="nightDate"
            v-model="formData.nightDate"
            type="date"
            class="form-input"
            :class="{ error: errors.nightDate }"
            required
          />
          <span v-if="errors.nightDate" class="error-message">
            {{ errors.nightDate }}
          </span>
        </div>

        <div class="form-group">
          <label for="actualDate" class="form-label"
            >Actual Sleep Event Date</label
          >
          <p class="form-help-text">
            Enter the actual date when you went to sleep or woke up
          </p>
          <input
            id="actualDate"
            v-model="formData.actualDate"
            type="date"
            class="form-input"
            :class="{ error: errors.actualDate }"
            required
          />
          <span v-if="errors.actualDate" class="error-message">
            {{ errors.actualDate }}
          </span>
        </div>

        <div class="form-group">
          <label for="actualTime" class="form-label"
            >Actual Sleep Event Time</label
          >
          <p class="form-help-text">
            Enter the specific time when you went to sleep or woke up
          </p>
          <input
            id="actualTime"
            v-model="formData.actualTime"
            type="time"
            class="form-input"
            :class="{ error: errors.actualTime }"
            required
          />
          <span v-if="errors.actualTime" class="error-message">
            {{ errors.actualTime }}
          </span>
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
            {{ isLoading ? "Reporting..." : "Report Event" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import {
  sleepScheduleAPI,
  competitionManagerAPI,
  accountabilityAPI,
} from "../services/api";
import authStore from "../stores/authStore";

export default {
  name: "SleepReport",
  data() {
    return {
      formData: {
        eventType: "",
        nightDate: "",
        actualDate: "",
        actualTime: "",
      },
      errors: {},
      isLoading: false,
      errorMessage: "",
      successMessage: "",
    };
  },
  mounted() {
    // Set default night date to today
    this.formData.nightDate = new Date().toLocaleDateString("en-CA");
    // Set default actual date to today
    this.formData.actualDate = new Date().toLocaleDateString("en-CA");
  },
  methods: {
    validateForm() {
      this.errors = {};
      let isValid = true;

      if (!this.formData.eventType) {
        this.errors.eventType = "Please select an event type";
        isValid = false;
      }

      if (!this.formData.nightDate) {
        this.errors.nightDate = "Please select the night being reported";
        isValid = false;
      }

      if (!this.formData.actualDate) {
        this.errors.actualDate = "Please enter the actual sleep event date";
        isValid = false;
      }

      if (!this.formData.actualTime) {
        this.errors.actualTime = "Please enter the actual sleep event time";
        isValid = false;
      }

      return isValid;
    },

    async handleSubmit() {
      this.clearMessages();

      if (!this.validateForm()) {
        return;
      }

      this.isLoading = true;

      try {
        const userId = authStore.getUserId();
        const username = authStore.getUsername();
        if (!userId || !username) {
          throw new Error("Please log in to report sleep events");
        }

        // Use the selected night date for dateStr and actual date/time for reportedTimeStr
        const dateStr = this.formData.nightDate + "T00:00:00"; // Convert YYYY-MM-DD to local ISO format for backend
        const reportedTimeStr = `${this.formData.actualDate}T${this.formData.actualTime}`; // Actual sleep event time in YYYY-MM-DDTHH:MM format

        let result;
        let eventType;
        let success;

        if (this.formData.eventType === "sleeping") {
          result = await sleepScheduleAPI.reportBedTime(
            userId,
            reportedTimeStr,
            dateStr
          );
          eventType = "BEDTIME";
          success = result.bedTimeSuccess;
        } else {
          result = await sleepScheduleAPI.reportWakeUpTime(
            userId,
            reportedTimeStr,
            dateStr
          );
          eventType = "WAKETIME";
          success = result.wakeUpSuccess;
        }

        // Call recordStat to update competition scores
        try {
          await competitionManagerAPI.recordStat(
            username,
            dateStr,
            eventType,
            success
          );
          console.log(
            `Competition score updated: ${eventType} ${
              success ? "success" : "failure"
            } for ${username} on ${dateStr}`
          );
        } catch (competitionError) {
          // Don't fail the entire operation if competition update fails
          console.warn(
            "Failed to update competition score:",
            competitionError.message
          );
        }

        // Call recordFailure for Accountability system if this was a failure
        if (!success) {
          try {
            await accountabilityAPI.recordFailure(username, dateStr, eventType);
            console.log(
              `Accountability failure recorded: ${eventType} failure for ${username} on ${dateStr}`
            );
          } catch (accountabilityError) {
            // Don't fail the entire operation if accountability update fails
            console.warn(
              "Failed to record accountability failure:",
              accountabilityError.message
            );
          }
        }

        // Show success message with result
        const eventName =
          this.formData.eventType === "sleeping" ? "bedtime" : "wake-up";
        const successKey =
          this.formData.eventType === "sleeping"
            ? "bedTimeSuccess"
            : "wakeUpSuccess";
        const successStatus = result[successKey]
          ? "successfully"
          : "but missed your target";

        this.successMessage = `Your ${eventName} was recorded ${successStatus}!`;

        // Clear success message after 5 seconds
        setTimeout(() => {
          this.successMessage = "";
        }, 5000);

        // Reset form
        this.formData.eventType = "";
        this.formData.actualTime = "";
        // Keep the dates for convenience
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
  },
};
</script>

<style scoped>
.sleep-report-container {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.sleep-report-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;
}

.report-header {
  text-align: center;
  margin-bottom: 2rem;
}

.report-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.report-header p {
  color: #666;
  font-size: 0.95rem;
}

.report-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-help-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: white;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error,
.form-select.error {
  border-color: #e74c3c;
  background-color: #fdf2f2;
}

.error-message {
  display: block;
  color: #e74c3c;
  font-size: 0.8rem;
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
  .sleep-report-container {
    padding: 1rem;
  }

  .sleep-report-card {
    padding: 1.5rem;
  }
}
</style>

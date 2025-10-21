<template>
  <div class="competition-create-container">
    <div class="competition-create-card">
      <div class="create-header">
        <h2>Create New Competition</h2>
        <p>Start a sleep competition with your friends</p>
      </div>

      <form @submit.prevent="handleSubmit" class="create-form">
        <div class="form-group">
          <label for="competition-name" class="form-label"
            >Competition Name</label
          >
          <input
            id="competition-name"
            v-model="formData.name"
            type="text"
            class="form-input"
            :class="{ error: errors.name }"
            placeholder="Enter competition name"
            required
          />
          <span v-if="errors.name" class="error-message">
            {{ errors.name }}
          </span>
        </div>

        <div class="date-group">
          <div class="form-group">
            <label for="start-date" class="form-label">Start Date</label>
            <input
              id="start-date"
              v-model="formData.startDate"
              type="date"
              class="form-input"
              :class="{ error: errors.startDate }"
              required
            />
            <span v-if="errors.startDate" class="error-message">
              {{ errors.startDate }}
            </span>
          </div>

          <div class="form-group">
            <label for="end-date" class="form-label">End Date</label>
            <input
              id="end-date"
              v-model="formData.endDate"
              type="date"
              class="form-input"
              :class="{ error: errors.endDate }"
              required
            />
            <span v-if="errors.endDate" class="error-message">
              {{ errors.endDate }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label for="participant-username" class="form-label"
            >Add Participant</label
          >
          <div class="participant-input-group">
            <input
              id="participant-username"
              v-model="newParticipant"
              type="text"
              class="form-input"
              :class="{ error: errors.participant }"
              placeholder="Enter username"
              @keyup.enter="addParticipant"
            />
            <button
              type="button"
              @click="addParticipant"
              class="btn btn-secondary btn-add"
              :disabled="!newParticipant.trim()"
            >
              Add
            </button>
          </div>
          <span v-if="errors.participant" class="error-message">
            {{ errors.participant }}
          </span>
        </div>

        <div v-if="participants.length > 0" class="participants-list">
          <h3>Added Participants</h3>
          <div class="participants-grid">
            <div
              v-for="(participant, index) in participants"
              :key="participant"
              class="participant-item"
            >
              <span class="participant-name">{{ participant }}</span>
              <button
                type="button"
                @click="removeParticipant(index)"
                class="btn-remove"
                title="Remove participant"
              >
                ×
              </button>
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
            type="button"
            @click="cancelForm"
            class="btn btn-secondary btn-large"
            :disabled="isLoading"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary btn-large"
            :disabled="isLoading || participants.length < 1"
          >
            <span v-if="isLoading" class="loading-spinner"></span>
            {{ isLoading ? "Creating..." : "Create Competition" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { competitionManagerAPI } from "../services/api";
import authStore from "../stores/authStore";

export default {
  name: "CompetitionCreate",
  data() {
    return {
      formData: {
        name: "",
        startDate: "",
        endDate: "",
      },
      newParticipant: "",
      participants: [],
      errors: {},
      isLoading: false,
      errorMessage: "",
      successMessage: "",
    };
  },
  mounted() {
    // Set default dates
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    this.formData.startDate = today.toLocaleDateString("en-CA");
    this.formData.endDate = nextWeek.toLocaleDateString("en-CA");
  },
  methods: {
    addParticipant() {
      const username = this.newParticipant.trim();

      if (!username) {
        this.errors.participant = "Please enter a username";
        return;
      }

      if (this.participants.includes(username)) {
        this.errors.participant = "This participant is already added";
        return;
      }

      // Add current user automatically if not already added
      const currentUser = authStore.getUsername();
      if (username === currentUser) {
        this.errors.participant =
          "You are automatically included in the competition";
        return;
      }

      this.participants.push(username);
      this.newParticipant = "";
      this.errors.participant = "";
    },

    removeParticipant(index) {
      this.participants.splice(index, 1);
    },

    validateForm() {
      this.errors = {};
      let isValid = true;

      if (!this.formData.name.trim()) {
        this.errors.name = "Please enter a competition name";
        isValid = false;
      }

      if (!this.formData.startDate) {
        this.errors.startDate = "Please select a start date";
        isValid = false;
      }

      if (!this.formData.endDate) {
        this.errors.endDate = "Please select an end date";
        isValid = false;
      }

      if (this.formData.startDate && this.formData.endDate) {
        const startDate = new Date(this.formData.startDate);
        const endDate = new Date(this.formData.endDate);

        if (startDate >= endDate) {
          this.errors.endDate = "End date must be after start date";
          isValid = false;
        }
      }

      if (this.participants.length < 1) {
        this.errors.participant = "Please add at least one participant";
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
        const currentUser = authStore.getUserId();
        if (!currentUser) {
          throw new Error("Please log in to create competitions");
        }

        // Add current user to participants if not already included
        const allParticipants = [...this.participants];
        const currentUsername = authStore.getUsername();
        if (!allParticipants.includes(currentUsername)) {
          allParticipants.push(currentUsername);
        }

        const result = await competitionManagerAPI.startCompetition(
          this.formData.name,
          allParticipants,
          this.formData.startDate,
          this.formData.endDate
        );

        this.successMessage = `Competition "${this.formData.name}" created successfully! Competition ID: ${result.competitionId}`;

        // Clear form after successful creation
        setTimeout(() => {
          this.cancelForm();
          this.successMessage = "";
        }, 3000);
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    cancelForm() {
      this.formData.name = "";
      this.newParticipant = "";
      this.participants = [];
      this.errors = {};
      this.errorMessage = "";
      this.successMessage = "";

      // Reset dates to defaults
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      this.formData.startDate = today.toLocaleDateString("en-CA");
      this.formData.endDate = nextWeek.toLocaleDateString("en-CA");
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
.competition-create-container {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.competition-create-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 600px;
}

.create-header {
  text-align: center;
  margin-bottom: 2rem;
}

.create-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.create-header p {
  color: #666;
  font-size: 0.95rem;
}

.create-form {
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

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: white;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error {
  border-color: #e74c3c;
  background-color: #fdf2f2;
}

.date-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.participant-input-group {
  display: flex;
  gap: 0.5rem;
}

.participant-input-group .form-input {
  flex: 1;
}

.btn-add {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  white-space: nowrap;
}

.participants-list {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.participants-list h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.participants-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.participant-item {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.participant-name {
  margin-right: 0.5rem;
  color: #333;
}

.btn-remove {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background-color: #e74c3c;
  color: white;
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
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
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

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-2px);
}

.btn-secondary:disabled {
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
  .competition-create-container {
    padding: 1rem;
  }

  .competition-create-card {
    padding: 1.5rem;
  }

  .date-group {
    grid-template-columns: 1fr;
  }

  .participant-input-group {
    flex-direction: column;
  }

  .btn-add {
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>

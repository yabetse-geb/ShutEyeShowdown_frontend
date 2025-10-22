<template>
  <div class="accountability-container">
    <div class="accountability-card">
      <div class="accountability-header">
        <h2>Accountability Partners</h2>
        <p>
          Manage your accountability partnerships and notification preferences
        </p>
      </div>

      <!-- Add Partner Section -->
      <div class="add-partner-section">
        <h3>Add New Partner</h3>
        <div class="partner-input-group">
          <input
            type="text"
            v-model="currentPartner"
            class="form-input"
            placeholder="Enter partner username"
            @keyup.enter="addPartner"
          />
          <button
            type="button"
            @click="addPartner"
            class="btn btn-secondary btn-add"
            :disabled="isLoading"
          >
            Add Partner
          </button>
        </div>
      </div>

      <!-- Partners List -->
      <div v-if="partners.length > 0" class="partners-section">
        <h3>Current Partners</h3>
        <div class="partners-list">
          <div
            v-for="(partner, index) in partners"
            :key="index"
            class="partner-item"
          >
            <div class="partner-info">
              <span class="partner-name">{{ partner.username }}</span>
              <span class="partner-frequency">{{
                partner.reportFrequency
              }}</span>
              <span class="partner-notifications">
                Notifications: {{ partner.notifyTypes.join(", ") }}
              </span>
            </div>
            <div class="partner-actions">
              <button
                @click="editPartner(index)"
                class="btn btn-small btn-secondary"
              >
                Edit
              </button>
              <button
                @click="removePartner(index)"
                class="btn btn-small btn-danger"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <p>No accountability partners added yet.</p>
        <p>Add partners above to get started!</p>
      </div>

      <!-- Error and Success Messages -->
      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-banner">
        {{ successMessage }}
      </div>

      <!-- Partner Edit Modal -->
      <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Edit Partner Settings</h3>
            <button @click="closeEditModal" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Notification Types</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="editForm.notifyTypes"
                    value="BEDTIME"
                  />
                  Bedtime Failures
                </label>
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="editForm.notifyTypes"
                    value="WAKETIME"
                  />
                  Wake-up Failures
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Report Frequency</label>
              <select v-model="editForm.reportFrequency" class="form-select">
                <option value="Immediate">Immediate</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeEditModal" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="savePartnerSettings" class="btn btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { accountabilityAPI, passwordAuthAPI } from "../services/api";
import authStore from "../stores/authStore";

export default {
  name: "Accountability",
  data() {
    return {
      currentPartner: "",
      partners: [],
      isLoading: false,
      errorMessage: "",
      successMessage: "",
      showEditModal: false,
      editForm: {
        partnerIndex: -1,
        notifyTypes: [],
        reportFrequency: "Daily",
      },
    };
  },
  async mounted() {
    await this.loadPartners();
  },
  methods: {
    async loadPartners() {
      try {
        const currentUser = authStore.getUsername();
        if (!currentUser) {
          this.errorMessage = "Please log in to view accountability partners.";
          return;
        }

        const partnerships = await accountabilityAPI.getPartnerships(
          currentUser
        );

        // Transform the partnerships data to match our local structure
        this.partners = partnerships.map((partnership) => ({
          username: partnership.partner,
          reportFrequency: partnership.reportFrequency,
          notifyTypes: partnership.notifyTypes,
          partnershipId: partnership._id,
          lastReportDate: partnership.lastReportDate,
        }));
      } catch (error) {
        console.error("Failed to load partners:", error);
        this.errorMessage =
          error.message || "Failed to load accountability partners.";
      }
    },

    async addPartner() {
      if (!this.currentPartner.trim()) {
        this.errorMessage = "Partner username cannot be empty.";
        return;
      }

      if (this.partners.some((p) => p.username === this.currentPartner)) {
        this.errorMessage = "Partner already added.";
        return;
      }

      this.errorMessage = "";
      this.isLoading = true;

      try {
        const currentUser = authStore.getUsername();
        if (!currentUser) {
          throw new Error("Please log in to add accountability partners.");
        }

        // Validate if partner exists in the system
        const response = await passwordAuthAPI.isRegistered(
          this.currentPartner
        );
        if (!response.isRegistered) {
          this.errorMessage = `User '${this.currentPartner}' is not registered.`;
          return;
        }

        // Add partner with default settings
        await accountabilityAPI.addPartner(
          currentUser,
          this.currentPartner,
          ["BEDTIME", "WAKETIME"], // Default notification types
          "Daily" // Default report frequency
        );

        const addedPartner = this.currentPartner;
        this.currentPartner = "";
        this.successMessage = `Partner '${addedPartner}' added successfully!`;

        // Reload partners list to get the updated data
        await this.loadPartners();

        setTimeout(() => {
          this.successMessage = "";
        }, 3000);
      } catch (error) {
        this.errorMessage = error.message || "Failed to add partner.";
      } finally {
        this.isLoading = false;
      }
    },

    async removePartner(index) {
      try {
        const currentUser = authStore.getUsername();
        const partnerToRemove = this.partners[index];

        if (!currentUser) {
          throw new Error("Please log in to remove accountability partners.");
        }

        await accountabilityAPI.removePartner(
          currentUser,
          partnerToRemove.username
        );

        this.successMessage = `Partner '${partnerToRemove.username}' removed successfully!`;

        // Reload partners list to get the updated data
        await this.loadPartners();

        setTimeout(() => {
          this.successMessage = "";
        }, 3000);
      } catch (error) {
        this.errorMessage = error.message || "Failed to remove partner.";
      }
    },

    editPartner(index) {
      const partner = this.partners[index];
      this.editForm = {
        partnerIndex: index,
        notifyTypes: [...partner.notifyTypes],
        reportFrequency: partner.reportFrequency,
      };
      this.showEditModal = true;
    },

    async savePartnerSettings() {
      try {
        const currentUser = authStore.getUsername();
        const partner = this.partners[this.editForm.partnerIndex];

        if (!currentUser) {
          throw new Error("Please log in to update partner settings.");
        }

        await accountabilityAPI.updatePreferences(
          currentUser,
          partner.username,
          this.editForm.notifyTypes,
          this.editForm.reportFrequency
        );

        this.successMessage = `Partner '${partner.username}' settings updated successfully!`;
        this.closeEditModal();

        // Reload partners list to get the updated data
        await this.loadPartners();

        setTimeout(() => {
          this.successMessage = "";
        }, 3000);
      } catch (error) {
        this.errorMessage =
          error.message || "Failed to update partner settings.";
      }
    },

    closeEditModal() {
      this.showEditModal = false;
      this.editForm = {
        partnerIndex: -1,
        notifyTypes: [],
        reportFrequency: "Daily",
      };
    },

    clearMessages() {
      this.errorMessage = "";
      this.successMessage = "";
    },
  },
};
</script>

<style scoped>
.accountability-container {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.accountability-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 800px;
}

.accountability-header {
  text-align: center;
  margin-bottom: 2rem;
}

.accountability-header h2 {
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.accountability-header p {
  color: #718096;
  font-size: 1.1rem;
}

.add-partner-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0;
}

.add-partner-section h3 {
  color: #2d3748;
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.partner-input-group {
  display: flex;
  gap: 0.75rem;
}

.partner-input-group .form-input {
  flex: 1;
}

.btn-add {
  padding: 0.75rem 1.5rem;
  white-space: nowrap;
}

.partners-section h3 {
  color: #2d3748;
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.partners-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.partner-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.partner-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.partner-name {
  font-weight: 600;
  color: #2d3748;
  font-size: 1.1rem;
}

.partner-frequency {
  color: #718096;
  font-size: 0.9rem;
}

.partner-notifications {
  color: #4a5568;
  font-size: 0.85rem;
  font-style: italic;
}

.partner-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-danger {
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #c53030;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #718096;
}

.empty-state p {
  margin-bottom: 0.5rem;
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
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2d3748;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
}

.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Common Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #e2e8f0;
  color: #2d3748;
}

.btn-secondary:hover:not(:disabled) {
  background: #cbd5e0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Form Input Styles */
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Message Styles */
.error-banner {
  background: #fed7d7;
  color: #c53030;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  border-left: 4px solid #e53e3e;
}

.success-banner {
  background: #c6f6d5;
  color: #2f855a;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  border-left: 4px solid #38a169;
}

/* Responsive Design */
@media (max-width: 768px) {
  .accountability-container {
    padding: 1rem;
  }

  .accountability-card {
    padding: 1.5rem;
  }

  .partner-input-group {
    flex-direction: column;
  }

  .btn-add {
    width: 100%;
  }

  .partner-item {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .partner-actions {
    justify-content: center;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>

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

      <!-- Accountability Seekers List -->
      <div v-if="seekers.length > 0" class="partners-section">
        <h3>Accountability Seekers</h3>
        <div class="partners-list">
          <div
            v-for="(seeker, index) in seekers"
            :key="index"
            class="partner-item"
          >
            <div class="partner-info">
              <span class="partner-name">{{ seeker.username }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="partners.length === 0 && seekers.length === 0"
        class="empty-state"
      >
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
import {
  accountabilityAPI,
  passwordAuthAPI,
  sessioningAPI,
} from "../services/api";
import authStore from "../stores/authStore";

export default {
  name: "Accountability",
  data() {
    return {
      currentPartner: "",
      partners: [],
      seekers: [],
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
    await this.loadSeekers();
  },
  methods: {
    async loadPartners() {
      try {
        // OLD WAY (for reversion): const currentUserId = authStore.getUserId();
        // NEW WAY: Get user ID from session using _getUser
        const session = authStore.getSession();
        if (!session) {
          this.errorMessage = "Please log in to view accountability partners.";
          return;
        }
        const currentUserId = await sessioningAPI.getUser(session);
        if (!currentUserId) {
          this.errorMessage =
            "Failed to load user information. Please log in again.";
          return;
        }

        const partnerships = await accountabilityAPI.getPartnerships(
          currentUserId
        );

        console.log("Accountability: Partnerships received:", partnerships);
        console.log("Accountability: Current user ID:", currentUserId);
        console.log("Accountability: User ID type:", typeof currentUserId);

        // Only include partnerships the current user initiated
        // Convert both to strings for comparison (IDs might be objects or strings)
        const currentUserIdStr = String(currentUserId);
        const initiated = partnerships.filter((p) => {
          const pUserStr = String(p.user);
          const matches = pUserStr === currentUserIdStr;
          console.log(
            `Accountability: Partnership user ${pUserStr} === ${currentUserIdStr}? ${matches}`
          );
          return matches;
        });
        console.log("Accountability: Initiated partnerships:", initiated);

        // Transform to local structure and convert partner IDs to usernames
        this.partners = await Promise.all(
          initiated.map(async (partnership) => {
            try {
              const username = await passwordAuthAPI.getUsername(
                partnership.partner
              );
              return {
                userId: partnership.partner,
                username: username || partnership.partner,
                reportFrequency: partnership.reportFrequency,
                notifyTypes: partnership.notifyTypes,
                partnershipId: partnership._id,
                lastReportDate: partnership.lastReportDate,
              };
            } catch (e) {
              return {
                userId: partnership.partner,
                username: partnership.partner,
                reportFrequency: partnership.reportFrequency,
                notifyTypes: partnership.notifyTypes,
                partnershipId: partnership._id,
                lastReportDate: partnership.lastReportDate,
              };
            }
          })
        );
      } catch (error) {
        console.error("Failed to load partners:", error);
        this.errorMessage =
          error.message || "Failed to load accountability partners.";
      }
    },

    async loadSeekers() {
      try {
        // OLD WAY (for reversion): const currentUserId = authStore.getUserId();
        // NEW WAY: Get user ID from session using _getUser
        const session = authStore.getSession();
        if (!session) {
          return;
        }
        const currentUserId = await sessioningAPI.getUser(session);
        if (!currentUserId) {
          return;
        }

        // Note: getSeekersForUser endpoint may not exist in API specs
        // If it fails, we'll just skip loading seekers
        try {
          const seekersRaw = await accountabilityAPI.getSeekersForUser(
            currentUserId
          );
          const seekerIds = Array.isArray(seekersRaw) ? seekersRaw : [];

          const seekersWithUsernames = await Promise.all(
            seekerIds.map(async (id) => {
              try {
                const username = await passwordAuthAPI.getUsername(id);
                return { user: id, username: username || id };
              } catch (e) {
                return { user: id, username: id };
              }
            })
          );

          this.seekers = seekersWithUsernames;
        } catch (error) {
          // If endpoint doesn't exist, just log and continue
          console.warn(
            "getSeekersForUser endpoint may not be available:",
            error
          );
          this.seekers = [];
        }
      } catch (error) {
        console.error("Failed to load accountability seekers:", error);
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
        // OLD WAY (for reversion): const currentUserId = authStore.getUserId();
        // NEW WAY: Get user ID from session using _getUser
        const session = authStore.getSession();
        if (!session) {
          throw new Error("Please log in to add accountability partners.");
        }
        const currentUserId = await sessioningAPI.getUser(session);
        if (!currentUserId) {
          throw new Error(
            "Failed to load user information. Please log in again."
          );
        }

        // Validate if partner exists in the system
        try {
          const response = await passwordAuthAPI.isRegistered(
            this.currentPartner
          );
          // Response is an array: [{ isRegistered: boolean }]
          if (
            !response ||
            response.length === 0 ||
            !response[0]?.isRegistered
          ) {
            this.errorMessage = `User '${this.currentPartner}' is not registered.`;
            return;
          }
        } catch (error) {
          // API returns error object on error
          this.errorMessage = `User '${this.currentPartner}' is not registered.`;
          return;
        }

        // Convert partner username to user ID
        const partnerUserId = await passwordAuthAPI.getUserByUsername(
          this.currentPartner
        );
        if (!partnerUserId) {
          this.errorMessage = `User '${this.currentPartner}' not found.`;
          return;
        }

        // Add partner with default settings (using user IDs)
        await accountabilityAPI.addPartner(
          currentUserId,
          partnerUserId,
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
        // OLD WAY (for reversion): const currentUserId = authStore.getUserId();
        // NEW WAY: Get user ID from session using _getUser
        const session = authStore.getSession();
        if (!session) {
          throw new Error("Please log in to remove accountability partners.");
        }
        const currentUserId = await sessioningAPI.getUser(session);
        const partnerToRemove = this.partners[index];

        if (!currentUserId) {
          throw new Error(
            "Failed to load user information. Please log in again."
          );
        }

        // Use partner's user ID (stored in userId field)
        await accountabilityAPI.removePartner(
          currentUserId,
          partnerToRemove.userId || partnerToRemove.username
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
        // OLD WAY (for reversion): const currentUserId = authStore.getUserId();
        // NEW WAY: Get user ID from session using _getUser
        const session = authStore.getSession();
        if (!session) {
          throw new Error("Please log in to update partner settings.");
        }
        const currentUserId = await sessioningAPI.getUser(session);
        const partner = this.partners[this.editForm.partnerIndex];

        if (!currentUserId) {
          throw new Error(
            "Failed to load user information. Please log in again."
          );
        }

        // Use partner's user ID (stored in userId field)
        await accountabilityAPI.updatePreferences(
          currentUserId,
          partner.userId || partner.username,
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
  background: transparent;
}

.accountability-card {
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

.accountability-header {
  text-align: center;
  margin-bottom: 2rem;
}

.accountability-header h2 {
  color: #e6eaf8;
  margin-bottom: 0.5rem;
  font-size: 2.2rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.accountability-header p {
  color: rgba(230, 234, 248, 0.8);
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.add-partner-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.08);
}

.add-partner-section h3 {
  color: #e6eaf8;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
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
  color: #e6eaf8;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
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
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.partner-item:hover {
  background: rgba(45, 59, 104, 0.7);
  border-color: rgba(255, 255, 255, 0.12);
}

.partner-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.partner-name {
  font-weight: 600;
  color: #e6eaf8;
  font-size: 1.1rem;
}

.partner-frequency {
  color: rgba(230, 234, 248, 0.8);
  font-size: 0.9rem;
}

.partner-notifications {
  color: rgba(230, 234, 248, 0.7);
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
  color: rgba(230, 234, 248, 0.7);
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
  background: rgba(30, 42, 71, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  color: #e6eaf8;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h3 {
  margin: 0;
  color: #e6eaf8;
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
  color: #e6eaf8;
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
  border-color: #5b5fe9;
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
  background: linear-gradient(90deg, #5b5fe9, #a78bfa);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(90deg, #a78bfa, #5b5fe9);
  box-shadow: 0 4px 16px rgba(167, 139, 250, 0.5),
    0 0 10px rgba(167, 139, 250, 0.4);
  transform: translateY(-2px) scale(1.02);
  transition: all 0.4s ease;
}

.btn-secondary {
  background: #e5e7eb;
  color: #0d1b2a;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.btn-secondary:hover:not(:disabled) {
  background: #9bb8ff;
  border-color: #9bb8ff;
  box-shadow: 0 0 10px rgba(155, 184, 255, 0.4);
  transition: all 0.4s ease;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e6eaf8;
  transition: all 0.4s ease;
}

.form-input::placeholder {
  color: rgba(230, 234, 248, 0.5);
}

.form-input:hover {
  border-color: rgba(167, 139, 250, 0.3);
  box-shadow: 0 0 8px rgba(167, 139, 250, 0.2);
  background: rgba(30, 42, 71, 0.7);
}

.form-input:focus {
  outline: none;
  border-color: rgba(167, 139, 250, 0.5);
  background: rgba(30, 42, 71, 0.8);
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.15),
    0 0 12px rgba(167, 139, 250, 0.3);
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

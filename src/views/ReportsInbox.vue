<template>
  <div class="inbox-container">
    <div class="inbox-card">
      <div class="inbox-header">
        <h2>Reports Inbox</h2>
        <p>View accountability seekers who report to you</p>
      </div>

      <div class="inbox-list">
        <div class="inbox-row inbox-header-row">
          <div class="inbox-col from">Accountability Seeker</div>
        </div>
        <div
          v-for="(seeker, idx) in seekers"
          :key="seeker.user || idx"
          class="inbox-row"
          @click="openReports(seeker)"
        >
          <div class="inbox-col from">{{ seeker.username }}</div>
        </div>
        <div v-if="seekers.length === 0" class="dropdown-empty">
          No seekers found
        </div>
      </div>

      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <!-- Reports Modal -->
      <div v-if="showReportsModal" class="modal-overlay" @click="closeReports">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Reports from {{ selectedSeeker?.username }}</h3>
            <button @click="closeReports" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div v-if="reportsLoading" class="modal-loading">Loading…</div>
            <div v-else>
              <div v-if="reportsError" class="error-banner">
                {{ reportsError }}
              </div>
              <div v-if="reports.length === 0" class="empty-reports">
                No reports yets
              </div>
              <div v-else class="reports-table">
                <div class="reports-header">
                  <div class="reports-col">Report</div>
                </div>
                <div v-for="(rep, i) in reports" :key="i" class="reports-row">
                  <div class="reports-col">{{ rep }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeReports" class="btn btn-primary">Close</button>
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
  name: "ReportsInbox",
  data() {
    return {
      seekers: [],
      isLoading: false,
      errorMessage: "",
      selectedSeeker: null,
      showReportsModal: false,
      reports: [],
      reportsLoading: false,
      reportsError: "",
    };
  },
  computed: {
    selectedLabel() {
      if (this.selectedSeeker) return this.selectedSeeker.username;
      return "";
    },
  },
  async mounted() {
    await this.loadSeekers();
  },
  methods: {
    async loadSeekers() {
      this.errorMessage = "";
      this.isLoading = true;
      try {
        const currentUserId = authStore.getUserId();
        if (!currentUserId) {
          this.errorMessage = "Please log in to view your inbox.";
          return;
        }

        // Note: getSeekersForUser endpoint may not exist in API specs
        try {
          const seekersRaw = await accountabilityAPI.getSeekersForUser(
            currentUserId
          );

          const seekerIds = Array.isArray(seekersRaw) ? seekersRaw : [];

          const resolved = await Promise.all(
            seekerIds.map(async (id) => {
              try {
                const username = await passwordAuthAPI.getUsername(id);
                return { user: id, username: username || id };
              } catch (e) {
                return { user: id, username: id };
              }
            })
          );

          this.seekers = resolved;
        } catch (error) {
          // If endpoint doesn't exist, just log and continue
          console.warn(
            "getSeekersForUser endpoint may not be available:",
            error
          );
          this.seekers = [];
        }
      } catch (e) {
        this.errorMessage = e.message || "Failed to load inbox.";
      } finally {
        this.isLoading = false;
      }
    },
    async openReports(seeker) {
      this.selectedSeeker = seeker;
      this.showReportsModal = true;
      this.reports = [];
      this.reportsError = "";
      this.reportsLoading = true;
      try {
        const currentUserId = authStore.getUserId();
        if (!currentUserId) {
          this.reportsError = "Please log in to view reports.";
          return;
        }
        // Note: getAllReports endpoint may not exist in API specs
        const result = await accountabilityAPI.getAllReports(
          currentUserId,
          seeker.user
        );
        this.reports = Array.isArray(result) ? result : [];
      } catch (e) {
        this.reportsError = e.message || "Failed to load reports.";
      } finally {
        this.reportsLoading = false;
      }
    },
    closeReports() {
      this.showReportsModal = false;
    },
  },
};
</script>

<style scoped>
.inbox-container {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: transparent;
}

.inbox-card {
  background: rgba(30, 42, 71, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  padding: 2.5rem;
  width: 100%;
  max-width: 720px;
  color: #e6eaf8;
}

.inbox-header {
  text-align: center;
  margin-bottom: 2rem;
}

.dropdown {
  position: relative;
  width: 100%;
}

.dropdown-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e6eaf8;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
}

.dropdown-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.caret {
  margin-left: 0.5rem;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-height: 280px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  color: #2d3748;
}

.dropdown-item:hover {
  background: #f7fafc;
}

/* Inbox list (Gmail-like) */
.inbox-list {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(30, 42, 71, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.inbox-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  color: #e6eaf8;
  transition: all 0.2s ease;
}

.inbox-row:hover {
  background: rgba(45, 59, 104, 0.6);
}

.inbox-header-row {
  background: rgba(30, 42, 71, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-weight: 600;
  color: #e6eaf8;
  cursor: default;
}

.inbox-col.from {
  color: #e6eaf8;
  font-size: 0.975rem;
}

.dropdown-empty {
  padding: 0.75rem 1rem;
  color: rgba(230, 234, 248, 0.6);
  font-style: italic;
}

.error-banner {
  background: #fed7d7;
  color: #c53030;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  border-left: 4px solid #e53e3e;
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
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  color: #e6eaf8;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
}

.modal-body {
  padding: 1rem 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-loading {
  color: #e6eaf8;
}

.empty-reports {
  color: rgba(230, 234, 248, 0.6);
  font-style: italic;
}

/* Reports table */
.reports-table {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(30, 42, 71, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.reports-header {
  display: grid;
  grid-template-columns: 1fr;
  background: rgba(30, 42, 71, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e6eaf8;
  font-weight: 600;
  padding: 0.75rem 1rem;
}

.reports-row {
  display: grid;
  grid-template-columns: 1fr;
  padding: 0.9rem 1rem;
  background: rgba(30, 42, 71, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e6eaf8;
}

.reports-row + .reports-row {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.reports-col {
  color: #e6eaf8;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .inbox-container {
    padding: 1rem;
  }
  .inbox-card {
    padding: 1.5rem;
  }
}
</style>

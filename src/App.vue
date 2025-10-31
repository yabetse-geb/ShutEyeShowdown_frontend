<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>Shut Eye Showdown</h1>
      </div>
      <div class="nav-links">
        <router-link to="/" class="nav-link">Home</router-link>
        <template v-if="isLoggedIn">
          <router-link to="/sleep-schedule" class="nav-link"
            >Sleep Schedule</router-link
          >
          <router-link to="/sleep-report" class="nav-link"
            >Report Sleep</router-link
          >
          <router-link to="/competition-create" class="nav-link"
            >Create Competition</router-link
          >
          <router-link to="/competition" class="nav-link"
            >Competitions</router-link
          >
          <router-link to="/accountability" class="nav-link"
            >Accountability</router-link
          >
          <router-link to="/reports-inbox" class="nav-link"
            >Reports Inbox</router-link
          >
          <router-link to="/analytics" class="nav-link">Analytics</router-link>
          <span class="nav-user">Welcome, {{ username }}</span>
          <button @click="logout" class="nav-link nav-button">Logout</button>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-link">Login</router-link>
          <router-link to="/register" class="nav-link">Register</router-link>
        </template>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <footer class="footer">
      <p>&copy; 2024 Shut Eye Showdown. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
import authStore from "./stores/authStore";

export default {
  name: "App",
  data() {
    return {
      authStore,
      // Force reactivity by creating a reactive counter
      authUpdateCounter: 0,
    };
  },
  computed: {
    isLoggedIn() {
      // Include authUpdateCounter to force reactivity
      this.authUpdateCounter;
      return authStore.isLoggedIn();
    },
    username() {
      // Include authUpdateCounter to force reactivity
      this.authUpdateCounter;
      return authStore.getUsername();
    },
  },
  methods: {
    logout() {
      authStore.clearUser();
      // Force reactivity update
      this.authUpdateCounter++;
      this.$router.push("/");
    },
    // Method to force reactivity update (can be called from other components)
    forceAuthUpdate() {
      this.authUpdateCounter++;
    },
  },
  mounted() {
    // Listen for storage changes (when user logs in from another tab)
    window.addEventListener("storage", (e) => {
      if (e.key === "shutEyeUser") {
        this.forceAuthUpdate();
      }
    });

    // Listen for custom auth state change events
    window.addEventListener("authStateChanged", () => {
      this.forceAuthUpdate();
    });
  },
};
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nav-brand h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-user {
  color: white;
  padding: 0.5rem 1rem;
  font-weight: 500;
  opacity: 0.9;
}

.nav-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
}

.nav-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.main-content {
  flex: 1;
  padding: 2rem;
}

.footer {
  background-color: #f8f9fa;
  padding: 1rem 2rem;
  text-align: center;
  border-top: 1px solid #e9ecef;
  color: #6c757d;
}
</style>

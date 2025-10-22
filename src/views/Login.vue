<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Welcome Back</h2>
        <p>Sign in to your Shut Eye Showdown account</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-input"
            :class="{ error: errors.username }"
            placeholder="Enter your username"
            required
          />
          <span v-if="errors.username" class="error-message">{{
            errors.username
          }}</span>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            :class="{ error: errors.password }"
            placeholder="Enter your password"
            required
          />
          <span v-if="errors.password" class="error-message">{{
            errors.password
          }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? "Signing In..." : "Sign In" }}
        </button>

        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>
      </form>

      <div class="auth-footer">
        <p>
          Don't have an account?
          <router-link to="/register" class="auth-link"
            >Sign up here</router-link
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { passwordAuthAPI } from "../services/api";
import authStore from "../stores/authStore";

export default {
  name: "Login",
  data() {
    return {
      form: {
        username: "",
        password: "",
      },
      errors: {},
      isLoading: false,
      errorMessage: "",
    };
  },
  methods: {
    async handleLogin() {
      this.clearErrors();
      this.isLoading = true;

      try {
        const response = await passwordAuthAPI.authenticate(
          this.form.username,
          this.form.password
        );

        // Store user data in auth store
        authStore.setUser({
          username: this.form.username,
          user: response.user,
        });

        // Force reactivity update by dispatching a custom event
        window.dispatchEvent(new CustomEvent("authStateChanged"));

        // Redirect to home page
        this.$router.push("/");
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.isLoading = false;
      }
    },
    clearErrors() {
      this.errors = {};
      this.errorMessage = "";
    },
  },
};
</script>

<style scoped>
.auth-container {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.auth-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: #666;
  font-size: 0.95rem;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #fafbfc;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error {
  border-color: #e74c3c;
  background-color: #fdf2f2;
}

.error-message {
  display: block;
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.btn-full {
  width: 100%;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
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

.error-banner {
  background-color: #fdf2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
}

.auth-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #e1e5e9;
}

.auth-footer p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.auth-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.auth-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-container {
    padding: 1rem;
  }

  .auth-card {
    padding: 2rem;
  }
}
</style>

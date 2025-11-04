<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Create Account</h2>
        <p>Join Shut Eye Showdown and start tracking your sleep</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-input"
            :class="{ error: errors.username }"
            placeholder="Choose a username"
            required
            @blur="checkUsernameAvailability"
          />
          <span v-if="errors.username" class="error-message">{{
            errors.username
          }}</span>
          <span v-if="usernameChecking" class="checking-message"
            >Checking availability...</span
          >
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            :class="{ error: errors.password }"
            placeholder="Create a password"
            required
            minlength="6"
          />
          <span v-if="errors.password" class="error-message">{{
            errors.password
          }}</span>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label"
            >Confirm Password</label
          >
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            :class="{ error: errors.confirmPassword }"
            placeholder="Confirm your password"
            required
          />
          <span v-if="errors.confirmPassword" class="error-message">{{
            errors.confirmPassword
          }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="isLoading || usernameChecking"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? "Creating Account..." : "Create Account" }}
        </button>

        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>
      </form>

      <div class="auth-footer">
        <p>
          Already have an account?
          <router-link to="/login" class="auth-link">Sign in here</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { passwordAuthAPI } from "../services/api";
import authStore from "../stores/authStore";

export default {
  name: "Register",
  data() {
    return {
      form: {
        username: "",
        password: "",
        confirmPassword: "",
      },
      errors: {},
      isLoading: false,
      usernameChecking: false,
      errorMessage: "",
    };
  },
  methods: {
    async handleRegister() {
      this.clearErrors();

      // Validate form
      if (!this.validateForm()) {
        return;
      }

      this.isLoading = true;
      console.log("Starting registration process...");

      try {
        const response = await passwordAuthAPI.register(
          this.form.username,
          this.form.password
        );

        console.log("Registration successful:", response);

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
        console.error("Registration failed:", error);
        this.errorMessage = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    validateForm() {
      this.errors = {};

      // Username validation
      if (!this.form.username.trim()) {
        this.errors.username = "Username is required";
      } else if (this.form.username.length < 3) {
        this.errors.username = "Username must be at least 3 characters";
      }

      // Password validation
      if (!this.form.password) {
        this.errors.password = "Password is required";
      } else if (this.form.password.length < 6) {
        this.errors.password = "Password must be at least 6 characters";
      }

      // Confirm password validation
      if (!this.form.confirmPassword) {
        this.errors.confirmPassword = "Please confirm your password";
      } else if (this.form.password !== this.form.confirmPassword) {
        this.errors.confirmPassword = "Passwords do not match";
      }

      return Object.keys(this.errors).length === 0;
    },

    async checkUsernameAvailability() {
      if (!this.form.username.trim() || this.form.username.length < 3) {
        return;
      }

      this.usernameChecking = true;

      try {
        const response = await passwordAuthAPI.isRegistered(this.form.username);
        if (response[0]?.isRegistered) {
          this.errors.username = "Username is already taken";
        }
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        this.usernameChecking = false;
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
  background: transparent;
}

.auth-card {
  background: rgba(30, 42, 71, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  color: #e6eaf8;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h2 {
  font-size: 1.8rem;
  font-weight: 500;
  color: #e6eaf8;
  margin-bottom: 0.5rem;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.auth-header p {
  color: rgba(230, 234, 248, 0.8);
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
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
  color: #e6eaf8;
  font-size: 0.9rem;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.4s ease;
  background: rgba(30, 42, 71, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e6eaf8;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.form-input::placeholder {
  color: rgba(230, 234, 248, 0.5);
}

.form-input:hover {
  border-color: rgba(167, 139, 250, 0.3);
  background: rgba(30, 42, 71, 0.7);
}

.form-input:focus {
  outline: none;
  border-color: rgba(167, 139, 250, 0.5);
  background: rgba(30, 42, 71, 0.8);
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.15),
    0 0 8px rgba(167, 139, 250, 0.3);
}

.form-input.error {
  border-color: #fc8181;
  background: rgba(252, 129, 129, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.error-message {
  display: block;
  color: #fc8181;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.checking-message {
  display: block;
  color: #9bb8ff;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-style: italic;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.btn-full {
  width: 100%;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
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
  border-radius: 12px;
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
  background: rgba(252, 129, 129, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(252, 129, 129, 0.4);
  color: #fc8181;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.auth-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.auth-footer p {
  color: rgba(230, 234, 248, 0.8);
  font-size: 0.9rem;
  margin: 0;
  font-family: "Nunito", "Poppins", "Inter", sans-serif;
}

.auth-link {
  color: #9bb8ff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.auth-link:hover {
  color: #a78bfa;
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

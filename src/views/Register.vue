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
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            :class="{ error: errors.email }"
            placeholder="Enter your email address"
            required
          />
          <span v-if="errors.email" class="error-message">{{
            errors.email
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
        email: "",
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
          this.form.password,
          this.form.email
        );

        console.log("Registration successful:", response);

        // Store user data in auth store
        authStore.setUser({
          username: this.form.username,
          user: response.user,
        });

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

      // Email validation
      if (!this.form.email.trim()) {
        this.errors.email = "Email is required";
      } else if (!this.isValidEmail(this.form.email)) {
        this.errors.email = "Please enter a valid email address";
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

    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
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

.checking-message {
  display: block;
  color: #667eea;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-style: italic;
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

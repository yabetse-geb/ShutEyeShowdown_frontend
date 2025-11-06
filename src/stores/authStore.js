// Authentication store using localStorage for persistence
class AuthStore {
  constructor() {
    this.currentUser = null;
    this.session = null;
    this.isAuthenticated = false;
    this.loadFromStorage();
  }

  // Load authentication state from localStorage
  loadFromStorage() {
    try {
      const storedUser = localStorage.getItem("shutEyeUser");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        this.currentUser = parsed;
        this.session = parsed?.session || null;
        this.isAuthenticated = this.session !== null;
      }
    } catch (error) {
      console.error("Error loading auth state from storage:", error);
      this.clearStorage();
    }
  }

  // Save authentication state to localStorage
  saveToStorage() {
    try {
      if (this.currentUser) {
        localStorage.setItem("shutEyeUser", JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem("shutEyeUser");
      }
    } catch (error) {
      console.error("Error saving auth state to storage:", error);
    }
  }

  // Clear localStorage
  clearStorage() {
    localStorage.removeItem("shutEyeUser");
  }

  // Set authenticated user with session
  setUser(userData) {
    this.currentUser = userData;
    this.session = userData?.session || null;
    this.isAuthenticated = this.session !== null;
    this.saveToStorage();
  }

  // Clear user data and session
  clearUser() {
    this.currentUser = null;
    this.session = null;
    this.isAuthenticated = false;
    this.clearStorage();
  }

  // Get current user
  getUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isLoggedIn() {
    return this.isAuthenticated && this.session !== null;
  }

  // Get session ID
  getSession() {
    return this.session;
  }

  // Get username
  getUsername() {
    return this.currentUser?.username || null;
  }
}

// Create singleton instance
const authStore = new AuthStore();

export default authStore;

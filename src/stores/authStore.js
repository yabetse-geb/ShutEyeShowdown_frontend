// Authentication store using localStorage for persistence
class AuthStore {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.loadFromStorage();
  }

  // Load authentication state from localStorage
  loadFromStorage() {
    try {
      const storedUser = localStorage.getItem("shutEyeUser");
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        this.isAuthenticated = true;
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

  // Set authenticated user
  setUser(userData) {
    this.currentUser = userData;
    this.isAuthenticated = true;
    this.saveToStorage();
  }

  // Clear user data
  clearUser() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.clearStorage();
  }

  // Get current user
  getUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isLoggedIn() {
    return this.isAuthenticated && this.currentUser !== null;
  }

  // Get username
  getUsername() {
    return this.currentUser?.username || null;
  }

  // Get user ID
  getUserId() {
    return this.currentUser?.user || null;
  }
}

// Create singleton instance
const authStore = new AuthStore();

export default authStore;

<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          {{
            authStore.isLoggedIn()
              ? `Welcome back, ${authStore.getUsername()}!`
              : "Welcome to Shut Eye Showdown"
          }}
        </h1>
        <p class="hero-subtitle">
          {{
            authStore.isLoggedIn()
              ? "Ready to track your sleep and compete with friends?"
              : "The ultimate sleep tracking and competition platform"
          }}
        </p>
        <div class="hero-buttons">
          <template v-if="authStore.isLoggedIn()">
            <router-link to="/sleep-schedule" class="btn btn-primary"
              >Set Sleep Schedule</router-link
            >
            <button class="btn btn-secondary">Join Competition</button>
          </template>
          <template v-else>
            <router-link to="/register" class="btn btn-primary"
              >Get Started</router-link
            >
            <button class="btn btn-secondary">Learn More</button>
          </template>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="container">
        <h2 class="section-title">Features</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">😴</div>
            <h3>Sleep Tracking</h3>
            <p>
              Monitor your sleep patterns and quality with advanced analytics
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🏆</div>
            <h3>Competitions</h3>
            <p>Compete with friends and family in sleep challenges</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Get detailed insights into your sleep habits and trends</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import authStore from "../stores/authStore";

export default {
  name: "Home",
  data() {
    return {
      authStore,
    };
  },
};
</script>

<style scoped>
.home {
  min-height: calc(100vh - 200px);
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: white;
  color: #667eea;
}

.btn-primary:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background-color: white;
  color: #667eea;
}

.features {
  padding: 4rem 2rem;
  background-color: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    width: 200px;
  }
}
</style>

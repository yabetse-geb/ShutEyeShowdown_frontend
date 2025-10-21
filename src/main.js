import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import SleepSchedule from "./views/SleepSchedule.vue";
import SleepReport from "./views/SleepReport.vue";
import "./style.css";
import authStore from "./stores/authStore";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/login", name: "Login", component: Login },
  { path: "/register", name: "Register", component: Register },
  { path: "/sleep-schedule", name: "SleepSchedule", component: SleepSchedule },
  { path: "/sleep-report", name: "SleepReport", component: SleepReport },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Simple route guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = authStore.isLoggedIn();

  // If trying to access login/register while authenticated, redirect to home
  if ((to.name === "Login" || to.name === "Register") && isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

const app = createApp(App);
app.use(router);
app.mount("#app");

import { api } from "./api";

export const authService = {
  async signup({name, email, password, gender, birthdate }) {
    const data = await api.post("/auth/signup", { name, email, password, gender, birthdate });
    localStorage.setItem("rb_token", data.token);
    localStorage.setItem("rb_user", JSON.stringify(data.user));
    return data.user;
  },

  async login({ email, password }) {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("rb_token", data.token);
    localStorage.setItem("rb_user", JSON.stringify(data.user));
    return data.user;
  },

  logout() {
    localStorage.removeItem("rb_token");
    localStorage.removeItem("rb_user");
  },

  getCurrentUser() {
    const raw = localStorage.getItem("rb_user");
    return raw ? JSON.parse(raw) : null;
  },
};

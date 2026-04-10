import { apiFetch } from "./api";

export const auth = {
  async login(username, password) {
    try {
      const response = await apiFetch("/api/auth/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // We store the user data and the token
        const userData = {
          ...data.user,
          token: data.token
        };
        localStorage.setItem('ccs_user', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Cannot connect to server. Please try again.' };
    }
  },

  logout() {
    localStorage.removeItem('ccs_user');
  },

  getUser() {
    try {
      const userData = localStorage.getItem('ccs_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getUser();
  }
};

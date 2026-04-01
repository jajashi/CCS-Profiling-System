const MOCK_USERS = [
  { username: 'admin', password: 'password', name: 'System Admin', role: 'admin' },
  { username: 'user001', password: 'user123456', name: 'User 001', role: 'user' }
];

export const auth = {
  login(username, password) {
    const user = MOCK_USERS.find(
      (u) => (u.username === username || u.username === username.toLowerCase())
    );

    if (!user) {
      return { success: false, error: 'Invalid username' };
    }

    if (user.password !== password) {
      return { success: false, error: 'Invalid password' };
    }

    // Omit password from saved data
    const { password: _, ...userData } = user;
    localStorage.setItem('ccs_user', JSON.stringify(userData));
    return { success: true };
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

/**
 */
const Auth = {
  isAuthenticated: () => !!localStorage.getItem('token'),
  
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },

  // Route Guard to execute on dashboard-level pages
  protectPage: (requiredRole = null) => {
    if (!Auth.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    
    if (requiredRole) {
      const user = Auth.getUser();
      // Adjust standard role property paths depending on your backend payload (e.g., user.role)
      if (!user || user.role !== requiredRole) {
        window.location.href = user && user.role === 'officer' ? '/officer.html' : '/borrower.html';
        return false;
      }
    }
    return true;
  }
};

window.Auth = Auth;
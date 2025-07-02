// src/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create the context
const AuthContext = createContext(null);


// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)


  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const res = await fetch("/api/profile", {
        credentials: "include",
      });
      setLoading(false);
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
        setError("Not authenticated");
      }
    };

    fetchProfile();
  }, []);


  const register = async (email, password) => {
    setError(null);
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });
  
    if (res.ok) {
      const profileRes = await fetch("/api/profile", {
        credentials: "include"
      });
  
      if (profileRes.ok) {
        const userData = await profileRes.json();
        setUser(userData);
        return true;
      }
      return false;
    } else {
      setError("Registration failed");
      return false;
    }
  };

const login = async (email, password) => {
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  })

  if (res.ok) {
    const profileRes = await fetch("/api/profile", {
      credentials: "include"
    })

    if (profileRes.ok) {
      const userData = await profileRes.json();
      setUser(userData);
      return true;
    }

    return false;
  }
  else{
    setError("Logout failed");
    return false;
  }
}

const logout = async () => {
  const res = await fetch("/auth/logout", {
    method: "POST",
    credentials: "include"
  });

  if (res.ok) {
    setUser(null);
    return true;
  } else {
    setError("Logout failed");
    return false;
  }
  
};

const guestLogin = async () => {
  setUser({ guest: true, name: 'Guest User' });
  setError(null);
  return true;
};

return (
  <AuthContext.Provider value={{ user, login, logout, register, loading, error, isAuthenticated: !!user, guestLogin }}>
    {children}
  </AuthContext.Provider>
);

}
//const logout = async(email, pass)




// Custom hook for consuming the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Global fetch wrapper to handle 401 Unauthorized
export function useFetchWithAuth() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return async function fetchWithAuth(url, options = {}) {
    try {
      const res = await fetch(url, { ...options, credentials: 'include' });

      if (res.status === 401) {
        await logout();
        navigate('/login?expired=1', { replace: true });
        return { data: null, error: 'Session expired' };
      }

      if (!res.ok) {
        const errorText = await res.text();
        return { data: null, error: errorText || 'Request failed' };
      }

      let data;
      try {
        data = await res.json();
      } catch {
        data = await res.text();
      }
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message || 'Network error' };
    }
  };
}
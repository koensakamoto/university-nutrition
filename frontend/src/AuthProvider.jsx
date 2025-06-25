// src/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

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
      const res = await fetch("http://localhost:8000/profile", {
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
    const res = await fetch("http://localhost:8000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });
  
    if (res.ok) {
      const profileRes = await fetch("http://localhost:8000/profile", {
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
  const res = await fetch("http://localhost:8000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  })

  if (res.ok) {
    const profileRes = await fetch("http://localhost:8000/profile", {
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
  const res = await fetch("http://localhost:8000/auth/logout", {
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
return (
  <AuthContext.Provider value={{ user, login, logout, register, loading, error, isAuthenticated: !!user }}>
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
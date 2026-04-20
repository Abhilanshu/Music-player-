import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check local storage for existing session
  useEffect(() => {
    const savedUser = localStorage.getItem('muse_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      // Mock validation
      if (!email || !password) {
        return reject('Please fill in all fields');
      }
      
      const registeredUser = localStorage.getItem(`muse_account_${email}`);
      if (registeredUser) {
        const acc = JSON.parse(registeredUser);
        if (acc.password === password) {
          setUser(acc);
          localStorage.setItem('muse_user', JSON.stringify(acc));
          resolve(acc);
        } else {
          reject('Invalid credentials');
        }
      } else {
        // If they don't exist, just auto-create for demo purposes
        // In a real app this would be a separate signup
        const newUser = { email, name: email.split('@')[0], id: Date.now() };
        setUser(newUser);
        localStorage.setItem(`muse_account_${email}`, JSON.stringify({ ...newUser, password }));
        localStorage.setItem('muse_user', JSON.stringify(newUser));
        resolve(newUser);
      }
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('muse_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

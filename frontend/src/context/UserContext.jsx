import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_BASE = 'http://98.93.37.160:5001/api';
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId] = useState('demo_user_123');
  const [balance, setBalance] = useState(50000);
  const [darkMode, setDarkMode] = useState(false);

  const fetchBalance = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/trade/portfolio/${userId}`);
      setBalance(data.profile?.balance ?? 50000);
    } catch {
      console.warn('Backend not reachable, using default balance.');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  return (
    <UserContext.Provider value={{ userId, balance, fetchBalance, darkMode, toggleDarkMode }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
export { API_BASE };

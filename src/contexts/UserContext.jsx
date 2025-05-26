import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import config from '../config';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const apiUrl = config.api.getUrl('MAIN_API', '/api/auth/profile');
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');

        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const updateUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const apiUrl = config.api.getUrl('MAIN_API', '/api/auth/updateProfile');
      const response = await axios.put(apiUrl, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setUser(prevUser => ({ ...prevUser, ...userData }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating user data:', err);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    updateUser,
    isAuthenticated: !!user,
    getUserId: () => {
      if (user?.id) return user.id;
      if (user?.email) {
        const emailParts = user.email.split('@');
        return emailParts[0].toUpperCase();
      }
      return 'GUEST_USER';
    }
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
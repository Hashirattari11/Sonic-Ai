import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, login, logout, updateProfile } = useAuthStore();
  
  const handleLogin = async (email, password, rememberMe = false) => {
    return login({ email, password, rememberMe });
  };
  
  const handleSignup = async (name, email, password) => {
    return login({ name, email, password });
  };
  
  const handleLogout = () => {
    logout();
  };
  
  return {
    user,
    isAuthenticated,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    updateProfile,
  };
};
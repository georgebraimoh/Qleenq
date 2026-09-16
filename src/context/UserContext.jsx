import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS, CURRENT_USER_ID } from '../data/users';
import { authService } from '../services/auth/authService';

const UserContext = createContext();

const STORAGE_KEY_USER = 'leenq_current_user';
const STORAGE_KEY_USERS_ALL = 'leenq_all_users';
const STORAGE_KEY_AUTH = 'leenq_auth_session';

export function UserProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
    return savedAuth === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return MOCK_USERS.find(u => u.id === CURRENT_USER_ID) || MOCK_USERS[0];
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS_ALL);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return MOCK_USERS;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialView, setAuthModalInitialView] = useState('welcome');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS_ALL, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUTH, isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  const openAuthModal = (view = 'welcome') => {
    setAuthModalInitialView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const loginWithEmail = async (email, password) => {
    const user = await authService.loginWithEmail(email, password);
    setCurrentUser(user);
    setIsAuthenticated(true);
    updateUsersList(user);
    return user;
  };

  const registerWithEmail = async (data) => {
    const user = await authService.registerWithEmail(data);
    setCurrentUser(user);
    setIsAuthenticated(true);
    updateUsersList(user);
    return user;
  };

  const loginWithGoogle = async () => {
    const user = await authService.loginWithGoogle();
    setCurrentUser(user);
    setIsAuthenticated(true);
    updateUsersList(user);
    return user;
  };

  const loginWithFacebook = async () => {
    const user = await authService.loginWithFacebook();
    setCurrentUser(user);
    setIsAuthenticated(true);
    updateUsersList(user);
    return user;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
  };

  const updateUsersList = (user) => {
    setUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) {
        return prev.map(u => u.id === user.id ? user : u);
      }
      return [user, ...prev];
    });
  };

  const updateProfile = (updatedFields) => {
    const newProfile = { ...currentUser, ...updatedFields };
    setCurrentUser(newProfile);
    updateUsersList(newProfile);
  };

  const getUserById = (id) => {
    return users.find(u => u.id === id) || {
      id,
      name: "Unknown User",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      location: "Abuja"
    };
  };

  return (
    <UserContext.Provider value={{
      isAuthenticated,
      currentUser,
      users,
      isAuthModalOpen,
      authModalInitialView,
      openAuthModal,
      closeAuthModal,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      loginWithFacebook,
      logout,
      updateProfile,
      getUserById
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

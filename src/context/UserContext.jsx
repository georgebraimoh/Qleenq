import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_USERS, CURRENT_USER_ID } from '../data/users';
import { authService } from '../services/auth/authService';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

const STORAGE_KEY_USERS_ALL = 'leenq_all_users';

export function UserProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS_ALL);

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    return MOCK_USERS;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialView, setAuthModalInitialView] = useState('welcome');

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Keep the local users cache for existing UI features.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS_ALL, JSON.stringify(users));
  }, [users]);

  // Get the current Supabase user when the app starts.
  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();

        if (!mounted) return;

        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);

          setUsers(prev => {
            const exists = prev.some(existingUser => existingUser.id === user.id);

            if (exists) {
              return prev.map(existingUser =>
                existingUser.id === user.id ? user : existingUser
              );
            }

            return [user, ...prev];
          });
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Failed to load current user:', error);
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setIsAuthLoading(false);
        }
      }
    };

    loadCurrentUser();

    // Listen for Supabase authentication changes.
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        try {
          const user = await authService.getCurrentUser();

          if (!mounted) return;

          setCurrentUser(user);
          setIsAuthenticated(true);

          setUsers(prev => {
            const exists = prev.some(existingUser => existingUser.id === user.id);

            if (exists) {
              return prev.map(existingUser =>
                existingUser.id === user.id ? user : existingUser
              );
            }

            return [user, ...prev];
          });
        } catch (error) {
          console.error('Failed to load authenticated user:', error);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (view = 'welcome') => {
    setAuthModalInitialView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const updateUsersList = (user) => {
    setUsers(prev => {
      const exists = prev.some(existingUser => existingUser.id === user.id);

      if (exists) {
        return prev.map(existingUser =>
          existingUser.id === user.id ? user : existingUser
        );
      }

      return [user, ...prev];
    });
  };

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
    return await authService.loginWithGoogle();
  };

  const loginWithFacebook = async () => {
    throw new Error('Facebook sign-in is not connected yet.');
  };

  const logout = async () => {
    await authService.logout();

    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (updatedFields) => {
    if (!currentUser?.id) {
      throw new Error('No authenticated user found.');
    }

    const updatedUser = await authService.updateProfile(currentUser.id, updatedFields);

    setCurrentUser(updatedUser);
    updateUsersList(updatedUser);

    return updatedUser;
  };

  const getUserById = (id) => {
    return users.find(user => user.id === id) || {
      id,
      name: 'Unknown User',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      location: 'Abuja'
    };
  };

  return (
    <UserContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        users,
        isAuthLoading,
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
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
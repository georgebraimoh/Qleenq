import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth/authService';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const [users, setUsers] = useState(() => {
    try {
      localStorage.removeItem('leenq_all_users');
    } catch (e) {}
    return [];
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialView, setAuthModalInitialView] = useState('welcome');

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Get the current Supabase user when the app starts and load profiles.
  useEffect(() => {
    let mounted = true;

    const loadAllProfiles = async () => {
      try {
        const allProfiles = await authService.fetchProfilesAll();
        if (mounted && allProfiles && allProfiles.length > 0) {
          setUsers(prev => {
            const map = new Map(prev.map(u => [u.id, u]));
            allProfiles.forEach(u => map.set(u.id, u));
            return Array.from(map.values());
          });
        }
      } catch (e) {
        console.warn('Could not load initial profiles:', e);
      }
    };

    loadAllProfiles();

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

  const fetchAndCacheProfiles = async (ids) => {
    if (!ids || (Array.isArray(ids) && ids.length === 0)) return;
    const missing = (Array.isArray(ids) ? ids : [ids]).filter(id => id && !users.some(u => u.id === id));
    if (missing.length === 0) return;

    try {
      const fetched = await authService.fetchProfiles(missing);
      if (fetched && fetched.length > 0) {
        setUsers(prev => {
          const map = new Map(prev.map(u => [u.id, u]));
          fetched.forEach(u => map.set(u.id, u));
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.warn('Could not fetch profiles by IDs:', e.message);
    }
  };

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
    if (!id) return null;
    const found = users.find(user => user.id === id);
    if (found) return found;

    if (currentUser?.id === id) return currentUser;

    fetchAndCacheProfiles([id]);

    return {
      id,
      name: 'Qleenq Member',
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
        getUserById,
        fetchAndCacheProfiles
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
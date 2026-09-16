import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_HANGOUTS } from '../data/hangouts';
import { INITIAL_MESSAGES } from '../data/messages';
import { useUser } from './UserContext';
import { hangoutService } from '../services/hangout/hangoutService';

const LeenQContext = createContext();

const STORAGE_KEY_HANGOUTS = 'leenq_hangouts_list';
const STORAGE_KEY_MESSAGES = 'leenq_messages_map';

export function LeenQProvider({ children }) {
  const { currentUser } = useUser();

  const [hangouts, setHangouts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HANGOUTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return MOCK_HANGOUTS;
  });

  const [messagesMap, setMessagesMap] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_MESSAGES;
  });

  useEffect(() => {
    let isMounted = true;
    const loadSupabaseHangouts = async () => {
      try {
        const fetched = await hangoutService.fetchHangouts();
        if (isMounted && fetched && fetched.length > 0) {
          setHangouts(prev => {
            const fetchedIds = new Set(fetched.map(h => h.id));
            const remainingLocal = prev.filter(h => !fetchedIds.has(h.id));
            return [...fetched, ...remainingLocal];
          });
        }
      } catch (err) {
        console.error('Failed loading hangouts from Supabase:', err);
      }
    };

    loadSupabaseHangouts();
    return () => { isMounted = false; };
  }, [currentUser?.id]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HANGOUTS, JSON.stringify(hangouts));
  }, [hangouts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messagesMap));
  }, [messagesMap]);

  const joinHangout = async (id) => {
    const hangout = hangouts.find(h => h.id === id);
    if (!hangout) return { success: false, reason: "Hangout not found" };

    if (currentUser?.id && hangout.attendeeIds.includes(currentUser.id)) {
      return { success: false, reason: "Already joined" };
    }

    if (hangout.attendeeIds.length >= hangout.maxAttendees) {
      return { success: false, reason: "Capacity full" };
    }

    if (currentUser?.id) {
      try {
        await hangoutService.joinHangout(currentUser.id, id);
      } catch (err) {
        console.warn('Could not persist join to Supabase:', err.message);
      }
    }

    setHangouts(prev => prev.map(h => {
      if (h.id === id) {
        return {
          ...h,
          attendeeIds: Array.from(new Set([...h.attendeeIds, currentUser?.id].filter(Boolean)))
        };
      }
      return h;
    }));

    const sysMsg = {
      id: `sys-${Date.now()}`,
      type: 'system',
      text: `${currentUser?.name || 'A user'} joined the activity.`
    };

    setMessagesMap(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), sysMsg]
    }));

    return { success: true };
  };

  const leaveHangout = async (id) => {
    const hangout = hangouts.find(h => h.id === id);
    if (!hangout) return;

    if (currentUser?.id && hangout.hostId === currentUser.id) {
      alert("As host, you cannot leave your own activity. You can cancel or delete it instead.");
      return;
    }

    if (currentUser?.id) {
      try {
        await hangoutService.leaveHangout(currentUser.id, id);
      } catch (err) {
        console.warn('Could not persist leave to Supabase:', err.message);
      }
    }

    setHangouts(prev => prev.map(h => {
      if (h.id === id) {
        return {
          ...h,
          attendeeIds: h.attendeeIds.filter(userId => userId !== currentUser?.id)
        };
      }
      return h;
    }));

    const sysMsg = {
      id: `sys-${Date.now()}`,
      type: 'system',
      text: `${currentUser?.name || 'A user'} left the activity.`
    };

    setMessagesMap(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), sysMsg]
    }));
  };

  const createHangout = async (newHangoutData) => {
    let newHangout;
    if (currentUser?.id) {
      try {
        newHangout = await hangoutService.createHangout(currentUser.id, newHangoutData);
      } catch (err) {
        console.warn('Supabase create failed, falling back to local creation:', err.message);
      }
    }

    if (!newHangout) {
      const slug = newHangoutData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newId = `${slug}-${Date.now().toString().slice(-4)}`;

      newHangout = {
        id: newId,
        title: newHangoutData.title,
        category: newHangoutData.category,
        location: newHangoutData.location,
        city: "Abuja",
        date: newHangoutData.date,
        time: newHangoutData.time,
        description: newHangoutData.description,
        hostId: currentUser?.id || 'local-user',
        maxAttendees: parseInt(newHangoutData.maxAttendees, 10) || 10,
        attendeeIds: [currentUser?.id || 'local-user'],
        image: newHangoutData.image || "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
        status: "upcoming",
        featured: false,
        isPopular: false
      };
    }

    setHangouts(prev => [newHangout, ...prev]);

    const welcomeMsg = {
      id: `sys-${Date.now()}`,
      type: 'system',
      text: `${currentUser?.name || 'Host'} created the activity and opened the Qleenq Space!`
    };

    setMessagesMap(prev => ({
      ...prev,
      [newHangout.id]: [welcomeMsg]
    }));

    return newHangout;
  };

  const cancelHangout = async (id) => {
    try {
      await hangoutService.cancelHangout(id);
    } catch (err) {
      console.warn('Could not persist cancellation:', err.message);
    }
    setHangouts(prev => prev.map(h => h.id === id ? { ...h, status: 'cancelled' } : h));
  };

  const deleteHangout = async (id) => {
    try {
      await hangoutService.deleteHangout(id);
    } catch (err) {
      console.warn('Could not persist deletion:', err.message);
    }
    setHangouts(prev => prev.filter(h => h.id !== id));
  };

  const sendMessage = (hangoutId, text) => {
    if (!text.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Guest User',
      userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'user'
    };

    setMessagesMap(prev => ({
      ...prev,
      [hangoutId]: [...(prev[hangoutId] || []), newMsg]
    }));
  };

  const getHangoutById = (id) => hangouts.find(h => h.id === id);

  const isAttending = (hangoutId) => {
    const hangout = getHangoutById(hangoutId);
    return hangout && currentUser?.id ? hangout.attendeeIds.includes(currentUser.id) : false;
  };

  return (
    <LeenQContext.Provider value={{
      hangouts,
      messagesMap,
      joinHangout,
      leaveHangout,
      createHangout,
      cancelHangout,
      deleteHangout,
      sendMessage,
      getHangoutById,
      isAttending
    }}>
      {children}
    </LeenQContext.Provider>
  );
}

export function useLeenQ() {
  return useContext(LeenQContext);
}

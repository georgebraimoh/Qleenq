import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_HANGOUTS } from '../data/hangouts';
import { useUser } from './UserContext';
import { hangoutService } from '../services/hangout/hangoutService';
import { supabase } from '../lib/supabase';

const LeenQContext = createContext();

const STORAGE_KEY_HANGOUTS = 'leenq_hangouts_list';

export function LeenQProvider({ children }) {
  const { currentUser } = useUser();

  const [hangouts, setHangouts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HANGOUTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return MOCK_HANGOUTS;
  });

  const [messagesMap, setMessagesMap] = useState({});

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

  const loadSpaceMessages = async (hangoutId) => {
    if (!hangoutId) return [];
    try {
      const fetched = await hangoutService.fetchSpaceMessages(hangoutId);
      setMessagesMap(prev => {
        const existing = prev[hangoutId] || [];
        const fetchedIds = new Set(fetched.map(m => m.id));
        const realtimeOnly = existing.filter(m => !fetchedIds.has(m.id));
        return {
          ...prev,
          [hangoutId]: [...fetched, ...realtimeOnly]
        };
      });
      return fetched;
    } catch (err) {
      console.warn('Could not load space messages from Supabase:', err.message);
      return [];
    }
  };

  const addRealtimeMessage = (hangoutId, formattedMsg) => {
    if (!hangoutId || !formattedMsg || !formattedMsg.id) return;
    setMessagesMap(prev => {
      const existing = prev[hangoutId] || [];
      if (existing.some(m => m.id === formattedMsg.id)) {
        return prev; // Deduplicate by database UUID
      }
      return {
        ...prev,
        [hangoutId]: [...existing, formattedMsg]
      };
    });
  };

  const subscribeToSpaceMessages = (hangoutId) => {
    if (!hangoutId) return () => {};

    const channelName = `space:${hangoutId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hangout_messages',
          filter: `hangout_id=eq.${hangoutId}`
        },
        (payload) => {
          if (payload.new && payload.new.hangout_id === hangoutId) {
            const formatted = hangoutService.formatMessage(payload.new);
            addRealtimeMessage(hangoutId, formatted);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Re-fetch space messages upon connection to prevent gaps
          loadSpaceMessages(hangoutId);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

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

    if (currentUser?.id) {
      try {
        const sysMsg = await hangoutService.sendSpaceMessage({
          hangoutId: id,
          userId: currentUser.id,
          userName: currentUser.name || 'A user',
          userAvatar: currentUser.avatar,
          text: `${currentUser.name || 'A user'} joined the activity.`,
          type: 'system'
        });
        if (sysMsg) addRealtimeMessage(id, sysMsg);
      } catch (e) {
        console.warn('Could not send join system message:', e.message);
      }
    }

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

    if (currentUser?.id) {
      try {
        const sysMsg = await hangoutService.sendSpaceMessage({
          hangoutId: id,
          userId: currentUser.id,
          userName: currentUser.name || 'A user',
          userAvatar: currentUser.avatar,
          text: `${currentUser.name || 'A user'} left the activity.`,
          type: 'system'
        });
        if (sysMsg) addRealtimeMessage(id, sysMsg);
      } catch (e) {
        console.warn('Could not send leave system message:', e.message);
      }
    }
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

    if (currentUser?.id) {
      try {
        const welcomeMsg = await hangoutService.sendSpaceMessage({
          hangoutId: newHangout.id,
          userId: currentUser.id,
          userName: currentUser.name || 'Host',
          userAvatar: currentUser.avatar,
          text: `${currentUser.name || 'Host'} created the activity and opened the Qleenq Space!`,
          type: 'system'
        });
        if (welcomeMsg) addRealtimeMessage(newHangout.id, welcomeMsg);
      } catch (e) {
        console.warn('Could not send welcome system message:', e.message);
      }
    }

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

  const sendMessage = async (hangoutId, text) => {
    if (!text || !text.trim()) return;
    if (!currentUser?.id) {
      throw new Error('You must be signed in to send messages.');
    }

    const insertedMsg = await hangoutService.sendSpaceMessage({
      hangoutId,
      userId: currentUser.id,
      userName: currentUser.name || 'Qleenq User',
      userAvatar: currentUser.avatar,
      text: text.trim(),
      type: 'user'
    });

    if (insertedMsg) {
      addRealtimeMessage(hangoutId, insertedMsg);
    }

    return insertedMsg;
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
      loadSpaceMessages,
      subscribeToSpaceMessages,
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


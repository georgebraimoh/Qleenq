import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { hangoutService } from '../services/hangout/hangoutService';
import { supabase } from '../lib/supabase';

const LeenQContext = createContext();

export function LeenQProvider({ children }) {
  const { currentUser } = useUser();

  const [hangouts, setHangouts] = useState(() => {
    try {
      localStorage.removeItem('leenq_hangouts_list');
    } catch (e) {}
    return [];
  });

  const [messagesMap, setMessagesMap] = useState({});
  const [isHangoutsLoading, setIsHangoutsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadSupabaseHangouts = async () => {
      try {
        const fetched = await hangoutService.fetchHangouts();
        if (isMounted) {
          setHangouts(fetched || []);
        }
      } catch (err) {
        console.error('Failed loading hangouts from Supabase:', err);
      } finally {
        if (isMounted) setIsHangoutsLoading(false);
      }
    };

    loadSupabaseHangouts();
    return () => { isMounted = false; };
  }, [currentUser?.id]);

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

    let channel = null;
    let isCancelled = false;

    const initSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token);
        }
      } catch (err) {
        console.warn('[Qleenq Realtime] Auth token sync notice:', err.message);
      }

      if (isCancelled) return;

      const channelName = `space:${hangoutId}`;

      channel = supabase
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
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Qleenq Realtime] Space channel subscribed: ${hangoutId}`);
            loadSpaceMessages(hangoutId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`[Qleenq Realtime] Space channel error for ${hangoutId}:`, err || status);
          } else if (status === 'TIMED_OUT') {
            console.warn(`[Qleenq Realtime] Space channel timed out for ${hangoutId}`);
          } else if (status === 'CLOSED') {
            console.log(`[Qleenq Realtime] Space channel closed for ${hangoutId}`);
          }
        });
    };

    initSubscription();

    return () => {
      isCancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
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
    if (!currentUser?.id) {
      throw new Error('You must be signed in to host an activity.');
    }

    const newHangout = await hangoutService.createHangout(currentUser.id, newHangoutData);
    setHangouts(prev => [newHangout, ...prev]);

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
    return hangout && currentUser?.id ? (hangout.attendeeIds || []).includes(currentUser.id) : false;
  };

  return (
    <LeenQContext.Provider value={{
      hangouts,
      messagesMap,
      isHangoutsLoading,
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


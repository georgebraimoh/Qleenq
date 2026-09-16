import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_HANGOUTS } from '../data/hangouts';
import { INITIAL_MESSAGES } from '../data/messages';
import { useUser } from './UserContext';

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
    localStorage.setItem(STORAGE_KEY_HANGOUTS, JSON.stringify(hangouts));
  }, [hangouts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messagesMap));
  }, [messagesMap]);

  const joinHangout = (id) => {
    const hangout = hangouts.find(h => h.id === id);
    if (!hangout) return { success: false, reason: "Hangout not found" };

    if (hangout.attendeeIds.includes(currentUser.id)) {
      return { success: false, reason: "Already joined" };
    }

    if (hangout.attendeeIds.length >= hangout.maxAttendees) {
      return { success: false, reason: "Capacity full" };
    }

    // Update hangout attendees
    setHangouts(prev => prev.map(h => {
      if (h.id === id) {
        return {
          ...h,
          attendeeIds: [...h.attendeeIds, currentUser.id]
        };
      }
      return h;
    }));

    // Add system message to space chat
    const sysMsg = {
      id: `sys-${Date.now()}`,
      type: 'system',
      text: `${currentUser.name} joined the activity.`
    };

    setMessagesMap(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), sysMsg]
    }));

    return { success: true };
  };

  const leaveHangout = (id) => {
    const hangout = hangouts.find(h => h.id === id);
    if (!hangout) return;

    if (hangout.hostId === currentUser.id) {
      alert("As host, you cannot leave your own activity. You can cancel or delete it instead.");
      return;
    }

    setHangouts(prev => prev.map(h => {
      if (h.id === id) {
        return {
          ...h,
          attendeeIds: h.attendeeIds.filter(userId => userId !== currentUser.id)
        };
      }
      return h;
    }));

    const sysMsg = {
      id: `sys-${Date.now()}`,
      type: 'system',
      text: `${currentUser.name} left the activity.`
    };

    setMessagesMap(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), sysMsg]
    }));
  };

  const createHangout = (newHangoutData) => {
    const slug = newHangoutData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newId = `${slug}-${Date.now().toString().slice(-4)}`;

    const newHangout = {
      id: newId,
      title: newHangoutData.title,
      category: newHangoutData.category,
      location: newHangoutData.location,
      city: "Abuja",
      date: newHangoutData.date,
      time: newHangoutData.time,
      description: newHangoutData.description,
      hostId: currentUser.id,
      maxAttendees: parseInt(newHangoutData.maxAttendees, 10) || 10,
      attendeeIds: [currentUser.id], // Creator automatically joins
      image: newHangoutData.image || "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
      status: "upcoming",
      featured: false,
      isPopular: false
    };

    setHangouts(prev => [newHangout, ...prev]);

    // Initialize messages space
    const welcomeMsg = {
      id: `sys-${Date.now()}`,
      type: 'system',
      text: `${currentUser.name} created the activity and opened the Qleenq Space!`
    };

    setMessagesMap(prev => ({
      ...prev,
      [newId]: [welcomeMsg]
    }));

    return newHangout;
  };

  const cancelHangout = (id) => {
    setHangouts(prev => prev.map(h => h.id === id ? { ...h, status: 'cancelled' } : h));
  };

  const deleteHangout = (id) => {
    setHangouts(prev => prev.filter(h => h.id !== id));
  };

  const sendMessage = (hangoutId, text) => {
    if (!text.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
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
    return hangout ? hangout.attendeeIds.includes(currentUser.id) : false;
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

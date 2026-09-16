import { supabase } from '../../lib/supabase';

function formatHangout(dbHangout, attendeesList = []) {
  const attendeeIds = attendeesList.map(a => a.user_id);

  // Ensure host is always in attendeeIds if not already present
  if (dbHangout.host_id && !attendeeIds.includes(dbHangout.host_id)) {
    attendeeIds.unshift(dbHangout.host_id);
  }

  return {
    id: dbHangout.id,
    title: dbHangout.title,
    category: dbHangout.category,
    location: {
      placeName: dbHangout.place_name || 'Meeting Location',
      address: dbHangout.address || '',
      city: dbHangout.city || 'Abuja',
      country: dbHangout.country || 'Nigeria',
      countryCode: dbHangout.country_code || 'NG',
      latitude: dbHangout.latitude || 9.0765,
      longitude: dbHangout.longitude || 7.3986
    },
    city: dbHangout.city || 'Abuja',
    date: dbHangout.date,
    time: dbHangout.time,
    description: dbHangout.description,
    hostId: dbHangout.host_id,
    maxAttendees: dbHangout.max_attendees || 10,
    attendeeIds,
    image: dbHangout.image || "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
    status: dbHangout.status || 'upcoming',
    featured: dbHangout.featured || false,
    isPopular: dbHangout.is_popular || false
  };
}

export const hangoutService = {
  formatHangout,

  async uploadHangoutImage(userId, file) {
    if (!file) return null;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw new Error('Selected image exceeds the 5 MB size limit.');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error('Unsupported image format. Please select a JPG, PNG, or WEBP image.');
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${userId || 'guest'}/${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('hangout-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('hangout-images')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  },

  async fetchHangouts() {
    const { data: dbHangouts, error: hangoutsError } = await supabase
      .from('hangouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (hangoutsError) {
      console.warn('Could not fetch hangouts from Supabase:', hangoutsError.message);
      return null;
    }

    const { data: dbAttendees, error: attendeesError } = await supabase
      .from('hangout_attendees')
      .select('*');

    if (attendeesError) {
      console.warn('Could not fetch attendees from Supabase:', attendeesError.message);
    }

    const attendeesByHangout = {};
    (dbAttendees || []).forEach(a => {
      if (!attendeesByHangout[a.hangout_id]) {
        attendeesByHangout[a.hangout_id] = [];
      }
      attendeesByHangout[a.hangout_id].push(a);
    });

    return dbHangouts.map(h => formatHangout(h, attendeesByHangout[h.id] || []));
  },

  async createHangout(userId, newHangoutData) {
    if (!userId) {
      throw new Error('You must be signed in to host an activity.');
    }

    const loc = newHangoutData.location || {};

    const payload = {
      title: newHangoutData.title.trim(),
      category: newHangoutData.category,
      description: newHangoutData.description.trim(),
      host_id: userId,
      date: newHangoutData.date,
      time: newHangoutData.time,
      max_attendees: parseInt(newHangoutData.maxAttendees, 10) || 10,
      image: newHangoutData.image,
      status: 'upcoming',
      featured: false,
      is_popular: false,
      place_name: loc.placeName || 'Meeting Location',
      address: loc.address || '',
      city: loc.city || 'Abuja',
      country: loc.country || 'Nigeria',
      country_code: loc.countryCode || 'NG',
      latitude: loc.latitude || 9.0765,
      longitude: loc.longitude || 7.3986
    };

    const { data: createdHangout, error: createError } = await supabase
      .from('hangouts')
      .insert(payload)
      .select()
      .single();

    if (createError) {
      throw new Error(createError.message);
    }

    // Automatically insert creator into hangout_attendees
    const { error: attendeeError } = await supabase
      .from('hangout_attendees')
      .insert({
        hangout_id: createdHangout.id,
        user_id: userId
      });

    if (attendeeError) {
      console.warn('Auto-join host record notice:', attendeeError.message);
    }

    return formatHangout(createdHangout, [{ user_id: userId }]);
  },

  async joinHangout(userId, hangoutId) {
    if (!userId) throw new Error('Must be signed in to join.');

    const { error } = await supabase
      .from('hangout_attendees')
      .insert({
        hangout_id: hangoutId,
        user_id: userId
      });

    if (error && !error.message.includes('unique constraint')) {
      throw new Error(error.message);
    }
  },

  async leaveHangout(userId, hangoutId) {
    if (!userId) throw new Error('Must be signed in to leave.');

    const { error } = await supabase
      .from('hangout_attendees')
      .delete()
      .eq('hangout_id', hangoutId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async cancelHangout(hangoutId) {
    const { error } = await supabase
      .from('hangouts')
      .update({ status: 'cancelled' })
      .eq('id', hangoutId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async deleteHangout(hangoutId) {
    const { error } = await supabase
      .from('hangouts')
      .delete()
      .eq('id', hangoutId);

    if (error) {
      throw new Error(error.message);
    }
  },

  formatMessage(dbMessage) {
    if (!dbMessage) return null;
    let formattedTime = '';
    if (dbMessage.created_at) {
      try {
        const d = new Date(dbMessage.created_at);
        if (!isNaN(d.getTime())) {
          formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch (e) {
        formattedTime = '';
      }
    }

    return {
      id: dbMessage.id,
      userId: dbMessage.user_id,
      userName: dbMessage.user_name || 'Qleenq User',
      userAvatar: dbMessage.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      text: dbMessage.text || '',
      timestamp: formattedTime,
      createdAt: dbMessage.created_at,
      type: dbMessage.type || 'user'
    };
  },

  async fetchSpaceMessages(hangoutId) {
    if (!hangoutId) return [];

    const { data, error } = await supabase
      .from('hangout_messages')
      .select('*')
      .eq('hangout_id', hangoutId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Could not fetch space messages from Supabase:', error.message);
      return [];
    }

    return (data || []).map(this.formatMessage).filter(Boolean);
  },

  async sendSpaceMessage({ hangoutId, userId, userName, userAvatar, text, type = 'user' }) {
    if (!hangoutId || !userId) {
      throw new Error('Hangout ID and User ID are required to send a message.');
    }

    const trimmedText = (text || '').trim();
    if (!trimmedText) {
      throw new Error('Message content cannot be empty.');
    }

    const payload = {
      hangout_id: hangoutId,
      user_id: userId,
      user_name: userName || 'Qleenq User',
      user_avatar: userAvatar || null,
      text: trimmedText,
      type: type || 'user'
    };

    const { data, error } = await supabase
      .from('hangout_messages')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.formatMessage(data);
  }
};


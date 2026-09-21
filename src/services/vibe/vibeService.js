import { supabase } from '../../lib/supabase';
import { authService } from '../auth/authService';

export const vibeService = {
  /**
   * Fetch all user IDs that followerId is vibing with.
   */
  async fetchVibingUserIds(followerId) {
    if (!followerId) return [];

    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', followerId);

    if (error) {
      console.warn('Could not fetch vibing list from Supabase:', error.message);
      return [];
    }

    return (data || []).map(row => row.following_id);
  },

  /**
   * Vibe with a user (create relationship in public.follows).
   */
  async vibeWithUser(followerId, followingId) {
    if (!followerId || !followingId) {
      throw new Error('Both follower and target user IDs are required.');
    }

    if (followerId === followingId) {
      throw new Error('You cannot vibe with yourself.');
    }

    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique constraint') || error.code === '23505') {
        return true; // Already vibing
      }
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Remove Vibe relationship (delete row from public.follows).
   */
  async unvibeWithUser(followerId, followingId) {
    if (!followerId || !followingId) {
      throw new Error('Both follower and target user IDs are required.');
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },

  /**
   * Fetch full profiles of users that followerId is vibing with.
   */
  async fetchWhoYouVibeWithProfiles(followerId) {
    const followingIds = await this.fetchVibingUserIds(followerId);
    if (!followingIds || followingIds.length === 0) return [];

    return await authService.fetchProfiles(followingIds);
  }
};

/**
 * Google OAuth Authentication Service Provider (Mock / Pluggable Interface)
 * In production, this integrates with Google Identity Services SDK or Firebase/Supabase Auth.
 */

export const googleAuth = {
  async signIn() {
    // Simulate network delay for realistic user feedback
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock Google account payload
    return {
      id: `google-user-${Date.now()}`,
      name: "Alex Danjuma",
      email: "alex.danjuma@gmail.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      provider: "google",
      location: "Wuse 2, Abuja",
      bio: "Tech enthusiast, coffee lover, and weekend photowalker around Abuja.",
      interests: ["Tech", "Coffee", "Photography"]
    };
  }
};

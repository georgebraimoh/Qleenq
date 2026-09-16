/**
 * Facebook OAuth Authentication Service Provider (Mock / Pluggable Interface)
 * In production, this integrates with Facebook SDK / OAuth 2.0 endpoints.
 */

export const facebookAuth = {
  async signIn() {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      id: `fb-user-${Date.now()}`,
      name: "Blessing Adebayo",
      email: "blessing.adebayo@facebook.com",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
      provider: "facebook",
      location: "Maitama, Abuja",
      bio: "Music lover, outdoors enthusiast, and weekend explorer.",
      interests: ["Music", "Outdoors", "Creative"]
    };
  }
};

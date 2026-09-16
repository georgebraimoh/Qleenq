import { googleAuth } from './googleAuth';
import { facebookAuth } from './facebookAuth';

const USERS_DB_KEY = 'leenq_registered_users';

export const authService = {
  getStoredUsers() {
    try {
      const stored = localStorage.getItem(USERS_DB_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  saveUserToDB(user) {
    const users = this.getStoredUsers();
    const existingIndex = users.findIndex(u => u.email === user.email);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  },

  async loginWithEmail(email, password) {
    await new Promise(resolve => setTimeout(resolve, 600));

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const users = this.getStoredUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      // Mock automatic account creation for smooth demo if user doesn't exist yet
      const newUser = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0].replace('.', ' '),
        email,
        username: email.split('@')[0],
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        location: "Wuse 2, Abuja",
        bio: "Discovering activities around Abuja.",
        interests: ["Food", "Music", "Tech"],
        hostedCount: 0,
        attendedCount: 0
      };
      this.saveUserToDB(newUser);
      return newUser;
    }

    if (foundUser.password && foundUser.password !== password) {
      throw new Error("Incorrect password. Please try again.");
    }

    return foundUser;
  },

  async registerWithEmail({ name, email, password, avatar }) {
    await new Promise(resolve => setTimeout(resolve, 700));

    if (!name || !email || !password) {
      throw new Error("Please complete all required fields.");
    }

    const users = this.getStoredUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'),
      avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      location: "Abuja",
      bio: "Joined Qleenq to discover fun activities around the world!",
      interests: [],
      hostedCount: 0,
      attendedCount: 0,
      isNewUser: true
    };

    this.saveUserToDB(newUser);
    return newUser;
  },

  async loginWithGoogle() {
    const user = await googleAuth.signIn();
    this.saveUserToDB(user);
    return user;
  },

  async loginWithFacebook() {
    const user = await facebookAuth.signIn();
    this.saveUserToDB(user);
    return user;
  }
};

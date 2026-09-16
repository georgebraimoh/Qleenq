import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/layout/PageTransition';
import Button from '../components/common/Button';
import FormField from '../components/common/FormField';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { LOCATIONS } from '../data/locations';

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
];

const INTEREST_OPTIONS = [
  "Tech", "Music", "Photography", "Football", "Coffee", "Creative", "Food",
  "Design", "Fitness", "Gaming", "Outdoors", "Sports", "Art", "Movies"
];

export default function EditProfile() {
  const navigate = useNavigate();
  const { currentUser, updateProfile } = useUser();

  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    title: currentUser.title || '',
    location: currentUser.location || 'Wuse 2, Abuja',
    bio: currentUser.bio || '',
    avatar: currentUser.avatar || AVATAR_PRESETS[0],
    interests: currentUser.interests || []
  });

  const [saved, setSaved] = useState(false);

  const toggleInterest = (interest) => {
    setFormData(prev => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter(i => i !== interest)
          : [...prev.interests, interest]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setSaved(true);
    setTimeout(() => {
      navigate(`/profile/${currentUser.username}`);
    }, 600);
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#6F6F6F] hover:text-[#171717] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to profile</span>
        </button>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FF6B4A]">Account Settings</span>
          <h1 className="text-3xl font-extrabold font-heading text-[#171717]">
            Edit Profile
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#E8E6E1] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
          {/* Avatar Selector */}
          <FormField label="Choose Avatar">
            <div className="flex items-center gap-3 pt-2">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setFormData({ ...formData, avatar: url })}
                  className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    formData.avatar === url ? 'border-[#FF6B4A] ring-2 ring-[#FF6B4A]/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </FormField>

          {/* Name & Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Full Name" required>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A]"
              />
            </FormField>

            <FormField label="Headline / Title">
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Web Developer, Architect..."
                className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A]"
              />
            </FormField>
          </div>

          {/* Location */}
          <FormField label="Location in Abuja">
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Wuse 2, Abuja"
              className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A]"
            />
          </FormField>

          {/* Bio */}
          <FormField label="Short Bio" helpText="Keep it friendly and concise.">
            <textarea
              rows="3"
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A]"
            />
          </FormField>

          {/* Interests */}
          <FormField label="Your Interests">
            <div className="flex flex-wrap gap-2 pt-2">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = formData.interests.includes(interest);
                return (
                  <button
                    type="button"
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF6B4A] text-white shadow-xs'
                        : 'bg-[#F7F6F2] text-[#6F6F6F] border border-[#E8E6E1] hover:text-[#171717]'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#E8E6E1] flex items-center justify-between">
            {saved ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Profile updated successfully!
              </span>
            ) : <span />}

            <Button type="submit" variant="primary" size="md">
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}

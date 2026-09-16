import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageTransition from '../components/layout/PageTransition';
import HangoutCard from '../components/hangout/HangoutCard';
import Button from '../components/common/Button';
import ReportModal from '../components/safety/ReportModal';
import { MapPin, Edit3, ShieldCheck, Sparkles, Calendar, LogOut, ShieldAlert } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useLeenQ } from '../context/LeenQContext';

export default function Profile() {
  const { username } = useParams();
  const { users, currentUser, logout, isAuthenticated } = useUser();
  const { hangouts } = useLeenQ();
  const navigate = useNavigate();

  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Find user by username or fallback to current user
  const profileUser = users.find(u => u.username === username) || currentUser;
  const isOwnProfile = profileUser.id === currentUser.id && isAuthenticated;

  // Calculate activities
  const hosted = hangouts.filter(h => h.hostId === profileUser.id);
  const attended = hangouts.filter(h => h.attendeeIds.includes(profileUser.id));

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Report Member Modal */}
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="user"
          targetId={profileUser.id}
          targetTitle={profileUser.name}
        />

        {/* Profile Card Header */}
        <div className="editorial-card p-6 md:p-10 relative overflow-hidden bg-white shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <img
                src={profileUser.avatar}
                alt={profileUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[#F7F6F2] shadow-md shrink-0"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#171717]">
                    {profileUser.name}
                  </h1>
                </div>

                <p className="text-sm font-semibold text-[#FF6B4A]">
                  {profileUser.title || "Community Member"}
                </p>

                <p className="text-xs text-[#6F6F6F] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B4A]" /> {profileUser.location}
                </p>

                <p className="text-sm text-[#171717] max-w-xl leading-relaxed pt-1">
                  "{profileUser.bio}"
                </p>
              </div>
            </div>

            {isOwnProfile ? (
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link to="/edit-profile">
                  <Button variant="outline" size="md" className="gap-2">
                    <Edit3 className="w-4 h-4" />
                    <span>Edit profile</span>
                  </Button>
                </Link>

                <Button
                  onClick={() => {
                    logout();
                    navigate('/explore');
                  }}
                  variant="ghost"
                  size="md"
                  className="gap-2 text-rose-500 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setReportModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-1.5 text-[#6F6F6F] hover:text-rose-600 hover:border-rose-200"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Report member</span>
              </Button>
            )}
          </div>

          {/* Interests Badges */}
          {profileUser.interests && profileUser.interests.length > 0 && (
            <div className="pt-6 mt-6 border-t border-[#E8E6E1] flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6F6F6F] mr-2">
                Interests:
              </span>
              {profileUser.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-[#F7F6F2] text-[#171717] text-xs font-semibold rounded-full border border-[#E8E6E1]"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Clean Stats Row (NO Followers / Vanity metrics!) */}
          <div className="pt-6 mt-6 border-t border-[#E8E6E1] grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-[#F7F6F2] rounded-2xl">
              <span className="text-2xl font-extrabold font-heading text-[#171717]">{hosted.length}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F] block mt-0.5">Hosted</span>
            </div>
            <div className="p-3 bg-[#F7F6F2] rounded-2xl">
              <span className="text-2xl font-extrabold font-heading text-[#171717]">{attended.length}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F] block mt-0.5">Attended</span>
            </div>
            <div className="p-3 bg-[#E8F0E8] rounded-2xl col-span-2">
              <span className="text-xs font-bold text-[#2D5A27] block">Active Member</span>
              <span className="text-[10px] text-[#2D5A27]/80 block mt-0.5">Joined experiences over swiping</span>
            </div>
          </div>
        </div>

        {/* Hosted Activities Section */}
        {hosted.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#FF6B4A]" />
              <h2 className="text-2xl font-bold font-heading text-[#171717]">
                Hosted by {profileUser.name.split(' ')[0]}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hosted.map(hangout => (
                <HangoutCard key={hangout.id} hangout={hangout} />
              ))}
            </div>
          </div>
        )}

        {/* Attended Activities Section */}
        {attended.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#FF6B4A]" />
              <h2 className="text-2xl font-bold font-heading text-[#171717]">
                Activities Attended ({attended.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attended.map(hangout => (
                <HangoutCard key={hangout.id} hangout={hangout} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

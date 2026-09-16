import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/layout/PageTransition';
import HangoutCard from '../components/hangout/HangoutCard';
import EmptyState from '../components/common/EmptyState';
import { Calendar, Shield, CheckCircle2, Compass } from 'lucide-react';
import { useLeenQ } from '../context/LeenQContext';
import { useUser } from '../context/UserContext';

export default function MyHangouts() {
  const { hangouts } = useLeenQ();
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState('upcoming');

  // Filtered lists
  const upcomingJoined = hangouts.filter(h =>
    h.attendeeIds.includes(currentUser.id) &&
    h.hostId !== currentUser.id &&
    h.status === 'upcoming'
  );

  const hostingHangouts = hangouts.filter(h =>
    h.hostId === currentUser.id
  );

  const pastHangouts = hangouts.filter(h =>
    (h.attendeeIds.includes(currentUser.id) || h.hostId === currentUser.id) &&
    h.status === 'completed'
  );

  const getActiveList = () => {
    switch (activeTab) {
      case 'hosting':
        return hostingHangouts;
      case 'past':
        return pastHangouts;
      case 'upcoming':
      default:
        return upcomingJoined;
    }
  };

  const currentList = getActiveList();

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FF6B4A]">
            Your Schedule
          </span>
          <h1 className="text-4xl font-extrabold font-heading text-[#171717]">
            My Activities
          </h1>
          <p className="text-sm text-[#6F6F6F]">
            Manage activities you're attending, hosting, or have enjoyed across Abuja.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E8E6E1] pb-1">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-[#171717] text-white shadow-xs'
                : 'text-[#6F6F6F] hover:text-[#171717] hover:bg-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Upcoming ({upcomingJoined.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hosting')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'hosting'
                ? 'bg-[#171717] text-white shadow-xs'
                : 'text-[#6F6F6F] hover:text-[#171717] hover:bg-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Hosting ({hostingHangouts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'past'
                ? 'bg-[#171717] text-white shadow-xs'
                : 'text-[#6F6F6F] hover:text-[#171717] hover:bg-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Past ({pastHangouts.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        {currentList.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={
              activeTab === 'hosting'
                ? "You haven't created an activity yet"
                : activeTab === 'past'
                ? "No completed activities yet"
                : "Your calendar looks a little empty"
            }
            description="Find something fun happening around Abuja or create your own casual meetup."
            actionLabel="Explore activities"
            onAction={() => window.location.href = '/explore'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {currentList.map(hangout => (
              <HangoutCard key={hangout.id} hangout={hangout} />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

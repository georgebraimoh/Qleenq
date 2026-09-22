import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Users, ArrowLeft, MessageSquare, Check, AlertCircle, Share2, MoreHorizontal, ShieldAlert, ExternalLink } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import Button from '../components/common/Button';
import HostCard from '../components/hangout/HostCard';
import AvatarStack from '../components/common/AvatarStack';
import EmptyState from '../components/common/EmptyState';
import ShareModal from '../components/common/ShareModal';
import ReportModal from '../components/safety/ReportModal';
import SafetyReminder from '../components/safety/SafetyReminder';
import { useQleenq } from '../context/QleenqContext';
import { useUser } from '../context/UserContext';
import { useLocationContext } from '../context/LocationContext';

export default function HangoutDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getHangoutById, joinHangout, leaveHangout, isAttending } = useQleenq();
  const { getUserById, currentUser, isAuthenticated, openAuthModal } = useUser();
  const { getDistanceFromActive } = useLocationContext();

  const [isJoining, setIsJoining] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const hangout = getHangoutById(id);

  if (!hangout) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto px-4 py-20">
          <EmptyState
            icon={AlertCircle}
            title="Something went sideways"
            description="We couldn't load this Hangout. It may have been removed or doesn't exist."
            actionLabel="Back to explore"
            onAction={() => navigate('/explore')}
          />
        </div>
      </PageTransition>
    );
  }

  const attending = isAttending(hangout.id);
  const isHost = Boolean(currentUser?.id && hangout.hostId === currentUser.id);
  const isFull = hangout.attendeeIds ? hangout.attendeeIds.length >= hangout.maxAttendees : false;

  const formattedDate = new Date(hangout.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const locObj = typeof hangout.location === 'object' ? hangout.location : {
    placeName: hangout.location,
    address: 'Meeting Point',
    city: hangout.city || 'Local Area',
    country: hangout.country || 'Global'
  };

  const distanceKm = getDistanceFromActive(locObj.latitude, locObj.longitude);

  const handleJoinClick = async () => {
    if (!isAuthenticated) {
      openAuthModal('welcome');
      return;
    }

    setIsJoining(true);
    try {
      await joinHangout(hangout.id);
    } catch (err) {
      console.error('Error joining Hangout:', err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveClick = async () => {
    if (window.confirm("Are you sure you want to leave this Hangout?")) {
      try {
        await leaveHangout(hangout.id);
      } catch (err) {
        console.error('Error leaving Hangout:', err);
      }
    }
  };

  const capacityPercentage = Math.min(100, Math.round((hangout.attendeeIds.length / hangout.maxAttendees) * 100));

  return (
    <PageTransition>
      <div className="pb-24">
        {/* Share & Report Modals */}
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          hangout={hangout}
        />

        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="activity"
          targetId={hangout.id}
          targetTitle={hangout.title}
        />

        {/* Back Navigation Bar & Action Controls */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#6F6F6F] hover:text-[#171717] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Back to discovery</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShareModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-[#800020]" />
              <span>Share Hangout</span>
            </Button>

            <button
              onClick={() => setReportModalOpen(true)}
              className="p-2 rounded-full text-[#6F6F6F] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer pressable"
              title="Report Concern"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Cover Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8">
          <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden shadow-lg border border-[#E8E6E1] img-zoom">
            <img
              src={hangout.image}
              alt={hangout.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute top-6 left-6 flex gap-2">
              <span className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-white text-[#171717] rounded-full shadow-md">
                {hangout.category}
              </span>
              {isFull && (
                <span className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-rose-500 text-white rounded-full shadow-md">
                  Full Capacity
                </span>
              )}
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                <MapPin className="w-4 h-4 text-[#800020]" />
                <span>
                  {locObj.placeName || locObj.address}
                  {[locObj.city, locObj.country].filter(Boolean).length > 0 && (
                    ` · ${[locObj.city, locObj.country].filter(Boolean).join(', ')}`
                  )}
                </span>
                {distanceKm !== null && (
                  <span className="bg-stone-900/80 px-2 py-0.5 rounded-full text-white text-[10px]">
                    {distanceKm} km away
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold font-heading text-white leading-tight">
                {hangout.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content Article & Sidebar Layout */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Article Body */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Meta Info Box */}
            <div className="editorial-surface p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FDF0F2] text-[#800020] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F6F6F]">Date</span>
                  <p className="text-sm font-bold text-[#171717] font-heading">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FDF0F2] text-[#800020] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F6F6F]">Time</span>
                  <p className="text-sm font-bold text-[#171717] font-heading">{hangout.time}</p>
                </div>
              </div>

              <div className="flex items-[#800020] items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FDF0F2] text-[#800020] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F6F6F]">Venue</span>
                  <p className="text-sm font-bold text-[#171717] font-heading truncate">{locObj.placeName || locObj.address}</p>
                  {locObj.address && locObj.address !== locObj.placeName && (
                    <p className="text-[10px] text-[#6F6F6F]">{locObj.address}</p>
                  )}
                  {(hangout.googleMapsUrl || locObj.googleMapsUrl) && (
                    <a
                      href={hangout.googleMapsUrl || locObj.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#800020] hover:bg-[#600018] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Google Maps</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#800020]">About this Hangout</h3>
              <p className="text-base text-[#171717] leading-relaxed whitespace-pre-line">
                {hangout.description}
              </p>
            </div>

            {/* Unobtrusive Safety Reminder Card */}
            <SafetyReminder mode="details" />

            {/* Host Profile Card */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#800020]">Organizer</h3>
              <HostCard hostId={hangout.hostId} />
            </div>

            {/* Attendee Roster Section */}
            <div className="space-y-4 pt-4 border-t border-[#E8E6E1]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#800020]">Who's Going</h3>
                  <p className="text-sm font-bold text-[#171717] font-heading mt-0.5">
                    {hangout.attendeeIds.length} of {hangout.maxAttendees} confirmed attendees
                  </p>
                </div>
                <span className="text-xs font-bold text-[#800020]">{capacityPercentage}% Full</span>
              </div>

              {/* Progress gauge bar */}
              <div className="w-full h-2 bg-[#E8E6E1] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#800020] rounded-full transition-all duration-500"
                  style={{ width: `${capacityPercentage}%` }}
                />
              </div>

              {/* Attendee Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {hangout.attendeeIds.map(userId => {
                  const user = getUserById(userId);
                  return (
                    <Link
                      key={user.id}
                      to={`/profile/${user.username}`}
                      className="p-3 bg-white border border-[#E8E6E1] rounded-2xl flex items-center gap-3 hover:border-[#D6D2C9] hover:-translate-y-0.5 hover:shadow-sm transition-all pressable"
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#171717] truncate">{user.name}</p>
                        <p className="text-[10px] text-[#6F6F6F] truncate">{user.location}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar CTA Card (Desktop) */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="editorial-surface p-6 space-y-6 shadow-xl">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6F6F6F]">Hangout Status</span>
                <div className="text-2xl font-bold font-heading text-[#171717]">
                  {attending ? (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-emerald-600 flex items-center gap-1.5"
                    >
                      <Check className="w-6 h-6 text-emerald-600 stroke-[3]" /> You're going
                    </motion.span>
                  ) : isFull ? (
                    <span className="text-rose-500">Hangout Full</span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <motion.span
                        key={hangout.maxAttendees - hangout.attendeeIds.length}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-bold text-[#800020]"
                      >
                        {hangout.maxAttendees - hangout.attendeeIds.length}
                      </motion.span>
                      <span>spots remaining</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {attending ? (
                  <>
                    <Link to={`/hangout/${hangout.id}/space`}>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                        <Button variant="primary" size="lg" fullWidth className="gap-2 shadow-md">
                          <MessageSquare className="w-5 h-5" />
                          <span>Enter Qleenq Space</span>
                        </Button>
                      </motion.div>
                    </Link>

                    {!isHost && (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handleLeaveClick}
                        className="w-full text-xs font-semibold text-rose-500 hover:underline py-1 cursor-pointer"
                      >
                        Leave Hangout
                      </motion.button>
                    )}
                  </>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      onClick={handleJoinClick}
                      disabled={isJoining || isFull}
                      variant="primary"
                      size="lg"
                      fullWidth
                      showArrow={!isFull && !isJoining}
                    >
                      {isJoining ? 'Joining...' : isFull ? 'Capacity Full' : 'Join Hangout'}
                    </Button>
                  </motion.div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E8E6E1] space-y-2 text-xs text-[#6F6F6F]">
                <p className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" /> Free to join
                </p>
                <p className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" /> Automatic access to Qleenq Space
                </p>
                <p className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" /> Temporary room (No permanent group)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom CTA Bar */}
        <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white border-t border-[#E8E6E1] p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#6F6F6F] uppercase font-bold tracking-wider">Status</span>
            <p className="text-sm font-bold text-[#171717] font-heading">
              {attending ? "You're going ✓" : `${hangout.attendeeIds.length}/${hangout.maxAttendees} going`}
            </p>
          </div>

          {attending ? (
            <Link to={`/hangout/${hangout.id}/space`}>
              <Button variant="primary" size="md" className="gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>Open Space</span>
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleJoinClick}
              disabled={isJoining || isFull}
              variant="primary"
              size="md"
            >
              {isJoining ? 'Joining...' : isFull ? 'Full' : 'Join Hangout'}
            </Button>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageTransition from '../components/layout/PageTransition';
import SpaceHeader from '../components/space/SpaceHeader';
import ChatMessage from '../components/space/ChatMessage';
import ChatInput from '../components/space/ChatInput';
import Button from '../components/common/Button';
import ReportModal from '../components/safety/ReportModal';
import { Lock, ArrowLeft, Users, ShieldAlert, LogOut } from 'lucide-react';
import { useLeenQ } from '../context/LeenQContext';
import { useUser } from '../context/UserContext';

export default function HangoutSpace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getHangoutById, messagesMap, sendMessage, loadSpaceMessages, subscribeToSpaceMessages, isAttending, isHangoutsLoading, joinHangout, leaveHangout } = useLeenQ();
  const { currentUser, isAuthLoading } = useUser();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Loading guard while Supabase restores authentication session or fetches hangouts
  if (isAuthLoading || (!getHangoutById(id) && isHangoutsLoading)) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto p-10 text-center space-y-4 my-10">
          <div className="w-8 h-8 border-4 border-[#FF6B4A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#6F6F6F]">Checking space access...</p>
        </div>
      </PageTransition>
    );
  }

  const hangout = getHangoutById(id);
  const roomMessages = messagesMap[id] || [];
  const attending = hangout ? isAttending(hangout.id) : false;

  useEffect(() => {
    if (!id || !attending) return;

    loadSpaceMessages(id);
    const unsubscribe = subscribeToSpaceMessages(id);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id, attending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages.length]);

  if (!hangout) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto p-10 text-center space-y-4 my-10">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold font-heading">Activity not found</h2>
          <Button onClick={() => navigate('/explore')}>Return to Explore</Button>
        </div>
      </PageTransition>
    );
  }

  // RESTRICTED ACCESS CHECK FOR NON-ATTENDEES
  if (!attending) {
    return (
      <PageTransition>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#E8E6E1] rounded-3xl p-8 text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[#FFF0ED] text-[#FF6B4A] flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF6B4A]">
                Qleenq Space Access
              </span>
              <h2 className="text-2xl font-bold font-heading text-[#171717]">
                Attendees Only
              </h2>
              <p className="text-sm text-[#6F6F6F] leading-relaxed">
                The Qleenq Space for <strong className="text-[#171717]">"{hangout.title}"</strong> is exclusive to confirmed attendees. Join the activity to communicate with attendees.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={() => {
                  joinHangout(hangout.id);
                }}
                variant="primary"
                size="lg"
                fullWidth
                showArrow
              >
                Join activity now
              </Button>

              <button
                onClick={() => navigate(`/hangout/${hangout.id}`)}
                className="text-xs font-semibold text-[#6F6F6F] hover:text-[#171717] block mx-auto pt-2 cursor-pointer"
              >
                View activity details
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const handleSend = async (text) => {
    try {
      await sendMessage(hangout.id, text);
    } catch (err) {
      console.error('Failed to send space message:', err);
    }
  };

  const handleLeaveActivity = () => {
    if (window.confirm("Are you sure you want to leave this activity? You will lose access to the Qleenq Space.")) {
      leaveHangout(hangout.id);
      navigate('/explore');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-[#F7F6F2]">
        {/* Report Modal */}
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="space"
          targetId={hangout.id}
          targetTitle={hangout.title}
        />

        {/* Room Header */}
        <SpaceHeader hangout={hangout} />

        {/* Temporary Room Info & Action Bar */}
        <div className="bg-[#E8F0E8] border-b border-[#D5E4D5] px-4 py-2 flex flex-wrap items-center justify-between text-xs text-[#2D5A27] font-medium gap-2">
          <span>💬 Temporary Qleenq Space — Conversation belongs to this activity only.</span>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReportModalOpen(true)}
              className="hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>

            {currentUser?.id && hangout.hostId !== currentUser.id && (
              <button
                onClick={handleLeaveActivity}
                className="hover:underline text-rose-600 flex items-center gap-1 font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave</span>
              </button>
            )}
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 overflow-y-auto space-y-2 pb-24">
          {roomMessages.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#6F6F6F]">
              No messages yet. Say hello to the hangout!
            </div>
          ) : (
            roomMessages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwnMessage={Boolean(currentUser?.id && msg.userId === currentUser.id)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Message Input Bar */}
        <div className="sticky bottom-0 z-20 max-w-4xl w-full mx-auto w-full shadow-lg">
          <ChatInput onSendMessage={handleSend} />
        </div>
      </div>
    </PageTransition>
  );
}

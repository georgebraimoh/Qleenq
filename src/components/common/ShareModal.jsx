import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useToast } from './Toast';
import { Copy, Check, Share2, Send } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, hangout }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!hangout) return null;

  const locName = typeof hangout.location === 'object'
    ? `${hangout.location.placeName}, ${hangout.location.city}`
    : (hangout.location || 'Abuja');

  const formattedDate = hangout.date
    ? new Date(hangout.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    : hangout.date;

  const shareUrl = `${window.location.origin}/hangout/${hangout.id}`;

  const whatsappMessage = `🎉 Join me at "${hangout.title}" on Qleenq!\n\n📍 ${locName}\n📅 ${formattedDate || ''}${hangout.time ? ` at ${hangout.time}` : ''}\n\nCome through and let's have a good time!\n\n👉 ${shareUrl}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out "${hangout.title}" on Qleenq!`)}&url=${encodeURIComponent(shareUrl)}`;

  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast("Link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: hangout.title,
        text: `🎉 Join me at "${hangout.title}" on Qleenq!`,
        url: shareUrl
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error opening share sheet:', err);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Hangout">
      <div className="space-y-6 pt-2">
        {/* Activity Summary Badge */}
        <div className="p-4 bg-[#F7F6F2] rounded-2xl flex items-center gap-4 border border-[#E8E6E1]">
          <img
            src={hangout.image}
            alt={hangout.title}
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-[#800020] tracking-wider">
              {hangout.category}
            </span>
            <h4 className="font-heading font-bold text-sm text-[#171717] truncate">
              {hangout.title}
            </h4>
            <p className="text-xs text-[#6F6F6F] truncate">
              📍 {locName}
            </p>
          </div>
        </div>

        {/* Browser Native Web Share API Button */}
        {canNativeShare && (
          <Button
            type="button"
            onClick={handleNativeShare}
            variant="primary"
            size="md"
            fullWidth
            className="gap-2 shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via device (Apps)</span>
          </Button>
        )}

        {/* Share Link Copy Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
            Hangout Share Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-xs text-[#171717] font-mono focus:outline-none select-all"
            />
            <Button
              onClick={handleCopy}
              variant={copied ? 'secondary' : 'primary'}
              size="md"
              className="shrink-0 gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="pt-2 border-t border-[#E8E6E1] space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6F6F6F]">
            Share directly via
          </p>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable px-4 py-3 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Twitter / X</span>
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}

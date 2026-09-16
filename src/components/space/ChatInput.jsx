import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

export default function ChatInput({ onSendMessage, disabled = false }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
  };

  const isCanSend = text.trim().length > 0 && !disabled;

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2 p-2.5 bg-white border-t border-[#E8E6E1]">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="Say something to the hangout..."
        className="w-full px-5 py-3 text-sm bg-[#F7F6F2] border border-transparent rounded-full text-[#171717] placeholder-[#6F6F6F] focus:outline-none focus:bg-white focus:border-[#800020]/40 transition-all disabled:opacity-50"
      />
      <motion.button
        type="submit"
        disabled={!isCanSend}
        whileHover={isCanSend ? { scale: 1.05 } : {}}
        whileTap={isCanSend ? { scale: 0.92 } : {}}
        className="w-11 h-11 rounded-full bg-[#800020] hover:bg-[#69001A] text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
        aria-label="Send message"
      >
        <Send className="w-4 h-4 ml-0.5" />
      </motion.button>
    </form>
  );
}

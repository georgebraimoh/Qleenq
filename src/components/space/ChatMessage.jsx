import React from 'react';
import { motion } from 'framer-motion';

export default function ChatMessage({ message, isOwnMessage }) {
  if (message.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-3 text-center"
      >
        <span className="inline-block px-3.5 py-1 text-xs font-medium text-[#6F6F6F] bg-[#E8F0E8] text-[#2D5A27] rounded-full">
          {message.text}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 my-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
    >
      <img
        src={message.userAvatar}
        alt={message.userName}
        className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#E8E6E1]"
      />
      <div className={`max-w-[78%] md:max-w-[65%] space-y-1 ${isOwnMessage ? 'items-end text-right' : ''}`}>
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-bold text-[#171717]">{message.userName}</span>
          <span className="text-[10px] text-[#6F6F6F]">{message.timestamp}</span>
        </div>
        <div
          className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
            isOwnMessage
              ? 'bg-[#FF6B4A] text-white rounded-tr-xs shadow-xs'
              : 'bg-white text-[#171717] border border-[#E8E6E1] rounded-tl-xs shadow-xs'
          }`}
        >
          {message.text}
        </div>
      </div>
    </motion.div>
  );
}

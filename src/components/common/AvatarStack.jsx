import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';

export default function AvatarStack({ attendeeIds = [], maxVisible = 4, size = 'md' }) {
  const { getUserById } = useUser();

  const attendees = attendeeIds.map(id => getUserById(id));
  const visible = attendees.slice(0, maxVisible);
  const remaining = attendees.length - maxVisible;

  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-10 h-10 border-2'
  };

  return (
    <div className="flex items-center space-x-[-8px]">
      <AnimatePresence>
        {visible.map((user, idx) => (
          <motion.img
            key={user.id || idx}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ y: -3, scale: 1.15, zIndex: 30 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
            src={user.avatar}
            alt={user.name}
            title={user.name}
            className={`${sizeClasses[size]} rounded-full border-white object-cover bg-stone-200 shadow-xs cursor-pointer relative`}
          />
        ))}
      </AnimatePresence>
      {remaining > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${sizeClasses[size]} rounded-full border-white bg-stone-900 text-white font-medium text-xs flex items-center justify-center shadow-xs z-10`}
        >
          +{remaining}
        </motion.div>
      )}
    </div>
  );
}

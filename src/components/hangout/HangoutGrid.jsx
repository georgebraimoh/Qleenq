import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HangoutCard from './HangoutCard';
import EmptyState from '../common/EmptyState';

export default function HangoutGrid({ hangouts = [], onResetFilters }) {
  if (hangouts.length === 0) {
    return (
      <EmptyState
        title="No activities found"
        description="Try adjusting your category or location filters to explore more activities around the world."
        actionLabel="Clear all filters"
        onAction={onResetFilters}
      />
    );
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
    >
      <AnimatePresence mode="popLayout">
        {hangouts.map((hangout, index) => (
          <HangoutCard
            key={hangout.id}
            hangout={hangout}
            featured={index === 0 && hangouts.length > 3}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowUpRight, Navigation } from 'lucide-react';
import AvatarStack from '../common/AvatarStack';
import { useUser } from '../../context/UserContext';
import { useLocationContext } from '../../context/LocationContext';

export default function HangoutCard({ hangout, featured = false }) {
  const { getUserById } = useUser();
  const { getDistanceFromActive } = useLocationContext();

  const formattedDate = new Date(hangout.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const isFull = hangout.attendeeIds.length >= hangout.maxAttendees;

  // Handle structured vs fallback location objects safely
  const locObj = typeof hangout.location === 'object' ? hangout.location : {
    placeName: hangout.location,
    city: hangout.city || 'Local',
    country: hangout.country || 'Global'
  };

  const distanceKm = getDistanceFromActive(locObj.latitude, locObj.longitude);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`group editorial-card overflow-hidden flex flex-col justify-between cursor-pointer ${
        featured ? 'md:col-span-2 md:grid md:grid-cols-2 md:items-stretch' : ''
      }`}
    >
      {/* Cover Image Container */}
      <div className={`relative overflow-hidden ${featured ? 'h-64 md:h-full' : 'h-52'}`}>
        <img
          src={hangout.image}
          alt={hangout.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        
        {/* Category Pill & Capacity */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
          <span className="px-3 py-1 text-xs font-extrabold tracking-wider bg-[#171717] text-white rounded-full shadow-xs">
            {hangout.category}
          </span>
          {isFull && (
            <span className="px-3 py-1 text-xs font-extrabold tracking-wider uppercase bg-[#E2522B] text-white rounded-full shadow-xs">
              Full Capacity
            </span>
          )}
        </div>

        {/* Distance Badge if available */}
        {distanceKm !== null && (
          <div className="absolute top-4 right-4 z-10 bg-[#F4EFE6] text-[#171717] text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-[#EFE8DB]">
            <Navigation className="w-3 h-3 text-[#E2522B] fill-[#E2522B]" />
            <span>{distanceKm} km away</span>
          </div>
        )}

        {/* Date Tag */}
        <div className="absolute bottom-4 left-4 z-10 text-white text-xs font-bold flex items-center gap-1.5 drop-shadow-md">
          <Calendar className="w-3.5 h-3.5 text-[#E2522B]" />
          <span>{formattedDate} · {hangout.time}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6F6F6F] mb-2">
            <MapPin className="w-3.5 h-3.5 text-[#E2522B] shrink-0" />
            <span className="truncate">{locObj.placeName} · {locObj.city}, {locObj.country}</span>
          </div>

          <h3 className="text-xl font-bold font-heading text-[#171717] group-hover:text-[#E2522B] transition-colors line-clamp-2 leading-tight">
            {hangout.title}
          </h3>

          <p className="mt-2 text-sm text-[#6F6F6F] line-clamp-2 leading-relaxed">
            {hangout.description}
          </p>
        </div>

        {/* Footer info: Attendees & Link CTA */}
        <div className="pt-4 border-t border-[#EFE8DB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarStack attendeeIds={hangout.attendeeIds} maxVisible={3} size="sm" />
            <div className="text-xs text-[#6F6F6F] font-semibold">
              <span className="font-extrabold text-[#171717]">{hangout.attendeeIds.length}</span> / {hangout.maxAttendees} going
            </div>
          </div>

          <Link
            to={`/hangout/${hangout.id}`}
            className="w-9 h-9 rounded-full bg-[#FFF7EC] border border-[#EFE8DB] group-hover:bg-[#E2522B] group-hover:border-[#E2522B] group-hover:text-white text-[#171717] flex items-center justify-center transition-all duration-200 shadow-xs"
            aria-label={`View details for ${hangout.title}`}
          >
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

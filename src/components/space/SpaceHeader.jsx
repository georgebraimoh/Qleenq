import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Info } from 'lucide-react';
import AvatarStack from '../common/AvatarStack';

export default function SpaceHeader({ hangout }) {
  const navigate = useNavigate();

  const formattedDate = hangout?.date ? new Date(hangout.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }) : '';

  const locObj = typeof hangout?.location === 'object' ? hangout.location : {
    placeName: hangout?.location || 'Meeting Location',
    city: hangout?.city || 'Local Area'
  };

  return (
    <div className="bg-white border-b border-[#E8E6E1] p-4 md:px-6 sticky top-0 z-20 shadow-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full text-[#6F6F6F] hover:bg-[#F7F6F2] hover:text-[#171717] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#FF6B4A] bg-[#FFF0ED] px-2 py-0.5 rounded-full">
                Qleenq Space
              </span>
              <span className="text-xs text-[#6F6F6F] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#FF6B4A]" /> {locObj.placeName || locObj.city}
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold font-heading text-[#171717] leading-tight">
              {hangout.title}
            </h1>
            <p className="text-xs text-[#6F6F6F] flex items-center gap-2 mt-0.5">
              <span>{formattedDate} · {hangout.time}</span>
              <span>•</span>
              <span className="font-semibold text-[#171717]">{(hangout?.attendeeIds || []).length} going</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AvatarStack attendeeIds={hangout?.attendeeIds || []} maxVisible={3} size="md" />
          <Link
            to={`/hangout/${hangout.id}`}
            className="p-2 rounded-full text-[#6F6F6F] hover:bg-[#F7F6F2] hover:text-[#171717] transition-colors hidden sm:flex items-center gap-1 text-xs font-semibold"
            title="View Details"
          >
            <Info className="w-4 h-4" />
            <span>Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

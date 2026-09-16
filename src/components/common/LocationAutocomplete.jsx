import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Navigation, Check, X, Loader2 } from 'lucide-react';
import { locationService } from '../../services/location/locationService';

export default function LocationAutocomplete({
  value,
  onSelectLocation,
  placeholder = "Search for a place, venue, or address..."
}) {
  const [query, setQuery] = useState(value ? (value.placeName || value) : '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value && typeof value === 'object' && value.placeName) {
      setQuery(value.placeName);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);

    if (text.trim().length >= 2) {
      const matches = locationService.searchPlaces(text);
      setSuggestions(matches);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (place) => {
    setQuery(place.placeName);
    setIsOpen(false);
    onSelectLocation(place);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await locationService.getCurrentLocation();
      setQuery("Near Your Current Location");
      onSelectLocation(loc);
    } catch (err) {
      alert("Could not access your location. Please type your location manually.");
    } finally {
      setIsLocating(false);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onSelectLocation(null);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#E2522B]">
          <MapPin className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setSuggestions(locationService.searchPlaces(query));
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-24 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm text-[#171717] placeholder-[#6F6F6F] focus:outline-none focus:bg-white focus:border-[#E2522B] shadow-xs transition-all"
        />

        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-[#6F6F6F] hover:text-[#171717] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="px-2.5 py-1.5 bg-white border border-[#E8E6E1] hover:border-[#E2522B] text-[#171717] hover:text-[#E2522B] rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Use my current location"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E2522B]" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-[#E2522B]" />
            )}
            <span className="hidden sm:inline">Near me</span>
          </button>
        </div>
      </div>

      {/* Suggestion Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 mt-2 bg-white border border-[#E8E6E1] rounded-2xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto"
          >
            {/* Option to use geolocation */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="w-full px-4 py-3 bg-[#FDF0EC] hover:bg-[#FBDEC6] text-[#E2522B] text-xs font-bold text-left flex items-center gap-2 border-b border-[#E8E6E1] transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <span>Use my current location (GPS)</span>
            </button>

            {suggestions.map((place, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleSelect(place)}
                className="w-full px-4 py-3 text-left hover:bg-[#F7F6F2] transition-colors border-b border-[#E8E6E1] last:border-b-0 flex items-start justify-between cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#171717] font-heading">{place.placeName}</p>
                  <p className="text-[10px] text-[#6F6F6F]">{place.address} · {place.city}, {place.country}</p>
                </div>
                <span className="text-[10px] font-semibold text-[#E2522B] bg-[#FDF0EC] px-2 py-0.5 rounded-full shrink-0">
                  {place.city}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

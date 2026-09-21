import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Calendar, Plus, User, LogOut, LogIn, ChevronDown, MapPin, Navigation, Search, ShieldCheck } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useLocationContext } from '../../context/LocationContext';
import Button from '../common/Button';
import NotificationDropdown from '../common/NotificationDropdown';

export default function Navbar() {
  const { currentUser, isAuthenticated, openAuthModal, logout } = useUser();
  const { activeSearchLocation, userLocation } = useLocationContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isSpacePage = location.pathname.endsWith('/space');
  if (isSpacePage) return null;

  const handleCreateClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openAuthModal('welcome');
    }
  };

  const handleMyHangoutsClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openAuthModal('welcome');
    }
  };

  const handleLocationClick = () => {
    if (location.pathname !== '/explore') {
      navigate('/explore');
    }
  };

  const activePlaceName = activeSearchLocation?.placeName || userLocation?.placeName || 'Anywhere';

  const navLinks = [
    { path: '/explore', label: 'Explore', icon: Compass },
    { path: '/my-hangouts', label: 'My Activities', icon: Calendar, onClick: handleMyHangoutsClick },
    { path: '/safety', label: 'Safety', icon: ShieldCheck }
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FAF4F5]/90 backdrop-blur-md border-b border-[#EFE8DB] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Active Location Indicator */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: -3 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-2xl bg-[#800020] flex items-center justify-center text-[#FAF4F5] shadow-md shadow-[#800020]/25"
            >
              <span className="font-heading font-extrabold text-xl tracking-tighter">Q</span>
            </motion.div>
            <div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-[#171717]">
                Qleen<span className="text-[#800020]">q</span>
              </span>
            </div>
          </Link>

          {/* Active Location Indicator */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleLocationClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4EFE6] border border-[#EFE8DB] text-[#171717] font-bold rounded-full text-xs shadow-xs cursor-pointer transition-transform"
            title="Location Discovery"
          >
            <MapPin className="w-3.5 h-3.5 text-[#800020]" />
            <span className="max-w-[140px] truncate">{activePlaceName}</span>
          </motion.button>
        </div>

        {/* Desktop Nav Links with Animated Active Indicator */}
        <nav className="hidden md:flex items-center gap-2 relative">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={item.onClick}
                className={`relative px-4 py-2 text-sm font-bold transition-colors flex items-center gap-1.5 z-10 ${
                  isActive ? 'text-[#800020]' : 'text-[#6F6F6F] hover:text-[#171717]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="navbarActiveIndicator"
                    className="absolute inset-0 bg-[#800020]/10 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Mobile Notification Bell & Action Controls */}
        <div className="flex md:hidden items-center gap-2">
          <NotificationDropdown />
        </div>

        {/* Desktop Action & User Auth State */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/create" onClick={handleCreateClick}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
              <Button variant="primary" size="md" className="gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" />
                <span>Create Activity</span>
              </Button>
            </motion.div>
          </Link>

          <NotificationDropdown />

          {isAuthenticated ? (
            /* User Dropdown Menu */
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-white transition-colors border border-transparent hover:border-[#E8E6E1] cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover border border-[#E8E6E1] shadow-xs"
                />
                <ChevronDown className={`w-3.5 h-3.5 text-[#6F6F6F] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-48 bg-white border border-[#E8E6E1] rounded-2xl shadow-xl py-2 z-50 text-xs"
                  >
                    <div className="px-4 py-2 border-b border-[#E8E6E1]">
                      <p className="font-bold text-[#171717] truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-[#6F6F6F] truncate">{currentUser.email || currentUser.location}</p>
                    </div>

                    <Link
                      to={`/profile/${currentUser.username}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#F7F6F2] text-[#171717] font-semibold transition-colors"
                    >
                      <User className="w-4 h-4 text-[#800020]" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/safety"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#F7F6F2] text-[#171717] font-semibold transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#2D5A27]" />
                      <span>Safety & Trust</span>
                    </Link>

                    <div className="border-t border-[#E8E6E1] mt-1 pt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          navigate('/explore');
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-semibold cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Sign In Button for Guests */
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
              <Button
                onClick={() => openAuthModal('login')}
                variant="outline"
                size="md"
                className="gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}

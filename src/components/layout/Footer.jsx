import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Heart, Globe, Compass, Plus, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const location = useLocation();

  if (location.pathname.endsWith('/space')) return null;

  return (
    <footer className="bg-white border-t border-[#EFE8DB] mt-20 pb-20 md:pb-12 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#EFE8DB]">
          {/* Col 1: Brand & Philosophy */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#800020] flex items-center justify-center text-white font-heading font-bold">
                Q
              </div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-[#171717]">
                Qleen<span className="text-[#800020]">q</span>
              </span>
            </div>
            <p className="text-[#6F6F6F] text-sm leading-relaxed max-w-md">
              Find your people. Find something to do. Turning “we should do something sometime” into real-world experiences attached to coordinates everywhere.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#171717] bg-[#FAF4F5] px-3 py-1.5 rounded-full border border-[#EFE8DB]">
              <Globe className="w-3.5 h-3.5 text-[#800020]" />
              <span>Location-First Social Discovery</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-[#6F6F6F]">
              <li>
                <Link to="/explore" className="hover:text-[#800020] transition-colors flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Explore Activities</span>
                </Link>
              </li>
              <li>
                <Link to="/create" className="hover:text-[#800020] transition-colors flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Host an Experience</span>
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-[#800020] transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2D5A27]" />
                  <span className="font-semibold text-[#171717]">Safety & Trust Guide</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Product Manifesto */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">Manifesto</h4>
            <p className="text-xs text-[#6F6F6F] leading-relaxed">
              No swiping algorithms. No awkward DMs. No permanent group chats. The hangout is the social unit. Connection happens naturally through real-world activities.
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6F6F6F]">
          <p>© {new Date().getFullYear()} Qleenq Platform.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-[#800020] fill-[#800020]" /> for real human connections everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}

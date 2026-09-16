import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { UserProvider, useUser } from './context/UserContext';
import { LeenQProvider } from './context/LeenQContext';
import { LocationProvider } from './context/LocationContext';
import { ToastProvider } from './components/common/Toast';

import Navbar from './components/layout/Navbar';
import MobileNav from './components/layout/MobileNav';
import Footer from './components/layout/Footer';
import AuthModal from './components/auth/AuthModal';

import Home from './pages/Home';
import Explore from './pages/Explore';
import HangoutDetails from './pages/HangoutDetails';
import HangoutSpace from './pages/HangoutSpace';
import CreateHangout from './pages/CreateHangout';
import MyHangouts from './pages/MyHangouts';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Safety from './pages/Safety';
import ResetPassword from './pages/ResetPassword';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/hangout/:id" element={<HangoutDetails />} />
        <Route path="/hangout/:id/space" element={<HangoutSpace />} />
        <Route path="/create" element={<CreateHangout />} />
        <Route path="/my-hangouts" element={<MyHangouts />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="*" element={<Explore />} />
      </Routes>
    </AnimatePresence>
  );
}

function GlobalAuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalInitialView } = useUser();
  return (
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      initialView={authModalInitialView}
    />
  );
}

export default function App() {
  return (
    <ToastProvider>
      <UserProvider>
        <LocationProvider>
          <LeenQProvider>
            <BrowserRouter>
              <div className="min-h-screen flex flex-col justify-between bg-[#FFF7EC] font-sans selection:bg-[#E2522B]/20 selection:text-[#E2522B]">
                <div>
                  <Navbar />
                  <main>
                    <AnimatedRoutes />
                  </main>
                </div>
                <Footer />
                <MobileNav />
                <GlobalAuthModal />
              </div>
            </BrowserRouter>
          </LeenQProvider>
        </LocationProvider>
      </UserProvider>
    </ToastProvider>
  );
}

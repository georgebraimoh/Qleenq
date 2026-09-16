import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Clock, MapPin, Users, Image, CheckCircle, ArrowRight, MessageSquare } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import Button from '../components/common/Button';
import FormField from '../components/common/FormField';
import LocationAutocomplete from '../components/common/LocationAutocomplete';
import SafetyReminder from '../components/safety/SafetyReminder';
import { CATEGORIES } from '../data/categories';
import { useLeenQ } from '../context/LeenQContext';

const PRESET_IMAGES = [
  { label: "Photowalk / Outdoor", url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80" },
  { label: "Food & Suya Grill", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80" },
  { label: "Board Games / Indoors", url: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1200&q=80" },
  { label: "Tech & Coffee House", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" },
  { label: "Acoustic & Music", url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80" },
  { label: "Fitness & Morning Run", url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80" },
  { label: "Kayaking & Water", url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80" }
];

export default function CreateHangout() {
  const navigate = useNavigate();
  const { createHangout } = useLeenQ();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Food',
    location: null,
    date: '',
    time: '17:00',
    maxAttendees: 10,
    description: '',
    image: PRESET_IMAGES[0].url
  });

  const [errors, setErrors] = useState({});
  const [createdActivity, setCreatedActivity] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Activity title is required';
    if (formData.title.trim().length < 5) errs.title = 'Title should be at least 5 characters';
    if (!formData.location || !formData.location.placeName) errs.location = 'Please select a meeting location or venue';
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.description.trim()) errs.description = 'Please add a brief description of what people will do';
    if (formData.description.trim().length < 20) errs.description = 'Description should be at least 20 characters';
    if (!formData.maxAttendees || formData.maxAttendees < 2) errs.maxAttendees = 'Minimum 2 attendees required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newActivity = createHangout(formData);
    setCreatedActivity(newActivity);
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* SUCCESS OVERLAY */}
        <AnimatePresence>
          {createdActivity ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white border border-[#E8E6E1] rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl my-8"
            >
              <div className="w-20 h-20 bg-[#E8F0E8] text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#FF6B4A]">Success</span>
                <h2 className="text-3xl font-bold font-heading text-[#171717]">
                  Your activity is live.
                </h2>
                <p className="text-sm text-[#6F6F6F] max-w-md mx-auto leading-relaxed">
                  Your Qleenq Space is ready. People can now discover and join you at {createdActivity.location?.placeName || 'your venue'}.
                </p>
              </div>

              <div className="p-4 bg-[#F7F6F2] rounded-2xl max-w-sm mx-auto text-left space-y-1 border border-[#E8E6E1]">
                <p className="text-xs font-bold uppercase text-[#FF6B4A]">{createdActivity.category}</p>
                <h4 className="font-bold text-[#171717] font-heading">{createdActivity.title}</h4>
                <p className="text-xs text-[#6F6F6F]">
                  📍 {createdActivity.location?.placeName || 'Venue'} · {createdActivity.date} at {createdActivity.time}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to={`/hangout/${createdActivity.id}/space`}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Go to space</span>
                  </Button>
                </Link>

                <Link to={`/hangout/${createdActivity.id}`}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    View activity details
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            /* FORM SECTION */
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#FF6B4A]">Host an experience</span>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-[#171717]">
                  What are you getting people together for?
                </h1>
                <p className="text-sm text-[#6F6F6F]">
                  Specify the location and details to publish your activity.
                </p>
              </div>

              {/* Host Safety Reminder */}
              <SafetyReminder mode="host" />

              <form onSubmit={handleSubmit} className="bg-white border border-[#E8E6E1] rounded-3xl p-6 md:p-10 shadow-xs space-y-6">
                {/* Activity Name */}
                <FormField label="Activity Name" required error={errors.title}>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Sunset Photowalk, Board Games & Suya, Rooftop Catan..."
                    className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A]"
                  />
                </FormField>

                {/* Where is it happening? (Location Autocomplete) */}
                <FormField label="Where is it happening?" required error={errors.location} helpText="Search for a public venue, landmark, street, pitch, or use your GPS location.">
                  <LocationAutocomplete
                    value={formData.location}
                    onSelectLocation={(loc) => setFormData({ ...formData, location: loc })}
                    placeholder="Search venue, landmark, or address (e.g. Jabi Lake, Central Park, Shoreditch...)"
                  />
                </FormField>

                {/* Category */}
                <FormField label="Category" required>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A]"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </FormField>

                {/* Date, Time & Max Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <FormField label="Date" required error={errors.date}>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A]"
                    />
                  </FormField>

                  <FormField label="Time" required>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A]"
                    />
                  </FormField>

                  <FormField label="Max Capacity" required error={errors.maxAttendees}>
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={formData.maxAttendees}
                      onChange={e => setFormData({ ...formData, maxAttendees: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A]"
                    />
                  </FormField>
                </div>

                {/* Description */}
                <FormField label="Description" required error={errors.description} helpText="Describe what attendees will do, what to bring, and exact meeting spot.">
                  <textarea
                    rows="4"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide details about the meeting point, activities, vibes..."
                    className="w-full px-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A]"
                  />
                </FormField>

                {/* Cover Image Picker */}
                <FormField label="Cover Image Preset" helpText="Select a high quality photography cover for your activity card.">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {PRESET_IMAGES.map((img, idx) => {
                      const isSelected = formData.image === img.url;
                      return (
                        <motion.button
                          type="button"
                          key={idx}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setFormData({ ...formData, image: img.url })}
                          className={`relative h-20 rounded-xl overflow-hidden border-2 transition-colors cursor-pointer ${
                            isSelected ? 'border-[#FF6B4A] shadow-md' : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-[#FF6B4A] text-white p-0.5 rounded-full shadow-xs">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold p-1 truncate text-center">
                            {img.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </FormField>

                {/* Submit Action */}
                <div className="pt-4 border-t border-[#E8E6E1]">
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                    <Button type="submit" variant="primary" size="lg" fullWidth showArrow>
                      Create activity
                    </Button>
                  </motion.div>
                </div>
              </form>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

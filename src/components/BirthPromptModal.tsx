import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Sparkles, X } from 'lucide-react';
import { BirthDetails } from '../services/vedicEngine';

interface BirthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: BirthDetails, query?: string) => void;
  initialDetails?: BirthDetails;
}

export const BirthPromptModal: React.FC<BirthPromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDetails,
}) => {
  const [date, setDate] = useState(initialDetails?.date || '1996-08-15');
  const [time, setTime] = useState(initialDetails?.time || '10:30');
  const [isPM, setIsPM] = useState(initialDetails?.isPM || false);
  const [place, setPlace] = useState(initialDetails?.place || 'Mumbai, India');
  const [queryTopic, setQueryTopic] = useState('General Kundali & Life Path');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        date,
        time,
        isPM,
        place,
      },
      queryTopic
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm select-none p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-2xl p-6 text-white max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-semibold">Vedic Birth Chart Details</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <p className="text-xs text-neutral-400 leading-relaxed">
            Provide your birth coordinates for sub-15ms astronomical calculation of your Lagna, Moon Nakshatra, and Vimshottari Dasha.
          </p>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Date of Birth</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Time of Birth */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Time of Birth</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="10:30"
                required
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
              />
              <div className="flex rounded-xl bg-neutral-950 border border-neutral-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setIsPM(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    !isPM ? 'bg-sky-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setIsPM(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isPM ? 'bg-sky-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Place of Birth */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Place of Birth (City, Country)</span>
            </label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="e.g. Mumbai, India or New York, USA"
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Query Focus */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Astrology Query Focus</label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                'Marriage Timing & Age',
                'Love vs. Arranged Marriage',
                'Personality of Future Partner',
                'Success in Job vs. Business',
                'Settlement in India vs. Abroad',
                'Make My Kundali & Overview',
              ].map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setQueryTopic(topic)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-medium border text-left transition-colors ${
                    queryTopic === topic
                      ? 'bg-sky-950/60 border-sky-600 text-sky-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-transform active:scale-98 shadow-lg shadow-blue-900/40"
            >
              Analyze & Speak Reading
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

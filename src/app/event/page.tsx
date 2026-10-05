'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  Calendar, 
  Clock, 
  MapPin, 
  Trophy, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Cpu,
  FileCode,
  Layers,
  Lock, 
  ArrowLeft,
  Flame,
  AlertCircle,
  Lightbulb,
  Utensils,
  AlertTriangle,
  Search,
  Accessibility,
  ShieldAlert,
  CheckCircle2,
  Compass
} from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  slug: string;
  short_problem?: string;
  description: string;
  possible_directions: string[];
  display_order: number;
  is_active: boolean | number;
}

export default function EventBriefPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [eventStatus, setEventStatus] = useState<any>(null);
  const [ideasData, setIdeasData] = useState<{ isLocked: boolean; ideas: Idea[]; message?: string }>({
    isLocked: true,
    ideas: []
  });

  useEffect(() => {
    // Verify participant authentication and fetch data
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/event/status').then(r => r.json()),
      fetch('/api/ideas').then(r => r.json())
    ])
      .then(([authData, eventData, ideasRes]) => {
        if (!authData.authenticated) {
          router.push('/login');
          return;
        }
        setUser(authData.user);
        setParticipant(authData.participant);
        setEventStatus(eventData);
        if (ideasRes) {
          setIdeasData(ideasRes);
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const getIdeaIcon = (title: string, slug: string) => {
    const s = (title + ' ' + slug).toLowerCase();
    if (s.includes('food') || s.includes('rescue')) return Utensils;
    if (s.includes('crisis') || s.includes('emergency')) return AlertTriangle;
    if (s.includes('lost') || s.includes('found')) return Search;
    if (s.includes('access') || s.includes('able')) return Accessibility;
    if (s.includes('scam') || s.includes('shield') || s.includes('fraud')) return ShieldAlert;
    return Lightbulb;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Verifying participant credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Participant Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Participant Dashboard</span>
        </Link>

        {participant && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Pass ID: {participant.participant_id}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">{participant.full_name}</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Official Participant Briefing • Open-Ended Web Sprint</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          VIBECODE: BUILD BEYOND BOUNDARIES
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          TANTRA’26 • Department of Computer Science & Engineering • Vimal Jyothi Engineering College
        </p>
      </div>

      {/* 4 Overview Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-panel border border-slate-800">
          <Calendar className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-[11px] text-slate-400">Date</div>
          <div className="text-sm font-bold text-white mt-0.5">7 October 2026</div>
          <div className="text-[10px] text-cyan-400">10:30 AM – 12:00 PM</div>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800">
          <Clock className="w-5 h-5 text-cyan-400 mb-2" />
          <div className="text-[11px] text-slate-400">Duration</div>
          <div className="text-sm font-bold text-white mt-0.5">90 Minutes</div>
          <div className="text-[10px] text-slate-400">Individual Participant</div>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800">
          <MapPin className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-[11px] text-slate-400">Venue</div>
          <div className="text-sm font-bold text-white mt-0.5">Admin Block</div>
          <div className="text-[10px] text-slate-400">VJEC Chemperi</div>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800">
          <Trophy className="w-5 h-5 text-amber-400 mb-2" />
          <div className="text-[11px] text-slate-400">Prizes</div>
          <div className="text-sm font-bold text-amber-300 mt-0.5">₹1,000 Cash</div>
          <div className="text-[10px] text-slate-400">Entry Fee: ₹30</div>
        </div>
      </div>

      {/* Dynamic Announcement from Coordinators if configured */}
      {eventStatus?.config?.challenge_brief && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-cyan-500/40 glow-blue">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Coordinators Announcement</span>
          </div>
          <p className="text-sm sm:text-base text-white leading-relaxed whitespace-pre-wrap font-medium">
            {eventStatus.config.challenge_brief}
          </p>
        </div>
      )}

      {/* ================================================== */}
      {/* SECTION: IDEAS & INSPIRATION                       */}
      {/* ================================================== */}
      <div className="p-6 sm:p-10 rounded-2xl glass-panel border border-slate-800 space-y-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Open Exploration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            IDEAS & INSPIRATION
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            &ldquo;Need an idea? Here are a few real-world problems you could explore.&rdquo;
          </p>
        </div>

        {/* VERY IMPORTANT MESSAGE (Prominent Top Banner) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#080d21] border border-cyan-500/40 space-y-2 text-center max-w-3xl mx-auto glow-cyan">
          <div className="text-xs sm:text-sm font-black tracking-wider text-cyan-400 uppercase">
            &ldquo;THESE ARE ONLY IDEAS — NOT FIXED CHALLENGES.&rdquo;
          </div>
          <div className="text-sm sm:text-base font-bold text-white">
            &ldquo;You are NOT required to choose any of these ideas.&rdquo;
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            &ldquo;Build any website you believe is useful, creative, innovative, or socially meaningful.&rdquo;
          </p>
          <p className="text-xs text-cyan-300 font-semibold pt-1">
            &ldquo;You decide the problem, users, features, technology, and design.&rdquo;
          </p>
        </div>

        {/* LOCKED STATE OR ACTIVE CARDS */}
        {ideasData.isLocked ? (
          /* Before Event Start: Locked View */
          <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
              IDEAS & INSPIRATION WILL BE UNLOCKED WHEN THE EVENT BEGINS.
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              When the official competition clock starts on <strong>7 October 2026 at 10:30 AM IST</strong>, all suggested inspiration directions will unlock automatically right here.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sprint window: 10:30 AM – 12:00 PM IST</span>
            </div>
          </div>
        ) : (
          /* Event Started: Display All Idea Cards */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ideasData.ideas.map((idea) => {
                const IconComponent = getIdeaIcon(idea.title, idea.slug);
                return (
                  <div
                    key={idea.id}
                    className="p-5 rounded-2xl bg-[#090d22] border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      {/* Card Header with Icon and INSPIRATION Label */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-cyan-300 border border-slate-700">
                          INSPIRATION
                        </span>
                      </div>

                      {/* Title & Short Problem */}
                      <h3 className="text-base font-black text-white tracking-wide">
                        {idea.title}
                      </h3>
                      {idea.short_problem && (
                        <div className="text-xs font-bold text-cyan-400 mt-0.5">
                          {idea.short_problem}
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                        {idea.description}
                      </p>

                      {/* Possible directions */}
                      {idea.possible_directions && idea.possible_directions.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                            Possible directions:
                          </span>
                          <ul className="space-y-1 text-xs text-slate-300">
                            {idea.possible_directions.map((dir, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                                <span className="text-cyan-400 mt-1">•</span>
                                <span>{dir}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Non-binding reminder */}
                    <div className="pt-2 text-[10px] text-slate-500 italic border-t border-slate-800/60">
                      These are suggestions only. Participants are free to create their own solution.
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FINAL MESSAGE TO PARTICIPANTS (Prominent Bottom Banner) */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-indigo-950/40 border border-slate-800 text-center max-w-3xl mx-auto space-y-2">
              <p className="text-sm sm:text-base font-bold text-white">
                &ldquo;Think beyond these examples. Your project can solve ANY problem you care about.&rdquo;
              </p>
              <p className="text-xs text-slate-300">
                &ldquo;These examples are here only to help you get started.&rdquo;
              </p>
              <p className="text-xs sm:text-sm font-black text-cyan-400 tracking-wider uppercase pt-1">
                &ldquo;Your idea is your own. Build beyond boundaries.&rdquo;
              </p>
            </div>
          </div>
        )}

      </div>

      {/* SECTION: COMPETITION RULES */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Official Competition Rules</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-[#080d21] border border-slate-800 space-y-2">
            <span className="font-bold text-white block">1. Individual Sprint</span>
            <p className="leading-relaxed text-slate-400">
              Each participant codes individually. You choose your own problem, users, and tech stack.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#080d21] border border-slate-800 space-y-2">
            <span className="font-bold text-white block">2. Server 90-Minute Window</span>
            <p className="leading-relaxed text-slate-400">
              The competition timer runs strictly from 10:30 AM to 12:00 PM IST. At 12:00 PM, final submissions lock automatically.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#080d21] border border-slate-800 space-y-2">
            <span className="font-bold text-white block">3. Open Tech Stack</span>
            <p className="leading-relaxed text-slate-400">
              Build using any framework or tools (React, Next.js, Vue, Node.js, Python, Tailwind, HTML/JS, Supabase, etc.).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#080d21] border border-slate-800 space-y-2">
            <span className="font-bold text-white block">4. AI Tools Permitted with Disclosure</span>
            <p className="leading-relaxed text-slate-400">
              AI development tools (Copilot, Claude, ChatGPT, Gemini, v0) are permitted and encouraged, provided you declare their usage in the submission form.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: JUDGING RUBRIC */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Evaluation & Judging Rubric</span>
        </h2>
        <p className="text-xs text-slate-400">
          Judges evaluate your actual project based on the following criteria. There is no selected challenge constraint.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xl font-black text-cyan-400 font-mono">25%</div>
            <div className="text-xs font-bold text-white mt-1">Idea & Usefulness</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Practical impact & problem solving</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xl font-black text-blue-400 font-mono">25%</div>
            <div className="text-xs font-bold text-white mt-1">UI/UX & Design</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Visual aesthetics & smooth flow</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xl font-black text-purple-400 font-mono">25%</div>
            <div className="text-xs font-bold text-white mt-1">Functionality</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Working code & reliable execution</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xl font-black text-amber-400 font-mono">15%</div>
            <div className="text-xs font-bold text-white mt-1">Creativity</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Originality & outside-the-box thinking</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
            <div className="text-xl font-black text-emerald-400 font-mono">10%</div>
            <div className="text-xs font-bold text-white mt-1">AI / Vibe Coding</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Speed & effective AI workflow</div>
          </div>
        </div>
      </div>

      {/* Action Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all text-xs text-center"
        >
          Return to Dashboard
        </Link>
        <Link
          href="/submission"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-xl glow-blue transition-all text-xs text-center"
        >
          <span>Go to Project Submission Desk</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}

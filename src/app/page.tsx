'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Terminal, 
  Sparkles, 
  Clock, 
  Trophy, 
  MapPin, 
  Zap, 
  Users, 
  ShieldCheck, 
  Cpu, 
  Code2, 
  Flame, 
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  Lock
} from 'lucide-react';

export default function HomePage() {
  const [eventStatus, setEventStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Initial instant calculation for 7 Oct 2026, 10:30 AM IST
    calculateCountdown('2026-10-07T10:30:00+05:30');

    // Fetch event status and public stats from server
    const fetchStatus = () => {
      fetch('/api/event/status')
        .then(res => res.json())
        .then(data => {
          setEventStatus(data);
          const target = data.isLive ? data.config?.end_time : data.config?.start_time;
          calculateCountdown(target || '2026-10-07T10:30:00+05:30', data.serverTimestamp);
        })
        .catch(() => {});
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const calculateCountdown = (targetDateStr: string, serverTimeMs?: number) => {
    if (!targetDateStr) return;
    const target = new Date(targetDateStr).getTime();
    const now = serverTimeMs || Date.now();
    const diff = target - now;

    if (diff <= 0) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft({ days, hours, minutes, seconds });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-blue-600/20 via-cyan-500/15 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[350px] right-[-100px] w-[500px] h-[500px] bg-purple-600/15 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Fest Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-radar" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            TANTRA’26
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-300 font-medium">
            Dept. of Computer Science & Engineering, VJEC
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-tight sm:leading-none mb-6">
          VIBECODE
          <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
            BUILD BEYOND BOUNDARIES
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
          The signature 90-minute rapid individual hackathon sprint of TANTRA’26.
          Transform ideas into working web applications under the official competition countdown clock.
        </p>

        {/* Server Authoritative Live Countdown Timer */}
        <div className="max-w-2xl mx-auto mb-12 p-6 rounded-2xl glass-panel-elevated glow-blue">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${eventStatus?.isLive ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {eventStatus?.isLive 
                  ? 'Competition is LIVE (90-Minute Sprint)' 
                  : eventStatus?.isClosed 
                  ? 'Competition Concluded' 
                  : 'Official Event Countdown (7 Oct 2026, 10:30 AM IST)'}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono ${
              eventStatus?.isLive 
                ? 'bg-rose-950/80 border border-rose-800/80 text-rose-300 font-bold' 
                : 'bg-cyan-950/80 border border-cyan-800/80 text-cyan-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${eventStatus?.isLive ? 'bg-rose-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
              {eventStatus?.isLive ? 'LIVE SPRINT' : 'Server Synced'}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 sm:p-4 rounded-xl bg-[#090e21] border border-slate-800/90">
              <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">{String(timeLeft.days).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 mt-1">Days</div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-[#090e21] border border-slate-800/90">
              <div className="text-2xl sm:text-4xl font-extrabold text-cyan-300 font-mono">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 mt-1">Hours</div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-[#090e21] border border-slate-800/90">
              <div className="text-2xl sm:text-4xl font-extrabold text-blue-400 font-mono">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 mt-1">Minutes</div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-[#090e21] border border-slate-800/90">
              <div className="text-2xl sm:text-4xl font-extrabold text-amber-400 font-mono">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 mt-1">Seconds</div>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            href="/register"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-xl glow-blue transition-all transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5" />
            <span>Register as Participant</span>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-4 rounded-xl font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 transition-all flex items-center justify-center gap-2"
          >
            <span>Participant Login</span>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </Link>
        </div>

        {/* Lock note for event brief */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 mb-12">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Official Event Brief & Problem Tracks unlock inside the Participant Dashboard after sign-in</span>
        </div>

        {/* 5 Event Specifications Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-5xl mx-auto text-left">
          
          <div className="p-4 rounded-xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-blue-950/70 border border-blue-800/60 flex items-center justify-center mb-3">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xs text-slate-400 font-medium">Event Date</div>
            <div className="text-sm font-bold text-white mt-0.5">7 October 2026</div>
            <div className="text-[11px] text-cyan-400 mt-0.5">10:30 AM – 12:00 PM</div>
          </div>

          <div className="p-4 rounded-xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-800/60 flex items-center justify-center mb-3">
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xs text-slate-400 font-medium">Competition Time</div>
            <div className="text-sm font-bold text-white mt-0.5">90 Minutes</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Individual Hack</div>
          </div>

          <div className="p-4 rounded-xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-amber-950/70 border border-amber-800/60 flex items-center justify-center mb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs text-slate-400 font-medium">Prize Pool</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">₹1,000 Cash</div>
            <div className="text-[11px] text-slate-400 mt-0.5">+ Certificate of Merit</div>
          </div>

          <div className="p-4 rounded-xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-purple-950/70 border border-purple-800/60 flex items-center justify-center mb-3">
              <MapPin className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xs text-slate-400 font-medium">Official Venue</div>
            <div className="text-sm font-bold text-white mt-0.5">Admin Block</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Vimal Jyothi Engg College</div>
          </div>

          <div className="col-span-2 md:col-span-1 p-4 rounded-xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center mb-3">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs text-slate-400 font-medium">Registration Fee</div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">₹30 / person</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Pay at Admin Desk</div>
          </div>

        </div>

      </section>

      {/* Highlights & Competition Rules */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for High-Octane Builders
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Everything you need to know about the format, submission requirements, and judging metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1px] mb-4">
              <div className="w-full h-full bg-[#090e21] rounded-xl flex items-center justify-center">
                <Code2 className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">90-Minute Sprint</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              No long days or fatigue. A sharp 90-minute development sprint where you transform ideas into working full-stack apps with live deployment.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-cyan-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full-stack stack of your choice</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 p-[1px] mb-4">
              <div className="w-full h-full bg-[#090e21] rounded-xl flex items-center justify-center">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI-Augmented Workflows</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              We embrace the new era of coding. Use GitHub Copilot, Claude, ChatGPT, or Gemini. Full transparency required via submission disclosure.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-purple-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Transparent AI tool disclosure</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 p-[1px] mb-4">
              <div className="w-full h-full bg-[#090e21] rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Fast Evaluation</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Evaluation by the CSE Department jury based on functionality, UI/UX polish, technical problem-solving, and clean execution.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-amber-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Live demo to faculty & peer judges</span>
            </div>
          </div>

        </div>
      </section>

      {/* Admin Quick Jump Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e1630] to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Event Organizing Committee & Coordinators</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Access the real-time participant database, Excel import wizard, timer controls, and payment desks.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/40 transition-all flex-shrink-0"
          >
            <span>Open Admin Command</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}

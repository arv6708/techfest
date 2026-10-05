'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'PARTICIPANT' | 'ADMIN'>('PARTICIPANT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eventStatus, setEventStatus] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  } | null>(null);

  // Fetch event status to determine if participant login is active
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/event/status');
        const data = await res.json();
        setEventStatus(data);
      } catch (err) {
        console.error('Failed to load event status', err);
      }
    };

    fetchStatus();
    timer = setInterval(fetchStatus, 10000); // Check status periodically
    return () => clearInterval(timer);
  }, []);

  // Compute live countdown until 7 Oct 2026, 10:30 AM IST
  useEffect(() => {
    if (!eventStatus?.config?.start_time) return;

    const updateTimer = () => {
      const startMs = new Date(eventStatus.config.start_time).getTime();
      const nowMs = Date.now();
      const diff = startMs - nowMs;

      if (diff <= 0 || eventStatus.isLive) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        if (eventStatus.config?.state === 'PRE_EVENT') {
          fetch('/api/event/status')
            .then(r => r.json())
            .then(d => setEventStatus(d))
            .catch(() => {});
        }
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeRemaining({ days, hours, minutes, seconds, isPast: false });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [eventStatus]);

  const isPreEvent = eventStatus?.config?.state === 'PRE_EVENT' && (!timeRemaining || !timeRemaining.isPast);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, roleHint: activeTab })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      showToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome back, ${data.user.fullName || data.user.email}!`
      });

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      
      {/* Brand Icon */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 p-[1px] glow-blue mx-auto mb-4">
          <div className="w-full h-full bg-[#080d1e] rounded-2xl flex items-center justify-center">
            <Terminal className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Sign In to VIBECODE
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          TANTRA’26 • Department of Computer Science & Engineering
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 shadow-2xl">
        
        {/* Role Tab Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('PARTICIPANT'); setError(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'PARTICIPANT'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Participant</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('ADMIN'); setError(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ADMIN'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Tab-Specific Notice & Pre-Event Countdown */}
        {activeTab === 'PARTICIPANT' && isPreEvent && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-b from-blue-950/60 to-slate-900/80 border border-blue-800/60 shadow-inner">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Participant Portal Activates In</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                7 Oct • 10:30 AM IST
              </span>
            </div>

            {timeRemaining && !timeRemaining.isPast ? (
              <div className="grid grid-cols-4 gap-2 text-center my-3">
                <div className="bg-[#080d1e] border border-blue-900/60 rounded-lg py-2 px-1">
                  <div className="text-lg font-black text-cyan-400 font-mono tracking-wider">
                    {String(timeRemaining.days).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Days</div>
                </div>
                <div className="bg-[#080d1e] border border-blue-900/60 rounded-lg py-2 px-1">
                  <div className="text-lg font-black text-cyan-400 font-mono tracking-wider">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Hours</div>
                </div>
                <div className="bg-[#080d1e] border border-blue-900/60 rounded-lg py-2 px-1">
                  <div className="text-lg font-black text-cyan-400 font-mono tracking-wider">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Mins</div>
                </div>
                <div className="bg-[#080d1e] border border-blue-900/60 rounded-lg py-2 px-1">
                  <div className="text-lg font-black text-cyan-400 font-mono tracking-wider">
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Secs</div>
                </div>
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-cyan-300 font-mono">
                Syncing countdown with server...
              </div>
            )}

            <p className="text-[11px] text-slate-300 text-center leading-relaxed mt-2">
              Participant login unlocks automatically when the event begins on <strong className="text-white font-semibold">7 October 2026 at 10:30 AM IST</strong>. Registered participants can sign in with their Participant ID and mobile number once the countdown reaches zero.
            </p>
          </div>
        )}

        {activeTab === 'ADMIN' && (
          <div className="mb-6 p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-amber-300">Admin Portal Active 24/7:</strong> Coordinators and faculty can log in anytime to review entries, manage ideas, or initiate the live competition.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <div className="font-medium leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {activeTab === 'ADMIN' ? 'Admin Username or Email' : 'Participant ID or Email Address'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder={activeTab === 'ADMIN' ? 'Username or email address' : 'Enter your Participant ID or email'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder={activeTab === 'ADMIN' ? 'Enter admin password' : 'Enter your registered mobile number'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-xs ${
              activeTab === 'ADMIN'
                ? 'bg-amber-600 hover:bg-amber-500 glow-gold'
                : isPreEvent
                ? 'bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-slate-300'
                : 'bg-blue-600 hover:bg-blue-500 glow-blue'
            } disabled:opacity-50`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : activeTab === 'ADMIN' ? (
              <>
                <span>Sign In as Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : isPreEvent ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In as Participant (Opens at 10:30 AM IST)</span>
              </>
            ) : (
              <>
                <span>Sign In as Participant</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
          Not registered yet?{' '}
          <Link href="/register" className="text-cyan-400 font-bold hover:underline">
            Register for VibeCode
          </Link>
        </div>

      </div>

    </div>
  );
}

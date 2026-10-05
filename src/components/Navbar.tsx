'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Terminal, Shield, LogOut, User as UserIcon, Clock, ChevronRight, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch auth status
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
          setParticipantId(data.participantId);
        }
      })
      .catch(() => {});

    // Fetch event status
    fetch('/api/event/status')
      .then(res => res.json())
      .then(data => {
        setEventStatus(data);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setParticipantId(null);
    router.push('/');
    router.refresh();
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 p-[1px] glow-blue group-hover:scale-105 transition-all">
            <div className="w-full h-full bg-[#080d1e] rounded-xl flex items-center justify-center">
              <Terminal className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-white">VIBECODE</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30">
                TANTRA’26
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">
              Dept. of CSE • Vimal Jyothi Engg. College
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              pathname === '/' ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Home
          </Link>

          {user && !isAdmin && (
            <>
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  pathname === '/dashboard' ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/event"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  pathname === '/event' ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Ideas & Rules
              </Link>
              <Link
                href="/submission"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  pathname === '/submission' ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Submission
              </Link>
              <Link
                href="/profile"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  pathname === '/profile' ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Profile
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                pathname.startsWith('/admin') ? 'text-amber-300 bg-amber-950/40 border border-amber-600/40' : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/30'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Admin Command
            </Link>
          )}
        </nav>

        {/* Right Action buttons */}
        <div className="hidden md:flex items-center gap-3">
          {/* Event Status Live Pill */}
          {eventStatus?.config && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs">
              <span className={`w-2 h-2 rounded-full ${
                eventStatus.config.state === 'LIVE' 
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' 
                  : eventStatus.config.state === 'PRE_EVENT'
                  ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]'
                  : 'bg-rose-400'
              }`} />
              <span className="text-[11px] font-mono font-medium text-slate-300">
                {eventStatus.config.state.replace('_', ' ')}
              </span>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200">
                <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold">{user.fullName || user.email.split('@')[0]}</span>
                {participantId && (
                  <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60">
                    {participantId}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all border border-slate-700/60"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md glow-blue transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Register Now
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-[#080d1e] border-b border-slate-800 flex flex-col gap-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/80"
          >
            Home
          </Link>
          {user && !isAdmin && (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/80"
              >
                Dashboard
              </Link>
              <Link
                href="/event"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/80"
              >
                Ideas & Rules
              </Link>
              <Link
                href="/submission"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/80"
              >
                Submission
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/80"
              >
                Profile
              </Link>
            </>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/50"
            >
              Admin Command
            </Link>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-300 font-medium">
                  {user.fullName || user.email}
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-400 font-semibold px-2.5 py-1 rounded bg-rose-950/30"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold text-slate-300 bg-slate-800 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold text-white bg-blue-600 rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  Sparkles, 
  Clock, 
  Calendar, 
  MapPin, 
  CreditCard, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldAlert,
  User,
  ExternalLink,
  QrCode,
  Flame
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [eventStatus, setEventStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch profile and event data
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/event/status').then(r => r.json())
    ])
      .then(([authData, eventData]) => {
        if (!authData.authenticated) {
          router.push('/login');
          return;
        }
        setUser(authData.user);
        setParticipant(authData.participant);
        setSubmission(authData.submission);
        setEventStatus(eventData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    showToast({ type: 'info', title: 'Copied to clipboard', message: id });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Participant Pass...</span>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="p-8 rounded-2xl glass-panel border border-slate-800">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">No Participant Dossier Linked</h2>
          <p className="text-xs text-slate-400 mt-2">
            You are logged in as {user?.email}, but no participant registration was found.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500"
          >
            <span>Complete Registration</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const isLive = eventStatus?.isLive;
  const isPaid = participant.payment_status === 'PAID';
  const hasSubmitted = submission && submission.status === 'SUBMITTED';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* VibeCode Banner Branding */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-[#0b1433] via-[#0e1e47] to-[#0a122e] border border-blue-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>VibeCode • Build Beyond Boundaries</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              WELCOME, {participant.full_name.toUpperCase()}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              TANTRA’26 Department of Computer Science and Engineering, Vimal Jyothi Engineering College
            </p>
          </div>

          {/* Official Pass Badge */}
          <div className="p-4 rounded-xl bg-[#060a17]/90 border border-cyan-500/40 glow-blue text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
              Official Participant ID
            </span>
            <div className="flex items-center gap-2 mt-0.5 justify-end">
              <span className="text-xl sm:text-2xl font-mono font-black text-cyan-300">
                {participant.participant_id}
              </span>
              <button
                onClick={() => copyId(participant.participant_id)}
                className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors"
                title="Copy ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* Payment Status Card */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isPaid 
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' 
            : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPaid ? 'bg-emerald-900/60 text-emerald-400' : 'bg-amber-900/60 text-amber-400'
            }`}>
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80 block">Payment Status</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                {participant.payment_status}
                {isPaid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </span>
            </div>
          </div>
          {!isPaid && (
            <span className="text-[11px] font-semibold px-2 py-1 rounded bg-amber-900/60 text-amber-200">
              ₹30 at Desk
            </span>
          )}
        </div>

        {/* Event State Card */}
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/60 text-blue-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900/60 text-cyan-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">Event State</span>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
                {eventStatus?.config?.state?.replace('_', ' ') || 'PRE EVENT'}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            {eventStatus?.config?.duration_minutes || 90} Min Sprint
          </span>
        </div>

        {/* Project Submission Status Card */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          hasSubmitted 
            ? 'bg-purple-950/30 border-purple-800/60 text-purple-300' 
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/60 text-purple-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">Submission</span>
              <span className="text-sm font-bold text-white">
                {submission?.status || 'Not Started'}
              </span>
            </div>
          </div>
          <Link
            href="/submission"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>{hasSubmitted ? 'View' : 'Submit'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Main Content Grid: Participant Details & Event Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Official Pass & Dossier */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dossier Card */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Participant Registration Dossier</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Source: {participant.registration_source}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="text-slate-100 font-bold text-sm mt-0.5 block">{participant.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Participant ID</span>
                <span className="text-cyan-300 font-mono font-bold text-sm mt-0.5 block">{participant.participant_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="text-slate-200 mt-0.5 block">{participant.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Contact Phone</span>
                <span className="text-slate-200 mt-0.5 block">{participant.phone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block font-medium">College / Institution</span>
                <span className="text-slate-200 font-semibold mt-0.5 block">{participant.college}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block font-medium">Department / Branch</span>
                <span className="text-slate-200 mt-0.5 block">{participant.course}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Location</span>
                <span className="text-slate-200 mt-0.5 block">{participant.district}, {participant.state}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Registration Timestamp</span>
                <span className="text-slate-200 mt-0.5 block">{participant.registration_date}</span>
              </div>
            </div>

            {/* Custom Excel Fields if preserved */}
            {participant.custom_fields && Object.keys(participant.custom_fields).length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Additional Registration Details
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(participant.custom_fields).map(([key, val]: any) => (
                    <div key={key} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]">
                      <span className="text-slate-500 block truncate">{key}</span>
                      <span className="text-slate-200 font-medium truncate block">{String(val || 'N/A')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ideas & Inspiration (Participant-Only Access) */}
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Ideas & Inspiration
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                  Open-Ended Sprint
                </span>
              </div>

              {eventStatus?.config?.challenge_brief && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-cyan-500/30">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide block mb-1 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Coordinators Live Challenge Brief
                  </span>
                  <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed font-medium">
                    {eventStatus.config.challenge_brief}
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-[#080d21] border border-cyan-500/30 text-xs space-y-1">
                <span className="font-bold text-cyan-300 block text-[11px]">
                  &ldquo;THESE ARE ONLY IDEAS — NOT FIXED CHALLENGES.&rdquo;
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  You are <strong>not required</strong> to choose any specific idea. Build any useful, creative, innovative website you want.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-cyan-300 block mb-1 text-[11px]">FoodRescue & CrisisConnect</span>
                  <span className="text-slate-400 text-[10px] leading-relaxed block">
                    Food redistribution or real-time emergency disaster coordination.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-purple-300 block mb-1 text-[11px]">Lost2Found & AccessAble</span>
                  <span className="text-slate-400 text-[10px] leading-relaxed block">
                    Smart lost/found item matcher or venue wheelchair accessibility finder.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-amber-300 block mb-1 text-[11px]">ScamShield & Open Ideas</span>
                  <span className="text-slate-400 text-[10px] leading-relaxed block">
                    Digital scam detection or any innovative website of your choice.
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Judging: 25% Idea • 25% UI/UX • 25% Functionality • 15% Creativity • 10% AI</span>
                <Link href="/event" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                  <span>View All Ideas & Rulebook</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>

          {/* Quick Action Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/event"
              className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors block">
                  Event Brief & Rules
                </span>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  Check problem track details and rules
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/submission"
              className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-blue-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors block">
                  Project Submission Desk
                </span>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  Submit repository, live demo & AI usage
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

        </div>

        {/* Right Column: Event Information Card */}
        <div className="space-y-6">
          
          <div className="p-6 rounded-2xl glass-panel border border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Competition Schedule</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Event Date</span>
                  <span className="text-slate-100 font-bold text-sm">7 October 2026</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Event Time</span>
                  <span className="text-slate-100 font-bold text-sm">10:30 AM – 12:00 PM</span>
                  <span className="text-[11px] text-cyan-400 block mt-0.5">Strict 90-Minute Timer</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Venue</span>
                  <span className="text-slate-100 font-bold">Admin Block</span>
                  <span className="text-[11px] text-slate-400 block">Vimal Jyothi Engineering College</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Participation & Fee</span>
                  <span className="text-slate-100 font-bold">Individual • ₹30 Entry</span>
                  <span className="text-[11px] text-amber-400 block">Prize Pool: ₹1,000 Cash</span>
                </div>
              </div>
            </div>

            {/* Verification Notice */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              Show your <strong className="text-cyan-300">{participant.participant_id}</strong> pass at the entrance of the Admin Block on 7 October 2026.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

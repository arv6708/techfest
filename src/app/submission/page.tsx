'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileCode, 
  Clock, 
  Globe, 
  Video, 
  Layers, 
  Bot, 
  Image, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Save, 
  Send,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import GithubIcon from '@/components/GithubIcon';
import { useToast } from '@/components/Toast';

export default function SubmissionPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [eventStatus, setEventStatus] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    project_name: '',
    project_description: '',
    problem_solved: '',
    key_features: '',
    live_website_url: '',
    github_url: '',
    demo_video_url: '',
    technologies_used: '',
    ai_tools_used: '',
    ai_usage_description: '',
    screenshot_url: ''
  });

  const [finalDeclaration, setFinalDeclaration] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverRemainingMs, setServerRemainingMs] = useState<number>(0);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Regular polling for server clock sync
    const interval = setInterval(fetchEventStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [authRes, eventRes, subRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/event/status'),
        fetch('/api/submissions')
      ]);

      const authData = await authRes.json();
      if (!authData.authenticated) {
        router.push('/login');
        return;
      }
      setParticipantId(authData.participantId);

      const eventData = await eventRes.json();
      setEventStatus(eventData);
      setServerRemainingMs(eventData.timeRemainingMs || 0);

      const subData = await subRes.json();
      if (subData.submission) {
        setSubmission(subData.submission);
        setFormData({
          project_name: subData.submission.project_name || '',
          project_description: subData.submission.project_description || '',
          problem_solved: subData.submission.problem_solved || '',
          key_features: subData.submission.key_features || '',
          live_website_url: subData.submission.live_website_url || '',
          github_url: subData.submission.github_url || '',
          demo_video_url: subData.submission.demo_video_url || '',
          technologies_used: subData.submission.technologies_used || '',
          ai_tools_used: subData.submission.ai_tools_used || '',
          ai_usage_description: subData.submission.ai_usage_description || '',
          screenshot_url: subData.submission.screenshot_url || ''
        });
        if (subData.submission.status === 'SUBMITTED' || subData.submission.status === 'LOCKED') {
          setFinalDeclaration(true);
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStatus = async () => {
    try {
      const res = await fetch('/api/event/status');
      const data = await res.json();
      setEventStatus(data);
      setServerRemainingMs(data.timeRemainingMs || 0);
    } catch {}
  };

  // Local second ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setServerRemainingMs(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const handleSubmit = async (isFinalSubmit: boolean) => {
    setError(null);

    if (isFinalSubmit && !finalDeclaration) {
      setError('Please check the Final Declaration box before submitting your project.');
      showToast({
        type: 'error',
        title: 'Declaration Required',
        message: 'Please confirm the final declaration before final submission.'
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isFinalSubmit
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSubmission(data.submission);
      showToast({
        type: 'success',
        title: isFinalSubmit ? 'Final Submission Saved!' : 'Draft Saved',
        message: isFinalSubmit ? 'Your project is registered for jury evaluation.' : 'Draft saved to server.'
      });

      // Refresh event status
      fetchEventStatus();
    } catch (err: any) {
      setError(err.message);
      showToast({
        type: 'error',
        title: 'Submission Error',
        message: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Submission Portal...</span>
        </div>
      </div>
    );
  }

  const isLive = eventStatus?.isLive;
  const isPreEvent = eventStatus?.config?.state === 'PRE_EVENT';
  const isClosed = eventStatus?.isClosed || serverRemainingMs <= 0;
  const isLocked = submission?.status === 'LOCKED' || (isClosed && submission?.status === 'SUBMITTED');

  // Format time remaining
  const remMinutes = Math.floor(serverRemainingMs / 60000);
  const remSeconds = Math.floor((serverRemainingMs % 60000) / 1000);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Banner with Server-Authoritative Timer */}
      <div className="mb-8 p-6 rounded-2xl glass-panel-elevated glow-blue border border-blue-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>VibeCode Project Submission Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Sprint Submission Portal
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Participant ID: <span className="font-mono text-cyan-300 font-bold">{participantId}</span> • 90-Minute Official Clock
          </p>
        </div>

        {/* Server Timer Card */}
        <div className="p-4 rounded-xl bg-[#080d21] border border-cyan-500/40 text-center min-w-[200px]">
          <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-mono text-slate-400 tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Server Timer</span>
          </div>

          {isLive ? (
            <div>
              <div className="text-3xl font-mono font-black text-amber-300">
                {String(remMinutes).padStart(2, '0')}:{String(remSeconds).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                ● LIVE SPRINT ACCEPTING ENTRIES
              </div>
            </div>
          ) : isPreEvent ? (
            <div>
              <div className="text-xl font-mono font-bold text-cyan-300">PRE-EVENT</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Opens 7 Oct, 10:30 AM</div>
            </div>
          ) : (
            <div>
              <div className="text-xl font-mono font-bold text-rose-400">SUBMISSION CLOSED</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Deadline Passed (Server Locked)</div>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Event Placeholder if PRE_EVENT */}
      {isPreEvent && (
        <div className="mb-8 p-6 rounded-2xl glass-panel border border-slate-800 text-center">
          <Clock className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Competition Has Not Started Yet</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-2">
            The official 90-minute challenge begins on <strong>7 October 2026 at 10:30 AM IST</strong> in the Admin Block.
            Once the admin activates the competition clock, this form will automatically unlock for final submission.
          </p>
          <div className="mt-4 text-xs text-slate-400 font-mono">
            You can prepare your project repository or draft your ideas in advance.
          </div>
        </div>
      )}

      {/* Submission Status Pill */}
      {submission && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs ${
          submission.status === 'SUBMITTED' 
            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
            : 'bg-blue-950/40 border-blue-800/60 text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold">Current Status: {submission.status}</span>
              {submission.submitted_at && (
                <span className="block text-[11px] opacity-80">
                  Recorded Server Timestamp: {new Date(submission.submitted_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          {isLocked && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 border border-rose-800 text-rose-300 font-semibold text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>Submission Locked</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submission Form */}
      <div className="p-6 sm:p-10 rounded-2xl glass-panel border border-slate-800 space-y-6">
        
        {/* Project Name & Description */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-slate-800 flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5" />
            <span>Project Overview</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isLocked}
              placeholder="e.g. CampusFlow - Student Resource Exchange Platform"
              value={formData.project_name}
              onChange={e => setFormData({ ...formData, project_name: e.target.value })}
              className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Project Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              disabled={isLocked}
              placeholder="Concise overview: What is this project and how does it work?"
              value={formData.project_description}
              onChange={e => setFormData({ ...formData, project_description: e.target.value })}
              className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              What Problem Does It Solve? <span className="text-slate-400 font-normal">(What problem or need does your website address?)</span> <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              disabled={isLocked}
              placeholder="Free-text answer: Describe the real-world problem, user pain point, or creative need your application solves..."
              value={formData.problem_solved}
              onChange={e => setFormData({ ...formData, problem_solved: e.target.value })}
              className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Key Features (Bullet points or comma-separated)
            </label>
            <textarea
              rows={2}
              disabled={isLocked}
              placeholder="e.g. Real-time slot booking, Telegram notifications, SQLite persistence, Tailwind Dark Mode"
              value={formData.key_features}
              onChange={e => setFormData({ ...formData, key_features: e.target.value })}
              className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
            />
          </div>
        </div>

        {/* Project URLs */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Links & Repositories</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                GitHub Repository URL <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <GithubIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  disabled={isLocked}
                  placeholder="https://github.com/username/project"
                  value={formData.github_url}
                  onChange={e => setFormData({ ...formData, github_url: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Live Deployment URL (Vercel, Netlify, Render, etc.)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  disabled={isLocked}
                  placeholder="https://myproject.vercel.app"
                  value={formData.live_website_url}
                  onChange={e => setFormData({ ...formData, live_website_url: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Demo Video URL (Loom, YouTube, Drive)
              </label>
              <div className="relative">
                <Video className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  disabled={isLocked}
                  placeholder="https://youtu.be/... or Loom"
                  value={formData.demo_video_url}
                  onChange={e => setFormData({ ...formData, demo_video_url: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Screenshot URL (Imgur / Cloudinary / Drive)
              </label>
              <div className="relative">
                <Image className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  disabled={isLocked}
                  placeholder="https://imgur.com/..."
                  value={formData.screenshot_url}
                  onChange={e => setFormData({ ...formData, screenshot_url: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack & AI Tools */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Technologies & AI Disclosure</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Technologies Used <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isLocked}
              placeholder="e.g. Next.js, React, Tailwind CSS, SQLite, Node.js"
              value={formData.technologies_used}
              onChange={e => setFormData({ ...formData, technologies_used: e.target.value })}
              className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                AI Tools Used (Transparent Disclosure)
              </label>
              <div className="relative">
                <Bot className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="e.g. GitHub Copilot, Claude 3.5 Sonnet, ChatGPT"
                  value={formData.ai_tools_used}
                  onChange={e => setFormData({ ...formData, ai_tools_used: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                AI Usage Description
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="e.g. Component boilerplate, regex generation, CSS tweaks"
                value={formData.ai_usage_description}
                onChange={e => setFormData({ ...formData, ai_usage_description: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Final Declaration */}
        <div className="pt-4 border-t border-slate-800">
          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-[#080d21] border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
            <input
              type="checkbox"
              disabled={isLocked}
              checked={finalDeclaration}
              onChange={e => setFinalDeclaration(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
            />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-white block mb-0.5">FINAL DECLARATION <span className="text-rose-400">*</span></span>
              <span>
                I certify that this project represents my own work built during the sprint, and all external packages, templates, and AI coding assistants have been transparently declared.
              </span>
            </div>
          </label>
        </div>

        {/* Buttons / Locking Notice */}
        {!isLocked ? (
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(false)}
              className="py-3 px-5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-400" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(true)}
              className="flex-1 py-3 px-6 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-xl glow-blue transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <span>Submitting to Jury...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Final Project</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>This submission is locked for jury evaluation. No further edits are accepted.</span>
          </div>
        )}

      </div>

    </div>
  );
}

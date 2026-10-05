'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  Sparkles, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  GraduationCap, 
  Calendar, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    college: 'Vimal Jyothi Engineering College, Chemperi',
    course: 'Computer Science and Engineering',
    state: 'Kerala',
    district: 'Kannur',
    password: '',
    confirm_password: '',
    tshirt_size: 'L',
    laptop_required: 'No',
    github_profile: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          college: formData.college,
          course: formData.course,
          state: formData.state,
          district: formData.district,
          password: formData.password,
          custom_fields: {
            'T-Shirt Size': formData.tshirt_size,
            'Laptop Required': formData.laptop_required,
            'GitHub Profile': formData.github_profile
          }
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessData(data);
      showToast({
        type: 'success',
        title: 'Registration Complete!',
        message: `Your Participant ID is ${data.participantId}`
      });

    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Success Confirmation Screen
  if (successData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="p-8 sm:p-10 rounded-2xl glass-panel-elevated glow-cyan border border-cyan-500/40">
          
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-cyan-400" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
            Registration Confirmed
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4">
            WELCOME, {successData.participant.full_name}!
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto">
            You are officially registered for <span className="text-white font-semibold">VibeCode: Build Beyond Boundaries (TANTRA’26)</span>.
          </p>

          {/* Participant ID Pass Box */}
          <div className="my-8 p-6 rounded-xl bg-[#080d20] border border-cyan-500/40 relative group">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Your Official Participant ID
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-cyan-300 tracking-wider">
              {successData.participantId}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => copyToClipboard(successData.participantId)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied ID' : 'Copy ID'}</span>
              </button>
            </div>
          </div>

          {/* Registration Details Summary */}
          <div className="grid grid-cols-2 gap-3 text-left mb-8 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">College</span>
              <span className="text-slate-200 font-medium truncate block">{successData.participant.college}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Branch / Department</span>
              <span className="text-slate-200 font-medium block">{successData.participant.course}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Registration Fee</span>
              <span className="text-amber-400 font-semibold block">₹30 (Pay at Desk)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Event Date & Time</span>
              <span className="text-cyan-400 font-semibold block">7 Oct 2026, 10:30 AM</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg glow-blue transition-all flex items-center justify-center gap-2"
            >
              <span>Go to Participant Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-cyan-300 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>TANTRA’26 CSE Hackathon</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Participant Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto">
          Register now for the 90-minute live challenge. Your details will immediately be saved directly into the official competition database.
        </p>
      </div>

      {/* Form Container */}
      <div className="p-6 sm:p-10 rounded-2xl glass-panel border border-slate-800">
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div>
              <div className="font-bold">Registration Alert</div>
              <div className="mt-0.5 font-medium">{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Personal Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span>Personal Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sandra Suresh"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@vjec.ac.in"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9847123456"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  GitHub Profile (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/username"
                  value={formData.github_profile}
                  onChange={e => setFormData({ ...formData, github_profile: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Academic Institution & Branch</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  College / Institution Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.college}
                  onChange={e => setFormData({ ...formData, college: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Department / Course <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.course}
                  onChange={e => setFormData({ ...formData, course: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                >
                  <option value="Computer Science and Engineering">Computer Science & Engg (CSE)</option>
                  <option value="Artificial Intelligence and Data Science">AI & Data Science (AI & DS)</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Electronics and Communication">Electronics & Communication (ECE)</option>
                  <option value="Electrical and Electronics">Electrical & Electronics (EEE)</option>
                  <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                  <option value="Civil Engineering">Civil Engineering (CE)</option>
                  <option value="Other">Other Branch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  District
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Dashboard Password</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Create Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notice on fee */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-slate-300 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
            <span>
              Registration fee of <strong className="text-amber-300">₹30</strong> per participant can be paid directly at the TANTRA’26 Admin Registration Desk or via official UPI on event day.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-xl glow-blue transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Registering & Assigning ID...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Complete Registration & Generate Participant ID</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link href="/login" className="text-cyan-400 hover:underline font-semibold">
              Sign in to your dashboard
            </Link>
          </p>

        </form>

      </div>
    </div>
  );
}

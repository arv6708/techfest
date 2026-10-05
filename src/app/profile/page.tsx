'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  GraduationCap, 
  Calendar, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  Shield
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [participant, setParticipant] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    college: '',
    course: '',
    state: '',
    district: ''
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/login');
          return;
        }
        if (data.participant) {
          setParticipant(data.participant);
          setFormData({
            full_name: data.participant.full_name || '',
            phone: data.participant.phone || '',
            college: data.participant.college || '',
            course: data.participant.course || '',
            state: data.participant.state || 'Kerala',
            district: data.participant.district || 'Kannur'
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/participants/${participant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setParticipant(data.participant);
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your registration details have been saved.'
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 text-sm">No participant profile linked to this account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Participant Profile</h1>
          <p className="text-xs text-slate-400 mt-1">Review or update your official event credentials</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 text-right">
          <span className="text-[10px] text-slate-400 font-mono block">Participant ID</span>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-base font-mono font-bold text-cyan-300">{participant.participant_id}</span>
            <button
              onClick={() => copyId(participant.participant_id)}
              className="p-1 rounded text-cyan-400 hover:text-white"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 space-y-6">
        
        {/* Readonly Core Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block">Registered Email</span>
            <span className="text-slate-200 font-semibold truncate block">{participant.email}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Payment Status</span>
            <span className={`font-bold block ${participant.payment_status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {participant.payment_status}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Registration Source</span>
            <span className="text-cyan-300 font-medium block">{participant.registration_source}</span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">College / Institution</label>
              <input
                type="text"
                required
                value={formData.college}
                onChange={e => setFormData({ ...formData, college: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department / Course</label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={e => setFormData({ ...formData, course: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

          </div>

          {/* Custom Excel Fields if any */}
          {participant.custom_fields && Object.keys(participant.custom_fields).length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Additional Fields (from Excel / Registration)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(participant.custom_fields).map(([k, v]: any) => (
                  <div key={k} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <span className="text-slate-500 text-[11px] block">{k}</span>
                    <span className="text-slate-200 font-medium block">{String(v || 'N/A')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}

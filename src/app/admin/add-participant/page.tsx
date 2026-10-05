'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Sparkles,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AdminAddParticipantPage() {
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
    payment_status: 'PENDING',
    payment_reference: '',
    status: 'REGISTERED',
    participant_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent, forceDuplicate: boolean = false) => {
    if (e) e.preventDefault();
    setError(null);
    setDuplicateWarning(null);
    setLoading(true);

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          allow_duplicate: forceDuplicate,
          custom_fields: {}
        })
      });

      const data = await res.json();

      if (res.status === 409 && data.isDuplicate) {
        setDuplicateWarning(data);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add participant');
      }

      showToast({
        type: 'success',
        title: 'Participant Created',
        message: `${data.participant.full_name} (${data.participant.participant_id}) added.`
      });

      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Manual Participant Entry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create an official participant record directly in the database.
          </p>
        </div>
        <Link
          href="/admin"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Table</span>
        </Link>
      </div>

      {/* Duplicate Warning Prompt */}
      {duplicateWarning && (
        <div className="p-5 rounded-2xl bg-amber-950/60 border border-amber-600/80 text-xs text-amber-200 space-y-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-white">Possible Duplicate Registration Detected</div>
              <p className="mt-1 text-slate-300">
                A participant already exists matching this <strong>{duplicateWarning.matchedBy}</strong>:
              </p>
              <div className="mt-2 p-3 rounded-lg bg-black/40 border border-amber-800/60 font-mono text-[11px] text-amber-300">
                ID: {duplicateWarning.existingRecord.participant_id} • {duplicateWarning.existingRecord.full_name} • {duplicateWarning.existingRecord.email} • {duplicateWarning.existingRecord.phone}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700"
            >
              Cancel & Modify Info
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-400 hover:bg-amber-300 transition-colors"
            >
              Confirm and Add Anyway
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Entry Form */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 space-y-6">
        
        {/* Core Identity */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-slate-800 flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            <span>Identity & Contacts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Participant Name"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="9847123456"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Custom Participant ID (Optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank to auto-generate next VB26-XXXXX"
                value={formData.participant_id}
                onChange={e => setFormData({ ...formData, participant_id: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 font-mono text-cyan-300 placeholder-slate-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Academic Institution</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">College / Institution *</label>
              <input
                type="text"
                required
                value={formData.college}
                onChange={e => setFormData({ ...formData, college: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">Course / Department *</label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={e => setFormData({ ...formData, course: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Payment & Status */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-slate-800 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment & Registration Status</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Status</label>
              <select
                value={formData.payment_status}
                onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
              >
                <option value="PENDING">PENDING (Pay at Desk)</option>
                <option value="PAID">PAID (₹30 Collected)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Reference (UTR)</label>
              <input
                type="text"
                placeholder="UPI / Cash Desk receipt"
                value={formData.payment_reference}
                onChange={e => setFormData({ ...formData, payment_reference: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Participant Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
              >
                <option value="REGISTERED">REGISTERED</option>
                <option value="CHECKED_IN">CHECKED_IN</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <span>Saving to Database...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Save Participant Record</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}

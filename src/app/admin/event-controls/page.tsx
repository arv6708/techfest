'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Timer, 
  Play, 
  Square, 
  PlusCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  Trophy, 
  CreditCard, 
  History, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Radio,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { EventState } from '@/lib/types';

export default function EventControlsPage() {
  const { showToast } = useToast();

  const [config, setConfig] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [serverTime, setServerTime] = useState<string>('');

  const [formConfig, setFormConfig] = useState({
    state: 'PRE_EVENT',
    start_time: '',
    end_time: '',
    venue: '',
    fee: 30,
    prize_pool: 1000,
    challenge_brief: ''
  });

  const [customExtendMinutes, setCustomExtendMinutes] = useState('15');
  const isFormDirtyRef = useRef(false);

  const fetchEventData = async () => {
    try {
      const res = await fetch('/api/admin/event');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConfig(data.config);
      setAuditLogs(data.auditLogs || []);
      setServerTime(data.serverTime);

      // Only update formConfig if user isn't currently modifying the form inputs
      if (!isFormDirtyRef.current) {
        setFormConfig({
          state: data.config.state,
          start_time: data.config.start_time,
          end_time: data.config.end_time,
          venue: data.config.venue,
          fee: data.config.fee,
          prize_pool: data.config.prize_pool,
          challenge_brief: data.config.challenge_brief || ''
        });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
    const interval = setInterval(fetchEventData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyAction = async (action: string, extendMinutes?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/event', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, extendMinutes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast({
        type: 'success',
        title: 'Action Executed',
        message: data.message
      });

      isFormDirtyRef.current = false;
      await fetchEventData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStateChange = async (newState: EventState) => {
    setActionLoading(true);
    try {
      const action = newState === 'PRE_EVENT' ? 'RESET_TO_PRE_EVENT' : 'SET_STATE';
      const res = await fetch('/api/admin/event', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, state: newState })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast({
        type: 'success',
        title: 'Event State Updated',
        message: `State changed to ${newState}`
      });

      isFormDirtyRef.current = false;
      await fetchEventData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/event', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_CONFIG',
          ...formConfig
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast({
        type: 'success',
        title: 'Event Configuration Saved',
        message: 'Schedule and venue parameters updated.'
      });

      isFormDirtyRef.current = false;
      await fetchEventData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  const isLive = config?.state === 'LIVE';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Event Controls & Official Timer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Server-Authoritative Clock • Emergency Overrides • State Machine • Audit Logs
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-right">
          <span className="text-[10px] text-slate-500 font-mono block">Server Time (IST)</span>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {serverTime ? new Date(serverTime).toLocaleTimeString() : '...'}
          </span>
        </div>
      </div>

      {/* Emergency Control Center */}
      <div className="p-6 rounded-2xl bg-[#090d21] border border-amber-500/40 glow-gold space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300">
            Emergency Command Actions
          </h2>
        </div>

        <p className="text-xs text-slate-300">
          Immediate server-authoritative controls that affect all participant browsers simultaneously. Every execution is audited.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          {/* OPEN / GO LIVE */}
          <button
            type="button"
            disabled={actionLoading || isLive}
            onClick={() => handleEmergencyAction('OPEN')}
            className="p-3.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex flex-col items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>OPEN (Go Live Now)</span>
            <span className="text-[10px] font-normal opacity-80">Launches live sprint immediately</span>
          </button>

          {/* RESET TO PRE-EVENT */}
          <button
            type="button"
            disabled={actionLoading || config?.state === 'PRE_EVENT'}
            onClick={() => handleEmergencyAction('RESET_TO_PRE_EVENT')}
            className="p-3.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-500 transition-all flex flex-col items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RESET TO PRE-EVENT</span>
            <span className="text-[10px] font-normal opacity-80">Re-locks login • Resets to 7 Oct 10:30 AM</span>
          </button>

          {/* CLOSE NOW */}
          <button
            type="button"
            disabled={actionLoading || config?.state === 'SUBMISSION_CLOSED'}
            onClick={() => handleEmergencyAction('CLOSE')}
            className="p-3.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 transition-all flex flex-col items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>CLOSE (Emergency Stop)</span>
            <span className="text-[10px] font-normal opacity-80">Locks all submissions</span>
          </button>

        </div>
      </div>

      {/* Add Extra Time / Extend Sprint Module */}
      <div className="p-6 rounded-2xl glass-panel border border-blue-800/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
              Add Extra Time / Extend Deadline
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Current Deadline:</span>
            <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {config?.end_time ? new Date(config.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Quickly grant extra time to participants. If the event was closed or expired, extending automatically re-activates the event to <strong className="text-emerald-400">LIVE</strong> and synchronizes all participant timers in real time.
        </p>

        {/* Quick Extend Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {['5', '10', '15', '30', '60'].map(mins => (
            <button
              key={mins}
              type="button"
              disabled={actionLoading}
              onClick={() => handleEmergencyAction('EXTEND', mins)}
              className="py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/40 shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+{mins} Mins</span>
            </button>
          ))}
        </div>

        {/* Custom Extension Input */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
              Custom Extra Minutes:
            </label>
            <input
              type="number"
              min="1"
              max="240"
              value={customExtendMinutes}
              onChange={e => setCustomExtendMinutes(e.target.value)}
              className="w-28 bg-[#080d1e] border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
              placeholder="Minutes"
            />
          </div>
          <button
            type="button"
            disabled={actionLoading || !customExtendMinutes}
            onClick={() => handleEmergencyAction('EXTEND', customExtendMinutes)}
            className="w-full sm:w-auto px-5 py-2 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Add Custom Extra Time (+{customExtendMinutes}m)</span>
          </button>
        </div>
      </div>

      {/* 5 Event States Selector */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Radio className="w-4 h-4" />
            <span>Active Event Lifecycle State</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Current: <strong className="text-cyan-300 font-bold">{config?.state}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold">
          {(['PRE_EVENT', 'LIVE', 'SUBMISSION_CLOSED', 'JUDGING', 'RESULTS'] as EventState[]).map(st => {
            const isCurrent = config?.state === st;
            return (
              <button
                key={st}
                type="button"
                disabled={actionLoading}
                onClick={() => handleStateChange(st)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 glow-cyan ring-1 ring-cyan-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-mono text-slate-500 mb-0.5">State</div>
                <div>{st.replace('_', ' ')}</div>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400">
          Switching to <strong>PRE_EVENT</strong> resets the scheduled countdown back to Wednesday, 7 October 2026 at 10:30 AM IST and locks participant sign-in.
        </p>
      </div>

      {/* Schedule & Metadata Configuration Form */}
      <form onSubmit={handleSaveDetails} className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-slate-800 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Event Timings & Specifications</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Start Time (ISO / String)</label>
            <input
              type="text"
              required
              value={formConfig.start_time}
              onChange={e => {
                isFormDirtyRef.current = true;
                setFormConfig({ ...formConfig, start_time: e.target.value });
              }}
              className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 font-mono text-white outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">End Time / Deadline (ISO / String)</label>
            <input
              type="text"
              required
              value={formConfig.end_time}
              onChange={e => {
                isFormDirtyRef.current = true;
                setFormConfig({ ...formConfig, end_time: e.target.value });
              }}
              className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 font-mono text-white outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Official Venue</label>
            <input
              type="text"
              required
              value={formConfig.venue}
              onChange={e => {
                isFormDirtyRef.current = true;
                setFormConfig({ ...formConfig, venue: e.target.value });
              }}
              className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Fee (₹)</label>
              <input
                type="number"
                required
                value={formConfig.fee}
                onChange={e => {
                  isFormDirtyRef.current = true;
                  setFormConfig({ ...formConfig, fee: Number(e.target.value) });
                }}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Prize Pool (₹)</label>
              <input
                type="number"
                required
                value={formConfig.prize_pool}
                onChange={e => {
                  isFormDirtyRef.current = true;
                  setFormConfig({ ...formConfig, prize_pool: Number(e.target.value) });
                }}
                className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-300">Challenge Brief / Problem Statement</label>
              <span className="text-[10px] text-amber-400">Only revealed after participant login</span>
            </div>
            <textarea
              rows={4}
              value={formConfig.challenge_brief}
              onChange={e => {
                isFormDirtyRef.current = true;
                setFormConfig({ ...formConfig, challenge_brief: e.target.value });
              }}
              className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-white outline-none leading-relaxed"
            />
          </div>

        </div>

        <button
          type="submit"
          disabled={actionLoading}
          className="py-3 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>Save Specifications</span>
        </button>
      </form>

      {/* Audit Logs Trail */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
          <History className="w-4 h-4" />
          <span>Clock & Emergency Execution Audit Trail</span>
        </h3>

        <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto pr-2 scrollbar-thin">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center font-mono">No audit logs recorded yet.</p>
          ) : (
            auditLogs.map((log: any) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px] border border-amber-500/20">
                      {log.action}
                    </span>
                    <span className="text-slate-400 text-[11px]">{log.details}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 text-[10px] font-mono text-slate-500">
                  <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div className="text-slate-600">by {log.actor}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

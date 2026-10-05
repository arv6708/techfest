'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Users, 
  CreditCard, 
  Clock, 
  FileCode, 
  Building2, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AnalyticsPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/participants/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  const total = stats?.totalRegistered || 1;
  const paidPct = Math.round(((stats?.paidCount || 0) / total) * 100);
  const pendingPct = 100 - paidPct;

  const subPct = Math.round(((stats?.submissionsCount || 0) / total) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Competition Intelligence & Analytics</h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics on registration sources, college turnout, fee reconciliation, and submissions.
        </p>
      </div>

      {/* Top 4 Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Total Registration</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-mono font-black text-white">{stats?.totalRegistered}</div>
          <span className="text-[10px] text-cyan-400 mt-1 block">Active Competitors</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Payment Ratio</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-black text-emerald-400">{paidPct}%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">{stats?.paidCount} Paid • {stats?.pendingCount} Pending</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Colleges Represented</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-mono font-black text-indigo-300">{stats?.collegesCount}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Institutions Turnout</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Submissions Rate</span>
            <FileCode className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-mono font-black text-purple-300">{stats?.submissionsCount}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">{subPct}% of participants</span>
        </div>

      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Colleges Chart */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Turnout by College / Institution</span>
          </h3>

          <div className="space-y-3 pt-2">
            {stats?.collegeBreakdown?.map((item: any, idx: number) => {
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-medium truncate max-w-[280px]" title={item.college}>
                      {item.college}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {item.count} <span className="text-slate-500 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registration Source Breakdown */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Registration Channel Distribution</span>
          </h3>

          <div className="space-y-3 pt-2">
            {stats?.sourceBreakdown?.map((item: any, idx: number) => {
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-medium">{item.registration_source}</span>
                    <span className="font-mono font-bold text-white">
                      {item.count} <span className="text-slate-500 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Channels: Website (Live Public Portal), Excel Import (Bulk Spreadsheet), Manual Entry (Admin Desk), and Google Form Sync.
          </div>
        </div>

      </div>

    </div>
  );
}

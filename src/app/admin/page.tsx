'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Clock, 
  FileCode, 
  Building2, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  UserPlus, 
  UploadCloud, 
  RefreshCw,
  X,
  Save,
  Check,
  ExternalLink,
  Layers,
  History,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Participant, PaymentStatus } from '@/lib/types';

export default function AdminDashboardPage() {
  const { showToast } = useToast();

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const previousTotalRef = useRef<number | null>(null);

  // Participants list state
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [submissionFilter, setSubmissionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Selected participants for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [viewParticipant, setViewParticipant] = useState<any | null>(null);
  const [viewHistory, setViewHistory] = useState<any[]>([]);
  const [editParticipant, setEditParticipant] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // 1. Fetch Stats & Check for new registrations (live polling)
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/participants/stats');
      if (!res.ok) return;
      const data = await res.json();
      
      // Live Toast alert when new registration arrives!
      if (previousTotalRef.current !== null && data.totalRegistered > previousTotalRef.current) {
        const latest = data.recentRegistrations?.[0];
        showToast({
          type: 'registration',
          title: 'New Registration Received!',
          message: latest ? `${latest.full_name} (${latest.participant_id}) from ${latest.college}` : `Total participants now: ${data.totalRegistered}`
        });
        // Auto refresh table
        fetchParticipants();
      }
      
      previousTotalRef.current = data.totalRegistered;
      setStats(data);
    } catch {}
  }, [showToast]);

  // 2. Fetch Participants Table
  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        payment: paymentFilter,
        status: statusFilter,
        source: sourceFilter,
        submission: submissionFilter,
        sortBy,
        sortOrder,
        page: String(page),
        limit: String(limit)
      });

      const res = await fetch(`/api/participants?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) return;
        throw new Error('Failed to load participants');
      }
      const data = await res.json();

      setParticipants(data.participants || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [search, paymentFilter, statusFilter, sourceFilter, submissionFilter, sortBy, sortOrder, page, limit, showToast]);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchParticipants();

    // 4-second live polling interval
    const interval = setInterval(fetchStats, 4500);
    return () => clearInterval(interval);
  }, [fetchStats, fetchParticipants]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchParticipants();
    }, 300);
    return () => clearTimeout(handler);
  }, [search, paymentFilter, statusFilter, sourceFilter, submissionFilter, sortBy, sortOrder]);

  // View modal fetch
  const handleOpenView = async (p: any) => {
    setViewParticipant(p);
    try {
      const res = await fetch(`/api/participants/${p.id}`);
      const data = await res.json();
      if (data.participant) {
        setViewParticipant(data.participant);
        setViewHistory(data.history || []);
      }
    } catch {}
  };

  // Quick Payment status toggle
  const handleQuickPayment = async (p: any, newStatus: PaymentStatus) => {
    try {
      const res = await fetch(`/api/participants/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update payment status');
      
      showToast({
        type: 'success',
        title: 'Payment Status Updated',
        message: `${p.participant_id} marked as ${newStatus}`
      });
      fetchParticipants();
      fetchStats();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  // Delete participant
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete participant');

      showToast({ type: 'info', title: 'Participant Deleted', message: 'Record removed from database.' });
      setDeleteConfirmId(null);
      fetchParticipants();
      fetchStats();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  // Save edit form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editParticipant) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/participants/${editParticipant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editParticipant)
      });
      if (!res.ok) throw new Error('Failed to update participant');

      showToast({ type: 'success', title: 'Participant Updated', message: `${editParticipant.participant_id} saved.` });
      setEditParticipant(null);
      fetchParticipants();
      fetchStats();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedIds.length === participants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(participants.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Bulk mark paid
  const handleBulkMarkPaid = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Mark ${selectedIds.length} selected participants as PAID?`)) return;

    for (const id of selectedIds) {
      await fetch(`/api/participants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'PAID' })
      });
    }

    showToast({ type: 'success', title: 'Bulk Update', message: `${selectedIds.length} participants marked as PAID.` });
    setSelectedIds([]);
    fetchParticipants();
    fetchStats();
  };

  return (
    <div className="space-y-8">
      
      {/* 6 Key Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="p-4 rounded-xl glass-panel border border-slate-800 hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Registered</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {stats?.totalRegistered ?? '...'}
          </div>
          <span className="text-[10px] text-cyan-400 font-semibold block mt-1">● Live Database</span>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Reg.</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-300">
            {stats?.todayRegistrations ?? '...'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Current Calendar Day</span>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Paid</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">
            {stats?.paidCount ?? '...'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">₹30 Collected</span>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Payment</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-amber-300">
            {stats?.pendingCount ?? '...'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Awaiting Desk Collection</span>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Submissions</span>
            <FileCode className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-purple-300">
            {stats?.submissionsCount ?? '...'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Final Projects</span>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-slate-800 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Colleges</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-indigo-300">
            {stats?.collegesCount ?? '...'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Distinct Institutions</span>
        </div>

      </div>

      {/* Control Bar: Search, Filters & Actions */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Name, Participant ID (VB26-...), Email, Phone, College..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Actions buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/add-participant"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Participant</span>
            </Link>

            <Link
              href="/admin/import"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import Excel</span>
            </Link>

            <a
              href={`/api/export?type=filtered&search=${encodeURIComponent(search)}&payment=${paymentFilter}&status=${statusFilter}&source=${sourceFilter}`}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center gap-1.5"
              title="Export Current View"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </a>

            <button
              onClick={() => { fetchParticipants(); fetchStats(); }}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          
          {/* Payment filter */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Payment</label>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full bg-[#080d1e] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">Paid Only</option>
              <option value="PENDING">Pending Payment</option>
            </select>
          </div>

          {/* Registration Source filter */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="w-full bg-[#080d1e] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="ALL">All Sources</option>
              <option value="Website">Website</option>
              <option value="Excel Import">Excel Import</option>
              <option value="Manual Entry">Manual Entry</option>
              <option value="Google Form">Google Form</option>
            </select>
          </div>

          {/* Submission Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Submission</label>
            <select
              value={submissionFilter}
              onChange={e => setSubmissionFilter(e.target.value)}
              className="w-full bg-[#080d1e] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="ALL">All Submissions</option>
              <option value="SUBMITTED">Submitted Project</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#080d1e] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="REGISTERED">Registered</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="DISQUALIFIED">Disqualified</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Sort</label>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={e => {
                const val = e.target.value;
                if (val === 'created_at_DESC') { setSortBy('created_at'); setSortOrder('DESC'); }
                else if (val === 'created_at_ASC') { setSortBy('created_at'); setSortOrder('ASC'); }
                else if (val === 'full_name_ASC') { setSortBy('full_name'); setSortOrder('ASC'); }
                else if (val === 'college_ASC') { setSortBy('college'); setSortOrder('ASC'); }
                else if (val === 'participant_id_ASC') { setSortBy('participant_id'); setSortOrder('ASC'); }
              }}
              className="w-full bg-[#080d1e] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="created_at_DESC">Newest First</option>
              <option value="created_at_ASC">Oldest First</option>
              <option value="full_name_ASC">Name (A - Z)</option>
              <option value="college_ASC">College (A - Z)</option>
              <option value="participant_id_ASC">Participant ID</option>
            </select>
          </div>

        </div>

      </div>

      {/* Bulk action ribbon if items selected */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-800 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{selectedIds.length} participants selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkMarkPaid}
              className="px-3 py-1.5 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
            >
              Mark Selected as PAID
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080d21] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={participants.length > 0 && selectedIds.length === participants.length}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-900 border-slate-700"
                  />
                </th>
                <th className="py-3 px-3">Participant ID</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">College & Course</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                      <span>Loading participants...</span>
                    </div>
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No participants found matching the current search & filter criteria.
                  </td>
                </tr>
              ) : (
                participants.map(p => {
                  const isPaid = p.payment_status === 'PAID';
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-blue-950/20' : ''}`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(p.id)}
                          className="rounded bg-slate-900 border-slate-700"
                        />
                      </td>

                      {/* Participant ID */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-cyan-300 text-xs bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                          {p.participant_id}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{p.full_name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{p.email}</div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                        {p.phone}
                      </td>

                      {/* College & Course */}
                      <td className="py-3 px-3 max-w-[220px]">
                        <div className="font-medium text-slate-200 truncate" title={p.college}>
                          {p.college}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {p.course}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80' 
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {p.payment_status}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-300 font-medium">
                          {p.status}
                        </span>
                        {p.submission_status === 'SUBMITTED' && (
                          <span className="block text-[9px] font-bold text-purple-400 uppercase">
                            Submitted
                          </span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          {p.registration_source}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          
                          {/* Toggle Payment */}
                          {isPaid ? (
                            <button
                              onClick={() => handleQuickPayment(p, 'PENDING')}
                              className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-amber-950/40"
                              title="Mark as PENDING"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleQuickPayment(p, 'PAID')}
                              className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40"
                              title="Mark as PAID"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Profile */}
                          <button
                            onClick={() => handleOpenView(p)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/40"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditParticipant(p)}
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-950/40"
                            title="Edit Participant"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-[#080d21] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{participants.length}</strong> of{' '}
            <strong className="text-white">{totalCount}</strong> participants
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none"
            >
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* VIEW PARTICIPANT DOSSIER MODAL */}
      {viewParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl glass-panel-elevated border border-slate-700 p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Participant Profile</span>
                <h3 className="text-xl font-bold text-white">{viewParticipant.full_name}</h3>
              </div>
              <button
                onClick={() => setViewParticipant(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dossier Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block">Participant ID</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">{viewParticipant.participant_id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block">Payment Status</span>
                <span className={`font-bold text-sm ${viewParticipant.payment_status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {viewParticipant.payment_status}
                </span>
                {viewParticipant.payment_reference && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">Ref: {viewParticipant.payment_reference}</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block">Email Address</span>
                <span className="text-white font-medium">{viewParticipant.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone</span>
                <span className="text-white font-medium">{viewParticipant.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">College / Institution</span>
                <span className="text-white font-medium">{viewParticipant.college}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Course / Department</span>
                <span className="text-white font-medium">{viewParticipant.course}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Location</span>
                <span className="text-white font-medium">{viewParticipant.district}, {viewParticipant.state}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Registration Source</span>
                <span className="text-cyan-300 font-medium">{viewParticipant.registration_source}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Registered At</span>
                <span className="text-slate-300 font-mono text-[11px]">{viewParticipant.registration_date}</span>
              </div>
            </div>

            {/* Custom Excel Fields */}
            {viewParticipant.custom_fields && Object.keys(viewParticipant.custom_fields).length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Preserved Custom Fields (from Excel / Registration)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(viewParticipant.custom_fields).map(([k, v]: any) => (
                    <div key={k} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-slate-500 text-[11px] block">{k}</span>
                      <span className="text-slate-200 font-medium block">{String(v || 'N/A')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit History */}
            {viewHistory.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  <span>Activity & Audit Trail</span>
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {viewHistory.map((item, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[11px] flex justify-between">
                      <span className="text-slate-300 font-medium">{item.details}</span>
                      <span className="text-slate-500 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewParticipant(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT PARTICIPANT MODAL */}
      {editParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl glass-panel-elevated border border-slate-700 p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Admin Edit</span>
                <h3 className="text-lg font-bold text-white">Edit Participant: {editParticipant.participant_id}</h3>
              </div>
              <button
                onClick={() => setEditParticipant(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editParticipant.full_name}
                    onChange={e => setEditParticipant({ ...editParticipant, full_name: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editParticipant.email}
                    onChange={e => setEditParticipant({ ...editParticipant, email: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editParticipant.phone}
                    onChange={e => setEditParticipant({ ...editParticipant, phone: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Status</label>
                  <select
                    value={editParticipant.payment_status}
                    onChange={e => setEditParticipant({ ...editParticipant, payment_status: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">College</label>
                  <input
                    type="text"
                    required
                    value={editParticipant.college}
                    onChange={e => setEditParticipant({ ...editParticipant, college: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department / Course</label>
                  <input
                    type="text"
                    required
                    value={editParticipant.course}
                    onChange={e => setEditParticipant({ ...editParticipant, course: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>


                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Reference (UTR)</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/42910481028"
                    value={editParticipant.payment_reference || ''}
                    onChange={e => setEditParticipant({ ...editParticipant, payment_reference: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Participant Status</label>
                  <select
                    value={editParticipant.status}
                    onChange={e => setEditParticipant({ ...editParticipant, status: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="REGISTERED">REGISTERED</option>
                    <option value="CHECKED_IN">CHECKED_IN</option>
                    <option value="DISQUALIFIED">DISQUALIFIED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditParticipant(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Saving...' : 'Save Participant'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl glass-panel-elevated border border-rose-800 p-6 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Delete Participant?</h3>
            <p className="text-xs text-slate-300">
              This action permanently deletes this record and any linked submissions from the database.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

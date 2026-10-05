'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileCode, 
  Globe, 
  Video, 
  Bot, 
  Search, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  X,
  Trash2
} from 'lucide-react';
import GithubIcon from '@/components/GithubIcon';
import { useToast } from '@/components/Toast';

export default function AdminSubmissionsPage() {
  const { showToast } = useToast();

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/submissions');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSubmissions(data.submissions || []);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleDeleteSubmission = async (sub: any) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete submission "${sub.project_name || 'Untitled'}" for participant ${sub.participant_id} (${sub.full_name})?\n\nThis will remove the project repository links and AI disclosures from the database.`
    );
    if (!confirmDelete) return;

    setDeletingId(sub.id);
    try {
      const res = await fetch(`/api/submissions?id=${sub.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete submission');

      showToast({
        type: 'success',
        title: 'Submission Deleted',
        message: `Submission for ${sub.participant_id} was successfully removed.`
      });

      setSubmissions(prev => prev.filter(s => s.id !== sub.id));
      if (selectedSub?.id === sub.id) {
        setSelectedSub(null);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = submissions.filter(s => {
    const q = search.toLowerCase();
    return (
      s.project_name?.toLowerCase().includes(q) ||
      s.full_name?.toLowerCase().includes(q) ||
      s.participant_id?.toLowerCase().includes(q) ||
      s.college?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Project Submissions Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review live entries, GitHub code repositories, and AI tool disclosures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/export?type=submissions&format=xlsx"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center gap-1.5"
          >
            <span>Export Submissions (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter by Project, Name, Participant ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
        />
      </div>

      {/* Submissions Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          Loading competition submissions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl glass-panel border border-slate-800 text-center text-slate-400 text-xs">
          No project submissions found yet. Entries will appear here as participants submit their repositories.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(sub => (
            <div
              key={sub.id}
              className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {sub.participant_id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    sub.status === 'SUBMITTED' ? 'bg-emerald-950 text-emerald-300' : 'bg-blue-950 text-blue-300'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">{sub.project_name}</h3>
                <div className="text-xs text-slate-400 mt-0.5">{sub.full_name} • {sub.college}</div>

                <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                  {sub.project_description}
                </p>

                {sub.technologies_used && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {sub.technologies_used.split(',').map((t: string, i: number) => (
                      <span key={i} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {sub.github_url && (
                    <a
                      href={sub.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                      title="GitHub Repository"
                    >
                      <GithubIcon className="w-4 h-4" />
                    </a>
                  )}
                  {sub.live_website_url && (
                    <a
                      href={sub.live_website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-800"
                      title="Live Deployment"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {sub.ai_tools_used && (
                    <span
                      className="p-1.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-800/60"
                      title={`AI Tools: ${sub.ai_tools_used}`}
                    >
                      <Bot className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSubmission(sub)}
                    disabled={deletingId === sub.id}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/80 border border-slate-800 hover:border-rose-700/80 transition-all"
                    title="Delete Submission"
                  >
                    {deletingId === sub.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin inline-block" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INSPECT SUBMISSION MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl glass-panel-elevated border border-slate-700 p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400">
                  {selectedSub.participant_id} • {selectedSub.full_name}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedSub.project_name}</h3>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block mb-1">Project Description</span>
                <p className="text-slate-200 leading-relaxed bg-[#080d21] p-3 rounded-xl border border-slate-800">
                  {selectedSub.project_description}
                </p>
              </div>

              {selectedSub.problem_solved && (
                <div>
                  <span className="text-cyan-400 font-bold block mb-1">What Problem Does It Solve?</span>
                  <p className="text-slate-200 leading-relaxed bg-[#080d21] p-3 rounded-xl border border-cyan-500/30">
                    {selectedSub.problem_solved}
                  </p>
                </div>
              )}

              {selectedSub.key_features && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Key Features</span>
                  <p className="text-slate-200 leading-relaxed bg-[#080d21] p-3 rounded-xl border border-slate-800">
                    {selectedSub.key_features}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block">GitHub Repository</span>
                  {selectedSub.github_url ? (
                    <a
                      href={selectedSub.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold mt-1"
                    >
                      <span>Open Repository</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : 'Not provided'}
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block">Live Deployment</span>
                  {selectedSub.live_website_url ? (
                    <a
                      href={selectedSub.live_website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold mt-1"
                    >
                      <span>Open Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : 'Not deployed'}
                </div>
              </div>

              {selectedSub.ai_tools_used && (
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50">
                  <div className="flex items-center gap-1.5 font-bold text-purple-300 mb-1">
                    <Bot className="w-4 h-4" />
                    <span>AI Tool Disclosure: {selectedSub.ai_tools_used}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {selectedSub.ai_usage_description || 'No detailed workflow provided.'}
                  </p>
                </div>
              )}

              <div className="text-[11px] text-slate-500 font-mono">
                Submitted At: {selectedSub.submitted_at ? new Date(selectedSub.submitted_at).toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleDeleteSubmission(selectedSub)}
                disabled={deletingId === selectedSub.id}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {deletingId === selectedSub.id ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin inline-block" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Submission</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedSub(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

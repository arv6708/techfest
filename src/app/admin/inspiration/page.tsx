'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Lightbulb, 
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Search,
  ExternalLink,
  Flame,
  Shuffle
} from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Idea {
  id: string;
  title: string;
  slug: string;
  short_problem?: string;
  description: string;
  possible_directions: string[];
  display_order: number;
  is_active: boolean | number;
}

export default function AdminInspirationPage() {
  const { showToast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    short_problem: '',
    description: '',
    possible_directions_text: '',
    display_order: 1,
    is_active: true
  });

  const fetchIdeas = async () => {
    try {
      const res = await fetch('/api/ideas');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIdeas(data.ideas || []);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const openCreateModal = () => {
    setFormData({
      title: '',
      slug: '',
      short_problem: '',
      description: '',
      possible_directions_text: '',
      display_order: ideas.length + 1,
      is_active: true
    });
    setIsCreating(true);
    setEditingIdea(null);
  };

  const openEditModal = (idea: Idea) => {
    setEditingIdea(idea);
    setFormData({
      title: idea.title,
      slug: idea.slug,
      short_problem: idea.short_problem || '',
      description: idea.description,
      possible_directions_text: (idea.possible_directions || []).join('\n'),
      display_order: idea.display_order,
      is_active: Boolean(idea.is_active)
    });
    setIsCreating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const directions = formData.possible_directions_text
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      if (editingIdea) {
        // Update
        const res = await fetch('/api/ideas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingIdea.id,
            title: formData.title,
            slug: formData.slug,
            short_problem: formData.short_problem,
            description: formData.description,
            possible_directions: directions,
            display_order: formData.display_order,
            is_active: formData.is_active
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast({ type: 'success', title: 'Idea Updated', message: `Saved changes to ${formData.title}` });
      } else {
        // Create
        const res = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            slug: formData.slug,
            short_problem: formData.short_problem,
            description: formData.description,
            possible_directions: directions,
            display_order: formData.display_order,
            is_active: formData.is_active
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast({ type: 'success', title: 'Idea Created', message: `Added ${formData.title} to inspiration cards` });
      }

      setEditingIdea(null);
      setIsCreating(false);
      fetchIdeas();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (idea: Idea) => {
    const newStatus = !idea.is_active;
    try {
      const res = await fetch('/api/ideas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: idea.id,
          is_active: newStatus
        })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, is_active: newStatus } : i));
      showToast({
        type: 'success',
        title: newStatus ? 'Idea Visible' : 'Idea Hidden',
        message: `${idea.title} is now ${newStatus ? 'visible to participants' : 'hidden from participants'}.`
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleMoveOrder = async (idea: Idea, direction: 'UP' | 'DOWN') => {
    const currentIndex = ideas.findIndex(i => i.id === idea.id);
    if (direction === 'UP' && currentIndex === 0) return;
    if (direction === 'DOWN' && currentIndex === ideas.length - 1) return;

    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    const targetIdea = ideas[targetIndex];

    const newCurrentOrder = targetIdea.display_order;
    const newTargetOrder = idea.display_order;

    try {
      await Promise.all([
        fetch('/api/ideas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: idea.id, display_order: newCurrentOrder })
        }),
        fetch('/api/ideas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetIdea.id, display_order: newTargetOrder })
        })
      ]);
      fetchIdeas();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Order Update Failed', message: err.message });
    }
  };

  const handleDelete = async (idea: Idea) => {
    if (!window.confirm(`Are you sure you want to delete idea "${idea.title}"?`)) return;

    try {
      const res = await fetch(`/api/ideas?id=${idea.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showToast({ type: 'success', title: 'Idea Deleted', message: `Deleted ${idea.title}` });
      fetchIdeas();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Ideas & Inspiration Manager</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800">
              Open-Ended Suggestions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage suggested real-world problems and directions shown to inspire participants during the event.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Idea</span>
        </button>
      </div>

      {/* Important Disclaimer Notice Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-indigo-950/40 border border-cyan-500/30 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-cyan-300">
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>VibeCode Architecture Rule: Suggestions Only, Never Required</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          These ideas are strictly examples to help participants who don't already have a concept. Participants are <strong>never required to choose or lock in an idea</strong>, and can build any creative, useful website they want. Ideas are never attached to participant accounts.
        </p>
      </div>

      {/* Ideas Table / Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-mono">
          Loading inspiration database...
        </div>
      ) : ideas.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800 space-y-3">
          <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Inspiration Ideas Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "Add New Idea" above to publish suggested real-world problems for participants.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Ideas: <strong className="text-white">{ideas.length}</strong> (Active: <strong className="text-emerald-400">{ideas.filter(i => i.is_active).length}</strong>)</span>
            <span className="text-[11px] text-slate-500">Order controls presentation sequence</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {ideas.map((idea, idx) => (
              <div
                key={idea.id}
                className={`p-5 rounded-2xl glass-panel border transition-all ${
                  idea.is_active 
                    ? 'border-slate-800 hover:border-cyan-500/30' 
                    : 'border-slate-800/60 opacity-60 bg-slate-950/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  
                  {/* Left: Content */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                        #{idea.display_order}
                      </span>
                      <h3 className="text-base font-black text-white tracking-wide">
                        {idea.title}
                      </h3>
                      {idea.short_problem && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                          {idea.short_problem}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        idea.is_active 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {idea.is_active ? 'ACTIVE / VISIBLE' : 'HIDDEN'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {idea.description}
                    </p>

                    {idea.possible_directions && idea.possible_directions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Possible directions:</span>
                        {idea.possible_directions.map((dir, dIdx) => (
                          <span
                            key={dIdx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#0a0f26] border border-slate-800 text-slate-300"
                          >
                            {dir}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800 w-full lg:w-auto justify-end">
                    
                    {/* Reorder Buttons */}
                    <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-0.5">
                      <button
                        onClick={() => handleMoveOrder(idea, 'UP')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(idea, 'DOWN')}
                        disabled={idx === ideas.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggleActive(idea)}
                      title={idea.is_active ? 'Hide idea from participants' : 'Show idea to participants'}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
                        idea.is_active 
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700' 
                          : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {idea.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{idea.is_active ? 'Hide' : 'Publish'}</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(idea)}
                      className="p-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(idea)}
                      className="p-2 rounded-xl text-xs text-rose-400 hover:text-white hover:bg-rose-950 border border-slate-800 hover:border-rose-800 transition-colors"
                      title="Delete idea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(isCreating || editingIdea) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-2xl glass-panel-elevated border border-slate-700 p-6 space-y-5">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">
                  {editingIdea ? `Edit Idea: ${editingIdea.title}` : 'Add Inspiration Idea'}
                </h3>
              </div>
              <button
                onClick={() => { setIsCreating(false); setEditingIdea(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Title (e.g. FOODRESCUE) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FOODRESCUE"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Short Problem / Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reduce Food Waste"
                    value={formData.short_problem}
                    onChange={e => setFormData({ ...formData, short_problem: e.target.value })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Build a website that could help reduce food waste by connecting surplus food with people..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Possible Directions (One per line)
                </label>
                <textarea
                  rows={4}
                  placeholder={`Surplus food sharing\nPickup coordination\nVolunteer support\nFood availability\nCommunity participation`}
                  value={formData.possible_directions_text}
                  onChange={e => setFormData({ ...formData, possible_directions_text: e.target.value })}
                  className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-white outline-none font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Each line will render as a distinct suggestion tag.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Status
                  </label>
                  <select
                    value={formData.is_active ? '1' : '0'}
                    onChange={e => setFormData({ ...formData, is_active: e.target.value === '1' })}
                    className="w-full bg-[#080d1e] border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white outline-none"
                  >
                    <option value="1">Active / Published</option>
                    <option value="0">Hidden / Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingIdea(null); }}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingIdea ? 'Update Idea' : 'Create Idea'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

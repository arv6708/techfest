'use client';

import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  CreditCard, 
  Clock, 
  FileCode, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function AdminExportPage() {
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv'>('xlsx');

  const exportOptions = [
    {
      id: 'all',
      title: 'All Registered Participants',
      desc: 'Complete database roster including all contact info, academic details, and expanded custom fields.',
      icon: Layers,
      color: 'blue'
    },
    {
      id: 'paid',
      title: 'Paid Participants Only',
      desc: 'Filtered list of participants whose fee (₹30) has been marked as PAID with transaction references.',
      icon: CheckCircle2,
      color: 'emerald'
    },
    {
      id: 'pending',
      title: 'Pending Payment Participants',
      desc: 'Participants who are registered but have not yet completed payment at the admin desk.',
      icon: Clock,
      color: 'amber'
    },
    {
      id: 'submissions',
      title: 'Competition Submissions',
      desc: 'Detailed log of submitted projects, repository URLs, deployment links, and AI tool disclosures.',
      icon: FileCode,
      color: 'purple'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">Export Competition Data</h1>
        <p className="text-xs text-slate-400 mt-1">
          Generate production-ready Excel (.xlsx) and CSV spreadsheets. Every custom Excel column is preserved and unpacked.
        </p>
      </div>

      {/* Format Selector */}
      <div className="p-4 rounded-xl glass-panel border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white">Target Format:</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedFormat('xlsx')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedFormat === 'xlsx'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Microsoft Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => setSelectedFormat('csv')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedFormat === 'csv'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            CSV Format (.csv)
          </button>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportOptions.map(opt => {
          const Icon = opt.icon;
          const href = `/api/export?type=${opt.id}&format=${selectedFormat}`;

          return (
            <div
              key={opt.id}
              className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-cyan-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">{opt.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 uppercase">
                  Format: {selectedFormat.toUpperCase()}
                </span>
                <a
                  href={href}
                  download
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

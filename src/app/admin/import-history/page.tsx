'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, FileSpreadsheet, Calendar, User, ArrowLeft, UploadCloud } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ImportHistoryPage() {
  const { showToast } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/import/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Excel & CSV Import History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit log of all file uploads, duplicate resolutions, and rows inserted into the live database.
          </p>
        </div>

        <Link
          href="/admin/import"
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all flex items-center gap-1.5"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>New Excel Import</span>
        </Link>
      </div>

      {/* History Table */}
      <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080d21] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Imported By</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-center">Processed</th>
                <th className="py-3 px-4 text-center">Added</th>
                <th className="py-3 px-4 text-center">Updated</th>
                <th className="py-3 px-4 text-center">Duplicates</th>
                <th className="py-3 px-4 text-center">Invalid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300 text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading import history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No import history records found.
                  </td>
                </tr>
              ) : (
                history.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      <span>{item.file_name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {item.imported_by}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(item.date).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-center font-bold text-white">
                      {item.rows_processed}
                    </td>
                    <td className="py-3 px-4 font-mono text-center font-bold text-emerald-400">
                      {item.rows_added}
                    </td>
                    <td className="py-3 px-4 font-mono text-center font-bold text-blue-400">
                      {item.rows_updated}
                    </td>
                    <td className="py-3 px-4 font-mono text-center font-bold text-amber-400">
                      {item.duplicates}
                    </td>
                    <td className="py-3 px-4 font-mono text-center font-bold text-rose-400">
                      {item.invalid_rows}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, 
  UploadCloud, 
  UserPlus, 
  Timer, 
  FileCode, 
  History, 
  Download, 
  BarChart3, 
  ShieldCheck,
  AlertTriangle,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eventConfig, setEventConfig] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (!data.authenticated || data.user?.role !== 'ADMIN') {
          router.replace('/login?tab=admin');
          return;
        }
        setAdminUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          router.replace('/login?tab=admin');
        }
      });

    fetch('/api/event/status')
      .then(res => res.json())
      .then(data => {
        if (isMounted) setEventConfig(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Verifying Admin Credentials...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Participants', href: '/admin', icon: Users },
    { label: 'Import Excel', href: '/admin/import', icon: UploadCloud },
    { label: 'Add Participant', href: '/admin/add-participant', icon: UserPlus },
    { label: 'Event Controls & Timer', href: '/admin/event-controls', icon: Timer },
    { label: 'Ideas & Inspiration', href: '/admin/inspiration', icon: Sparkles },
    { label: 'Submissions', href: '/admin/submissions', icon: FileCode },
    { label: 'Export Data', href: '/admin/export', icon: Download },
    { label: 'Import History', href: '/admin/import-history', icon: History },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100">
      
      {/* Admin Subheader Bar */}
      <div className="border-b border-slate-800 bg-[#080d21]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">ADMIN COMMAND CENTER</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80">
                  TANTRA’26
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Department of Computer Science and Engineering, VJEC
              </p>
            </div>
          </div>

          {/* Quick Event State indicator & Emergency shortcut */}
          <div className="flex items-center gap-3">
            {eventConfig?.config && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <Radio className={`w-3.5 h-3.5 ${eventConfig.isLive ? 'text-emerald-400 animate-pulse' : 'text-blue-400'}`} />
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-slate-200">{eventConfig.config.state.replace('_', ' ')}</span>
              </div>
            )}
            <Link
              href="/admin/event-controls"
              className="px-3 py-1 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/50 transition-all flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Clock & Emergency</span>
            </Link>
          </div>

        </div>

        {/* Admin Navigation Pills */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Admin Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

    </div>
  );
}

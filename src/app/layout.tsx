import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: "VIBECODE: BUILD BEYOND BOUNDARIES | TANTRA'26",
  description: "Official 90-minute individual hackathon challenge of TANTRA'26, Department of Computer Science and Engineering, Vimal Jyothi Engineering College.",
  keywords: ["VibeCode", "TANTRA 26", "VJEC", "Hackathon", "Computer Science", "Coding Competition", "Vimal Jyothi"],
  authors: [{ name: "Department of Computer Science & Engineering, VJEC" }]
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#060913] text-slate-100 cyber-grid flex flex-col min-h-screen">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="glass-panel border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:items-start text-left">
                <span className="font-bold text-slate-200 tracking-wider">VIBECODE • TANTRA’26</span>
                <span className="text-[11px] text-slate-500">Department of Computer Science and Engineering</span>
                <span className="text-[11px] text-slate-500">Vimal Jyothi Engineering College, Chemperi, Kannur</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span>Date: 7 October 2026</span>
                <span>•</span>
                <span>Venue: Admin Block</span>
                <span>•</span>
                <span>Prize Pool: ₹1,000</span>
              </div>
              <div className="text-[11px] text-slate-500">
                © 2026 Tantra CSE VJEC. All rights reserved.
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}

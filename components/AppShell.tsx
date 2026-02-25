'use client';
import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LicenseStatus } from '@/lib/types';

interface NavItem { href: string; label: string; icon: React.ReactNode; }

const NAV: NavItem[] = [
  {
    href: '/dashboard', label: 'Dashboard',
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: '/answers', label: 'Answer Library',
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    href: '/evidence', label: 'Evidence Catalog',
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>,
  },
  {
    href: '/questionnaires', label: 'Questionnaires',
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  },
  {
    href: '/settings', label: 'Settings',
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

interface AppShellProps {
  children: React.ReactNode;
  license?: LicenseStatus;
  username?: string;
  avatar?: string;
  selectedRepo?: string;
}

function SidebarContent({
  sidebarOpen,
  license,
  username,
  avatar,
  selectedRepo,
  onClose,
  onLogout,
}: {
  sidebarOpen: boolean;
  license?: LicenseStatus;
  username?: string;
  avatar?: string;
  selectedRepo?: string;
  onClose?: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <Image src="/logo.svg" alt="AnswerVault" width={32} height={32} className="flex-shrink-0" />
        {sidebarOpen && <span className="font-bold text-gray-900 text-sm">AnswerVault</span>}
        {/* Mobile close */}
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 rounded-md hover:bg-gray-100 text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* License badge */}
      {sidebarOpen && license && (
        <div className="px-3 py-2">
          {license.demo
            ? <span className="badge-amber w-full text-center justify-center">DEMO MODE</span>
            : <span className="badge-green w-full text-center justify-center">✓ Licensed</span>}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              {item.icon}
              {sidebarOpen && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / bottom */}
      <div className="border-t border-gray-100 p-3">
        {sidebarOpen && (
          <div className="flex items-center gap-2 mb-2 px-1">
            {avatar
              ? <img src={avatar} alt={username} className="w-7 h-7 rounded-full flex-shrink-0" /> // eslint-disable-line @next/next/no-img-element
              : <div className="w-7 h-7 rounded-full bg-brand-200 flex items-center justify-center text-xs font-bold text-brand-700 flex-shrink-0">{username?.[0]?.toUpperCase() ?? 'D'}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{username ?? 'demo'}</p>
              {selectedRepo && <p className="text-xs text-gray-400 truncate">{selectedRepo}</p>}
            </div>
          </div>
        )}
        <button onClick={onLogout} className="btn-ghost w-full justify-start text-red-500 hover:bg-red-50">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {sidebarOpen && 'Sign out'}
        </button>
      </div>
    </div>
  );
}

export default function AppShell({ children, license, username, avatar, selectedRepo }: AppShellProps) {
  const router = useRouter();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  const pathname = usePathname();
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  // Lock body scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-200
          ${desktopOpen ? 'w-60' : 'w-16'}`}
      >
        <SidebarContent
          sidebarOpen={desktopOpen}
          license={license}
          username={username}
          avatar={avatar}
          selectedRepo={selectedRepo}
          onLogout={handleLogout}
        />
        {/* Collapse toggle */}
        <button
          onClick={() => setDesktopOpen(!desktopOpen)}
          className="mx-auto mb-3 flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
          aria-label="Toggle sidebar"
        >
          <svg className={`w-3 h-3 text-gray-400 transition-transform ${desktopOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" aria-modal="true">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col z-50">
            <SidebarContent
              sidebarOpen={true}
              license={license}
              username={username}
              avatar={avatar}
              selectedRepo={selectedRepo}
              onClose={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image src="/logo.svg" alt="AnswerVault" width={24} height={24} />
          <span className="font-semibold text-gray-900 text-sm">AnswerVault</span>
          {license?.demo && <span className="ml-auto badge-amber text-xs">DEMO</span>}
        </div>

        {/* Demo banner */}
        {license?.demo && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Demo Mode</span> – Read-only dataset. Exports include watermark.{' '}
              <span className="hidden sm:inline">Set <code className="bg-amber-100 px-1 rounded text-xs">LICENSE_KEY</code> on Vercel to unlock full features.</span>
            </p>
            <a href="/login#pricing" className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline whitespace-nowrap flex-shrink-0">
              Get License →
            </a>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

'use client';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: 'OAuth state mismatch – possible CSRF attempt. Please try again.',
  no_code: 'GitHub did not return an authorization code. Try again.',
  token_exchange_failed: 'Failed to exchange OAuth code for access token. Check your GitHub App settings.',
};

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Answer Library',
    desc: 'Maintain a reusable library of versioned security answers in YAML + Markdown, stored in your own GitHub repo.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Evidence Catalog',
    desc: 'Track certificates, audit reports, and policy docs with expiry dates. Get automatic staleness alerts via GitHub Issues.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
    title: 'Questionnaire Import',
    desc: 'Upload any SIG, CAIQ, or custom CSV/XLSX questionnaire. AI-assisted mapping suggests the best answer for each question.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: 'Smart Mapping',
    desc: 'Map questions to answers in a structured grid. Override individual responses, track completion percentage per section.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Export Ready',
    desc: 'One-click CSV and XLSX export with completed answers, evidence index, and coverage report — submission-ready instantly.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'GitHub-Native Storage',
    desc: 'Your data never leaves your GitHub repo. Every change goes through a PR — full audit trail, no third-party database.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Connect your repo', desc: 'Sign in with GitHub and select the repo where your answers and evidence will live.' },
  { step: '02', title: 'Build your library', desc: 'Add reusable answers and upload supporting evidence. Everything is stored as files in your repo.' },
  { step: '03', title: 'Import questionnaires', desc: 'Upload any CSV or XLSX questionnaire. AnswerVault parses it and creates a structured mapping grid.' },
  { step: '04', title: 'Map and export', desc: 'Assign answers to questions, review, and export a polished, submission-ready response.' },
];

const FRAMEWORKS = ['SIG Lite', 'CAIQ', 'CSA STAR', 'ISO 27001', 'SOC 2', 'NIST CSF', 'Custom'];

function LoginContent() {
  const params = useSearchParams();
  const error = params.get('error');
  const next = params.get('next') ?? '';
  const loginUrl = `/api/auth/login${next ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="AnswerVault" width={32} height={32} />
            <span className="font-bold text-gray-900 text-lg">AnswerVault</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 hidden sm:block">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 hidden sm:block">How it works</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 hidden sm:block">Pricing</a>
            <a href={loginUrl} className="btn-primary text-sm py-2">Sign in with GitHub</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              GitHub-native · Zero infra · One-time license
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Answer security questionnaires
              <span className="text-indigo-300"> 10× faster</span>
            </h1>
            <p className="text-lg sm:text-xl text-indigo-100 mb-8 leading-relaxed max-w-2xl">
              AnswerVault is a self-hosted platform that turns your GitHub repo into a versioned Answer Library, Evidence Catalog, and questionnaire response engine — no SaaS subscriptions, no data leaving your infrastructure.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href={loginUrl} className="inline-flex items-center gap-2.5 bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors shadow-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Try Demo — Free
              </a>
              <a href="#pricing" className="inline-flex items-center gap-2 border border-white/30 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
                View Pricing →
              </a>
            </div>
            <p className="text-indigo-300 text-sm mt-4">No license key needed to explore. Demo mode is always free.</p>
          </div>
        </div>
      </section>

      {/* ── Frameworks strip ── */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Works with</span>
          {FRAMEWORKS.map((f) => (
            <span key={f} className="text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-0.5">{f}</span>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything you need to respond faster</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Built for security teams who respond to vendor questionnaires repeatedly and need a system — not a spreadsheet.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-brand-200 transition-all">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-gray-500 text-lg">No infrastructure to provision. Deploy to Vercel, connect your GitHub repo, start building your library.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-brand-200 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="text-4xl font-black text-brand-100 mb-3 leading-none">{s.step}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why GitHub ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 sm:p-12 text-white flex flex-col lg:flex-row items-start gap-10">
          <div className="flex-1">
            <div className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-3">Why GitHub as your backend</div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Your data, your repo, your rules</h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              Every answer, evidence file, and questionnaire mapping is stored as a plain YAML/JSON file in a GitHub repo you control. Edits go through pull requests — giving you code review, diff history, and rollback for free.
            </p>
            <ul className="space-y-3">
              {[
                'Full audit trail via Git history',
                'PR-based change review for every edit',
                'Works with private repos — data never leaves GitHub',
                'GitHub Actions for automated exports and stale checks',
                'Zero vendor lock-in — your files are readable without AnswerVault',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full lg:w-72 bg-gray-800 rounded-xl p-5 font-mono text-xs text-gray-300 border border-gray-700 flex-shrink-0">
            <div className="text-gray-500 mb-3"># Your repo structure</div>
            <div className="space-y-1">
              <div><span className="text-blue-400">answers/</span></div>
              <div className="ml-3"><span className="text-emerald-400">ans-001.yml</span> <span className="text-gray-600">← reusable answer</span></div>
              <div className="ml-3"><span className="text-emerald-400">ans-001.md</span> <span className="text-gray-600">← long-form text</span></div>
              <div><span className="text-blue-400">evidence/</span></div>
              <div className="ml-3"><span className="text-emerald-400">evidence.yml</span> <span className="text-gray-600">← cert catalog</span></div>
              <div><span className="text-blue-400">questionnaires/</span></div>
              <div className="ml-3"><span className="text-blue-400">sig-lite/</span></div>
              <div className="ml-6"><span className="text-emerald-400">questionnaire.json</span></div>
              <div className="ml-6"><span className="text-emerald-400">mapping.yml</span> <span className="text-gray-600">← via PR</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, honest pricing</h2>
            <p className="text-gray-500 text-lg">One price. Yours forever. No subscriptions, no per-seat fees.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">

            {/* Demo / Free */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="text-sm font-semibold text-amber-600 mb-3">Demo Mode</div>
              <div className="text-4xl font-black text-gray-900 mb-1">Free</div>
              <p className="text-gray-500 text-sm mb-6">No license key needed. Explore the full interface with pre-loaded data.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Up to 20 answers, 10 evidence items',
                  '1 questionnaire (30 questions max)',
                  'CSV export with demo watermark',
                  'All UI features accessible',
                  'No GitHub writes',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a href={loginUrl} className="btn-secondary w-full justify-center py-3 text-sm font-medium">
                Try Demo Free →
              </a>
            </div>

            {/* Paid */}
            <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Most popular</div>
              <div className="text-sm font-semibold text-indigo-200 mb-3">Full License</div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black">$499</span>
                <span className="text-indigo-200 mb-1.5">one-time</span>
              </div>
              <p className="text-indigo-100 text-sm mb-6">Per deployment. Self-host on Vercel in minutes. Perpetual license, no renewals.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited answers & evidence',
                  'Unlimited questionnaires',
                  'CSV + XLSX export (no watermark)',
                  'PR-based GitHub writes',
                  'GitHub Actions workflows included',
                  'Weekly staleness alerts via Issues',
                  'Source code included — modify freely',
                  'Lifetime updates for major version',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-indigo-50">
                    <svg className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:hello@answervault.app?subject=AnswerVault%20License"
                className="block text-center bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors w-full shadow"
              >
                Get License — $499
              </a>
              <p className="text-indigo-200 text-xs text-center mt-3">Reply with your GitHub repo. License key sent within 24h.</p>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            Questions? Email <a href="mailto:hello@answervault.app" className="text-brand-600 hover:underline">hello@answervault.app</a>
          </p>
        </div>
      </section>

      {/* ── Sign-in card ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Image src="/logo.svg" alt="AnswerVault" width={56} height={56} className="mx-auto mb-4 drop-shadow" />
            <h2 className="text-2xl font-bold text-gray-900">Ready to start?</h2>
            <p className="text-gray-500 text-sm mt-2">Sign in with GitHub to access the demo or your licensed installation.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{ERROR_MESSAGES[error] ?? `Error: ${error}`}</p>
              </div>
            )}

            <a href={loginUrl} className="btn-primary w-full justify-center text-base py-3 gap-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Continue with GitHub
            </a>

            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
              <p className="text-xs text-gray-400 text-center">
                Required GitHub scopes: <code className="bg-gray-100 px-1 rounded">repo</code> · <code className="bg-gray-100 px-1 rounded">read:user</code>
              </p>
              <p className="text-xs text-gray-400 text-center">
                No <code className="bg-gray-100 px-1 rounded">LICENSE_KEY</code>? You&apos;ll enter{' '}
                <span className="font-medium text-amber-600">Demo Mode</span> automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="AnswerVault" width={20} height={20} />
            <span>AnswerVault · Security questionnaire platform</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/yaghiashraf/answervault" target="_blank" rel="noreferrer" className="hover:text-gray-600">GitHub</a>
            <a href="mailto:hello@answervault.app" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

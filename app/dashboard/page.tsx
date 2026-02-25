'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import type { LicenseStatus, StaleReport } from '@/lib/types';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function StaleList({ items, label, field }: {
  items: { id: string; title: string; days_stale: number }[];
  label: string;
  field: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="card">
      <h3 className="section-title text-amber-700 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {label}
      </h3>
      <div className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-800">{item.title}</p>
              <p className="text-xs text-gray-400">{item.id}</p>
            </div>
            <span className="badge-amber">{item.days_stale}d overdue</span>
          </div>
        ))}
        {items.length > 5 && (
          <p className="text-xs text-gray-400 pt-1">+{items.length - 5} more in {field}</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [stale, setStale] = useState<StaleReport | null>(null);
  const [counts, setCounts] = useState({ answers: 0, evidence: 0, questionnaires: 0 });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ username?: string; avatar?: string; selected_repo?: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [licRes, staleRes, ansRes, evRes, qRes] = await Promise.all([
          fetch('/api/license'),
          fetch('/api/stale'),
          fetch('/api/github/answers'),
          fetch('/api/github/evidence'),
          fetch('/api/github/questionnaires'),
        ]);

        if (licRes.ok) setLicense(await licRes.json());
        if (staleRes.ok) setStale(await staleRes.json());

        const ansData = ansRes.ok ? await ansRes.json() : { answers: [] };
        const evData = evRes.ok ? await evRes.json() : { evidence: [] };
        const qData = qRes.ok ? await qRes.json() : { questionnaires: [] };

        setCounts({
          answers: ansData.answers?.length ?? 0,
          evidence: evData.evidence?.length ?? 0,
          questionnaires: qData.questionnaires?.length ?? 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Read basic session info from cookie (public fields only)
    fetch('/api/license').then(async (r) => {
      if (r.ok) {
        const cookies = document.cookie.split(';');
        // Session fields are in the JWT – we can only get username from GitHub API
        fetch('https://api.github.com/user', {
          headers: { Authorization: `token ${document.cookie}` },
        }).catch(() => null);
        // Just use license data for now
      }
    }).catch(() => null);
  }, []);

  const isStale = stale && (stale.stale_answers.length > 0 || stale.stale_evidence.length > 0);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell license={license ?? undefined}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Security questionnaire response hub</p>
        </div>
        <div className="flex items-center gap-2">
          {license?.demo ? (
            <span className="badge-amber">Demo Mode</span>
          ) : (
            <span className="badge-green">✓ Licensed – {license?.customer_name}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Answers" value={counts.answers} sub="canonical answers" />
        <StatCard label="Evidence" value={counts.evidence} sub="items catalogued" />
        <StatCard label="Questionnaires" value={counts.questionnaires} sub="imported" />
        <StatCard
          label="Stale Items"
          value={(stale?.stale_answers.length ?? 0) + (stale?.stale_evidence.length ?? 0)}
          sub={isStale ? 'need review' : 'all up to date'}
          color={isStale ? 'text-amber-600' : 'text-emerald-600'}
        />
      </div>

      {/* Stale report */}
      {isStale && (
        <div className="mb-8">
          <h2 className="section-title">Freshness Report</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <StaleList
              items={stale!.stale_answers}
              label={`Stale Answers (>${stale!.answer_threshold_days}d)`}
              field="Answer Library"
            />
            <StaleList
              items={stale!.stale_evidence}
              label={`Stale Evidence (>${stale!.evidence_threshold_days}d)`}
              field="Evidence Catalog"
            />
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="card">
        <h2 className="section-title">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/questionnaires" className="btn-primary">Import Questionnaire</a>
          <a href="/answers" className="btn-secondary">Browse Answer Library</a>
          <a href="/evidence" className="btn-secondary">View Evidence Catalog</a>
          {!license?.demo && (
            <a href="/settings" className="btn-secondary">Repository Settings</a>
          )}
        </div>
      </div>

      {/* Demo callout */}
      {license?.demo && (
        <div className="mt-6 p-5 bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200 rounded-xl">
          <h3 className="font-semibold text-brand-900 mb-1">Ready to use with your real data?</h3>
          <p className="text-sm text-brand-700 mb-3">
            Purchase a one-time license to connect your GitHub repo, persist answers, and export without watermarks.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://answervault.dev/buy" target="_blank" rel="noreferrer" className="btn-primary">
              Get License – $499
            </a>
            <span className="text-xs text-brand-600">One-time fee · Self-hosted forever</span>
          </div>
        </div>
      )}

      {license?.demo && stale && (
        <p className="text-xs text-gray-400 mt-4">
          Stale report generated at {new Date(stale.generated_at).toLocaleString()} · Demo data only
        </p>
      )}
    </AppShell>
  );
}

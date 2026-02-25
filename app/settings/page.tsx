'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import type { GitHubRepo, LicenseStatus } from '@/lib/types';

export default function SettingsPage() {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const [licRes, reposRes] = await Promise.all([
        fetch('/api/license'),
        fetch('/api/github/repos'),
      ]);
      if (licRes.ok) {
        const lic = await licRes.json() as LicenseStatus;
        setLicense(lic);
      }
      if (reposRes.ok) {
        const d = await reposRes.json();
        setRepos(d.repos ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSaveRepo = async () => {
    if (!selectedRepo) return;
    setSaving(true);
    const res = await fetch('/api/github/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: selectedRepo }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return <AppShell><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div></AppShell>;

  return (
    <AppShell license={license ?? undefined}>
      <h1 className="page-title mb-6">Settings</h1>

      {/* License Status */}
      <div className="card mb-6">
        <h2 className="section-title">License Status</h2>
        {license?.demo ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="badge-amber">Demo Mode</span>
              <span className="text-sm text-gray-500">{license.error}</span>
            </div>
            <p className="text-sm text-gray-600">
              Set the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">LICENSE_KEY</code> environment variable on Vercel to unlock paid features.
            </p>
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
              <p className="font-medium mb-1">Paid mode unlocks:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>GitHub PR-based answer/evidence/mapping persistence</li>
                <li>Unlimited questionnaires and questions</li>
                <li>XLSX exports (no watermark)</li>
                <li>GitHub Actions: export pipeline, stale checker, schema validator</li>
              </ul>
            </div>
            <a href="https://answervault.dev/buy" target="_blank" rel="noreferrer" className="btn-primary inline-flex">
              Purchase License – $499 one-time →
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="badge-green">✓ Licensed</span>
              <span className="text-sm font-medium text-gray-900">{license?.customer_name}</span>
            </div>
            <p className="text-sm text-gray-500">Allowed repo: <code className="bg-gray-100 px-1 rounded">{license?.allowed_repo}</code></p>
            {license?.expiry ? (
              <p className="text-sm text-gray-500">Expires: {new Date(license.expiry * 1000).toLocaleDateString()}</p>
            ) : (
              <p className="text-sm text-gray-400">No expiry · lifetime license</p>
            )}
          </div>
        )}
      </div>

      {/* Repository Connection */}
      <div className="card mb-6">
        <h2 className="section-title">GitHub Repository</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select the forked AnswerVault repo where your answers and evidence are stored.
        </p>
        <div className="flex items-center gap-3">
          <select
            className="input max-w-md"
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
          >
            <option value="">— select repo —</option>
            {repos.map((r) => (
              <option key={r.full_name} value={r.full_name}>
                {r.full_name} {r.private ? '🔒' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleSaveRepo}
            disabled={!selectedRepo || saving}
            className="btn-primary"
          >
            {saving ? 'Saving…' : 'Connect Repo'}
          </button>
        </div>
        {saved && <p className="text-sm text-emerald-600 mt-2">✓ Repository connected. Reload to apply.</p>}
      </div>

      {/* Staleness thresholds */}
      <div className="card mb-6">
        <h2 className="section-title">Staleness Thresholds</h2>
        <p className="text-sm text-gray-500 mb-4">
          Set via environment variables. Current values:
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">STALE_ANSWER_DAYS</p>
            <p className="font-semibold text-gray-800">180 days</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">STALE_EVIDENCE_DAYS</p>
            <p className="font-semibold text-gray-800">365 days</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Change these in your Vercel environment variables and redeploy.
        </p>
      </div>

      {/* GitHub Actions status */}
      <div className="card">
        <h2 className="section-title">GitHub Actions Workflows</h2>
        {license?.demo ? (
          <p className="text-sm text-gray-500">GitHub Actions are available in paid mode. They automate exports, validate schemas on every PR, and open issues for stale items weekly.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">.github/workflows/export.yml</p>
                <p className="text-xs text-gray-400">Manual trigger · generates exports as workflow artifacts</p>
              </div>
              <span className="badge-green">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">.github/workflows/validate.yml</p>
                <p className="text-xs text-gray-400">Runs on PR · validates YAML/JSON schemas</p>
              </div>
              <span className="badge-green">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">.github/workflows/stale-check.yml</p>
                <p className="text-xs text-gray-400">Weekly · opens GitHub Issues for stale items</p>
              </div>
              <span className="badge-green">Active</span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

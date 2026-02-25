'use client';
import { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import type { Evidence, LicenseStatus } from '@/lib/types';

const TYPE_ICONS: Record<string, string> = {
  doc: '📄',
  link: '🔗',
  file: '📎',
};

function EvidenceCard({ ev, onEdit }: { ev: Evidence; onEdit?: () => void }) {
  const daysAgo = Math.floor((Date.now() - new Date(ev.last_updated).getTime()) / 86400000);
  const isStale = daysAgo > 365;

  return (
    <div className="card hover:border-brand-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{TYPE_ICONS[ev.type] ?? '📁'}</span>
            <span className="badge-gray font-mono text-xs">{ev.id}</span>
            <span className="badge-blue capitalize">{ev.type}</span>
            {isStale && <span className="badge-amber">Stale</span>}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{ev.title}</h3>
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{ev.description}</p>
          <a
            href={ev.url_or_path.startsWith('http') ? ev.url_or_path : undefined}
            className={`text-xs font-mono ${ev.url_or_path.startsWith('http') ? 'text-brand-600 hover:underline' : 'text-gray-400'}`}
            target="_blank"
            rel="noreferrer"
          >
            {ev.url_or_path}
          </a>
        </div>
        {onEdit && <button onClick={onEdit} className="btn-ghost flex-shrink-0">Edit</button>}
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 flex-wrap">
        {ev.tags.map((t) => <span key={t} className="badge-blue">{t}</span>)}
        <span className="ml-auto text-xs text-gray-400">Updated {ev.last_updated}</span>
      </div>
    </div>
  );
}

function EvidenceEditor({ initial, onSave, onCancel }: {
  initial?: Partial<Evidence>;
  onSave: (e: Evidence) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Evidence>>({
    id: '', title: '', type: 'doc', url_or_path: '', description: '',
    last_updated: new Date().toISOString().split('T')[0], tags: [],
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof Evidence, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try { await onSave(form as Evidence); }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="card border-brand-300 mb-6">
      <h3 className="section-title">{initial?.id ? 'Edit Evidence' : 'New Evidence Item'}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">ID (ev-NNN)</label>
            <input className="input" value={form.id} onChange={(e) => set('id', e.target.value)} placeholder="ev-011" />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value as Evidence['type'])}>
              <option value="doc">Doc</option>
              <option value="link">Link</option>
              <option value="file">File</option>
            </select>
          </div>
          <div>
            <label className="label">Last Updated</label>
            <input className="input" type="date" value={form.last_updated} onChange={(e) => set('last_updated', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div>
          <label className="label">URL or Path</label>
          <input className="input" value={form.url_or_path} onChange={(e) => set('url_or_path', e.target.value)} placeholder="https://… or evidence/files/report.pdf" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input h-20 resize-none" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div>
          <label className="label">Tags (comma-separated)</label>
          <input className="input" value={form.tags?.join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Opening PR…' : 'Save via PR'}</button>
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<'new' | Evidence | null>(null);
  const [prUrl, setPrUrl] = useState('');

  useEffect(() => {
    async function load() {
      const [licRes, evRes] = await Promise.all([fetch('/api/license'), fetch('/api/github/evidence')]);
      if (licRes.ok) setLicense(await licRes.json());
      if (evRes.ok) { const d = await evRes.json(); setEvidence(d.evidence ?? []); }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = evidence.filter((e) => {
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.tags.some((t) => t.includes(q));
  });

  const handleSave = useCallback(async (ev: Evidence) => {
    const res = await fetch('/api/github/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ev),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Save failed');
    setPrUrl(data.pr.url);
    setEditing(null);
  }, []);

  if (loading) return <AppShell><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div></AppShell>;

  return (
    <AppShell license={license ?? undefined}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Evidence Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">{evidence.length} items · Reports, policies, certifications</p>
        </div>
        {!license?.demo && <button onClick={() => setEditing('new')} className="btn-primary">+ Add Evidence</button>}
      </div>

      {prUrl && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-emerald-800">✓ PR opened!</p>
          <a href={prUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-700 underline">View PR →</a>
        </div>
      )}

      {editing && (
        <EvidenceEditor
          initial={editing === 'new' ? undefined : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="mb-4">
        <input className="input max-w-md" placeholder="Search evidence…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3">
        {filtered.map((e) => (
          <EvidenceCard key={e.id} ev={e} onEdit={!license?.demo ? () => setEditing(e) : undefined} />
        ))}
      </div>
    </AppShell>
  );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import type { Answer, LicenseStatus } from '@/lib/types';

function AnswerCard({ answer, onEdit }: { answer: Answer; onEdit?: () => void }) {
  const daysAgo = Math.floor((Date.now() - new Date(answer.last_reviewed).getTime()) / 86400000);
  const isStale = daysAgo > 180;

  return (
    <div className="card hover:border-brand-200 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="badge-gray text-xs font-mono">{answer.id}</span>
            {isStale && <span className="badge-amber">Stale – {daysAgo}d ago</span>}
          </div>
          <h3 className="font-semibold text-gray-900">{answer.title}</h3>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="btn-ghost flex-shrink-0">Edit</button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{answer.short_answer}</p>

      <div className="flex items-center gap-2 flex-wrap">
        {answer.tags.map((t) => <span key={t} className="badge-blue">{t}</span>)}
        {answer.frameworks.map((f) => <span key={f} className="badge-purple">{f}</span>)}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">{answer.owner}</span>
        <span className="text-xs text-gray-300">·</span>
        <span className={`text-xs ${isStale ? 'text-amber-600' : 'text-gray-400'}`}>
          Reviewed {answer.last_reviewed}
        </span>
        {answer.evidence_ids.length > 0 && (
          <>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{answer.evidence_ids.length} evidence item(s)</span>
          </>
        )}
      </div>
    </div>
  );
}

function AnswerEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Answer>;
  onSave: (a: Answer) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Answer>>({
    id: '',
    title: '',
    short_answer: '',
    intent_keywords: [],
    tags: [],
    frameworks: [],
    owner: '',
    last_reviewed: new Date().toISOString().split('T')[0],
    evidence_ids: [],
    long_answer_md: '',
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof Answer, val: unknown) => setForm((f) => ({ ...f, [key]: val }));
  const setArr = (key: keyof Answer, val: string) =>
    set(key, val.split(',').map((s) => s.trim()).filter(Boolean));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(form as Answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card border-brand-300">
      <h3 className="section-title">{initial?.id ? 'Edit Answer' : 'New Answer'}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ID (ans-NNN)</label>
            <input className="input" value={form.id} onChange={(e) => set('id', e.target.value)} placeholder="ans-021" />
          </div>
          <div>
            <label className="label">Owner (email)</label>
            <input className="input" value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="security@company.com" />
          </div>
        </div>

        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Encryption at Rest" />
        </div>

        <div>
          <label className="label">Short Answer (≤1000 chars)</label>
          <textarea className="input h-20 resize-none" value={form.short_answer} onChange={(e) => set('short_answer', e.target.value)} />
        </div>

        <div>
          <label className="label">Long Answer (Markdown)</label>
          <textarea className="input h-40 resize-y font-mono text-xs" value={form.long_answer_md} onChange={(e) => set('long_answer_md', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Intent Keywords (comma-separated)</label>
            <input className="input" value={form.intent_keywords?.join(', ')} onChange={(e) => setArr('intent_keywords', e.target.value)} />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={form.tags?.join(', ')} onChange={(e) => setArr('tags', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Frameworks (SOC2, ISO27001, CAIQ…)</label>
            <input className="input" value={form.frameworks?.join(', ')} onChange={(e) => setArr('frameworks', e.target.value)} />
          </div>
          <div>
            <label className="label">Last Reviewed (YYYY-MM-DD)</label>
            <input className="input" type="date" value={form.last_reviewed} onChange={(e) => set('last_reviewed', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Evidence IDs (comma-separated, e.g. ev-001, ev-002)</label>
          <input className="input" value={form.evidence_ids?.join(', ')} onChange={(e) => setArr('evidence_ids', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Opening PR…' : 'Save via PR'}
          </button>
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AnswersPage() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<'new' | Answer | null>(null);
  const [prUrl, setPrUrl] = useState('');

  useEffect(() => {
    async function load() {
      const [licRes, ansRes] = await Promise.all([
        fetch('/api/license'),
        fetch('/api/github/answers'),
      ]);
      if (licRes.ok) setLicense(await licRes.json());
      if (ansRes.ok) {
        const data = await ansRes.json();
        setAnswers(data.answers ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = answers.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.short_answer.toLowerCase().includes(q) ||
      a.tags.some((t) => t.includes(q)) ||
      a.frameworks.some((f) => f.toLowerCase().includes(q))
    );
  });

  const handleSave = useCallback(async (answer: Answer) => {
    const res = await fetch('/api/github/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answer),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Save failed');
    setPrUrl(data.pr.url);
    setEditing(null);
  }, []);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Answer Library</h1>
          <p className="text-gray-500 text-sm mt-1">{answers.length} canonical answers</p>
        </div>
        {!license?.demo && (
          <button onClick={() => setEditing('new')} className="btn-primary">
            + New Answer
          </button>
        )}
      </div>

      {prUrl && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-emerald-800">✓ PR opened! Merge it to publish the answer.</p>
          <a href={prUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-700 underline">
            View PR →
          </a>
        </div>
      )}

      {editing && (
        <div className="mb-6">
          <AnswerEditor
            initial={editing === 'new' ? undefined : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          className="input max-w-md"
          placeholder="Search by title, tag, framework…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No answers found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a) => (
            <AnswerCard
              key={a.id}
              answer={a}
              onEdit={!license?.demo ? () => setEditing(a) : undefined}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

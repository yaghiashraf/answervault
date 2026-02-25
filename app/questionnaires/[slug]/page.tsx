'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import type { Answer, LicenseStatus, Mapping, MappingEntry, Question, Questionnaire } from '@/lib/types';

// ─── Suggestion badge ─────────────────────────────────────────────────────────

function SuggestionBadge({ text, score }: { text: string; score: number }) {
  const pct = Math.min(100, Math.round((score / 10) * 100));
  const color = pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-500' : 'bg-gray-300';
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1`} title={`Match score: ${pct}%`} />
  );
}

// ─── Row editor for a single question ────────────────────────────────────────

function MappingRow({
  question,
  entry,
  answers,
  onChange,
}: {
  question: Question;
  entry: MappingEntry | undefined;
  answers: Answer[];
  onChange: (qid: string, entry: MappingEntry) => void;
}) {
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string; score: number }>>([]);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [showSugg, setShowSugg] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (suggestions.length > 0) { setShowSugg(true); return; }
    setLoadingSugg(true);
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question.text }),
    });
    if (res.ok) {
      const d = await res.json();
      setSuggestions(d.suggestions ?? []);
    }
    setLoadingSugg(false);
    setShowSugg(true);
  }, [question.text, suggestions.length]);

  const selectedAnswer = answers.find((a) => a.id === entry?.answer_id);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* QID */}
      <td className="px-3 py-3 align-top">
        <span className="badge-gray font-mono">{question.qid}</span>
      </td>

      {/* Section */}
      <td className="px-3 py-3 align-top">
        <span className="text-xs text-gray-500">{question.section}</span>
      </td>

      {/* Question text */}
      <td className="px-3 py-3 align-top max-w-xs">
        <p className="text-sm text-gray-800 line-clamp-3">{question.text}</p>
        <span className="badge-gray mt-1 text-xs">{question.answer_type}</span>
      </td>

      {/* Answer selector */}
      <td className="px-3 py-3 align-top min-w-[200px]">
        <div className="space-y-1.5">
          <select
            className="input text-xs py-1.5"
            value={entry?.answer_id ?? ''}
            onChange={(e) =>
              onChange(question.qid, { ...entry, answer_id: e.target.value || null })
            }
          >
            <option value="">— unmapped —</option>
            {answers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id}: {a.title.slice(0, 40)}
              </option>
            ))}
          </select>

          {selectedAnswer && (
            <p className="text-xs text-gray-400 line-clamp-1">{selectedAnswer.short_answer}</p>
          )}

          {/* Suggest button */}
          <button
            onClick={fetchSuggestions}
            disabled={loadingSugg}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium"
          >
            {loadingSugg ? 'Finding…' : '✨ Suggest'}
          </button>

          {showSugg && suggestions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm space-y-1">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  className="flex items-center gap-1 text-xs text-gray-700 hover:text-brand-700 w-full text-left"
                  onClick={() => {
                    onChange(question.qid, { ...entry, answer_id: s.id });
                    setShowSugg(false);
                  }}
                >
                  <SuggestionBadge text={s.title} score={s.score} />
                  {s.id}: {s.title.slice(0, 35)}
                </button>
              ))}
              <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setShowSugg(false)}>✕ close</button>
            </div>
          )}
        </div>
      </td>

      {/* Override text */}
      <td className="px-3 py-3 align-top min-w-[180px]">
        <textarea
          className="input text-xs py-1.5 resize-none h-16"
          placeholder="Override answer text (optional)…"
          value={entry?.override_text ?? ''}
          onChange={(e) =>
            onChange(question.qid, {
              ...entry,
              answer_id: entry?.answer_id ?? null,
              override_text: e.target.value || undefined,
            })
          }
        />
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuestionnairePage() {
  const { slug } = useParams<{ slug: string }>();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string; prUrl?: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sectionFilter, setSectionFilter] = useState('');

  useEffect(() => {
    if (!slug) return;
    async function load() {
      const [licRes, qRes, ansRes, mapRes] = await Promise.all([
        fetch('/api/license'),
        fetch(`/api/github/questionnaires/${slug}`),
        fetch('/api/github/answers'),
        fetch(`/api/github/questionnaires/${slug}/mapping`),
      ]);
      if (licRes.ok) setLicense(await licRes.json());
      if (qRes.ok) { const d = await qRes.json(); setQuestionnaire(d.questionnaire); }
      if (ansRes.ok) { const d = await ansRes.json(); setAnswers(d.answers ?? []); }
      if (mapRes.ok) { const d = await mapRes.json(); setMapping(d.mapping ?? {}); }
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleMappingChange = useCallback((qid: string, entry: MappingEntry) => {
    setMapping((m) => ({ ...m, [qid]: entry }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    const res = await fetch(`/api/github/questionnaires/${slug}/mapping`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveResult({ ok: false, message: data.error ?? 'Save failed' });
    } else if (data.demo) {
      setSaveResult({ ok: true, message: 'Demo: mapping validated but not saved to GitHub.' });
    } else {
      setSaveResult({ ok: true, message: 'Mapping saved via PR:', prUrl: data.pr?.url });
    }
    setSaving(false);
  };

  const handleExport = async (format: string, target = 'questionnaire') => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export/${slug}?format=${format}&target=${target}`);
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? 'Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? `${slug}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <AppShell><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div></AppShell>;
  if (!questionnaire) return <AppShell><p className="text-gray-500">Questionnaire not found.</p></AppShell>;

  const sections = Array.from(new Set(questionnaire.questions.map((q) => q.section)));
  const filtered = sectionFilter
    ? questionnaire.questions.filter((q) => q.section === sectionFilter)
    : questionnaire.questions;

  const mappedCount = questionnaire.questions.filter((q) => mapping[q.qid]?.answer_id).length;
  const pct = Math.round((mappedCount / questionnaire.questions.length) * 100);

  return (
    <AppShell license={license ?? undefined}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="page-title font-mono">{slug}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {questionnaire.source_filename} · {questionnaire.questions.length} questions · {sections.length} sections
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => handleExport('csv')} disabled={exporting} className="btn-secondary text-xs">
            ↓ CSV
          </button>
          <button onClick={() => handleExport('csv', 'evidence-csv')} disabled={exporting} className="btn-secondary text-xs">
            ↓ Evidence CSV
          </button>
          <button onClick={() => handleExport('csv', 'evidence-md')} disabled={exporting} className="btn-secondary text-xs">
            ↓ Evidence MD
          </button>
          {!license?.demo && (
            <button onClick={() => handleExport('xlsx')} disabled={exporting} className="btn-primary text-xs">
              ↓ XLSX
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : license?.demo ? 'Validate Mapping' : 'Save Mapping via PR'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Mapping Progress</span>
          <span className="text-sm text-gray-500">{mappedCount} / {questionnaire.questions.length} ({pct}%)</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {saveResult && (
        <div className={`mb-4 p-4 rounded-lg border flex items-center justify-between ${saveResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <p className="text-sm">{saveResult.message}</p>
          {saveResult.prUrl && <a href={saveResult.prUrl} target="_blank" rel="noreferrer" className="text-sm font-medium underline ml-3">View PR →</a>}
        </div>
      )}

      {/* Section filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSectionFilter('')}
          className={`badge cursor-pointer ${!sectionFilter ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}
        >
          All ({questionnaire.questions.length})
        </button>
        {sections.map((s) => {
          const cnt = questionnaire.questions.filter((q) => q.section === s).length;
          return (
            <button
              key={s}
              onClick={() => setSectionFilter(s)}
              className={`badge cursor-pointer ${sectionFilter === s ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {s} ({cnt})
            </button>
          );
        })}
      </div>

      {/* Mapping table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">QID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Section</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Question</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Answer</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Override Text</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q: Question) => (
                <MappingRow
                  key={q.qid}
                  question={q}
                  entry={mapping[q.qid]}
                  answers={answers}
                  onChange={handleMappingChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {license?.demo && (
        <p className="text-xs text-amber-600 mt-4">
          Demo: mapping changes are in-memory only. Save will validate but not create a GitHub PR.
        </p>
      )}
    </AppShell>
  );
}

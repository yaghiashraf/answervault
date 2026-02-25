'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import type { LicenseStatus, Questionnaire } from '@/lib/types';
import { DEMO_QUESTIONNAIRE } from '@/lib/demo-data';

// Client-side import helper
async function importFile(file: File, isDemo: boolean): Promise<Questionnaire> {
  const maxQ = isDemo ? 30 : undefined;
  const { importQuestionnaire } = await import('@/lib/import');
  return importQuestionnaire(file, maxQ);
}

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; message: string; prUrl?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const [licRes, qRes] = await Promise.all([
        fetch('/api/license'),
        fetch('/api/github/questionnaires'),
      ]);
      if (licRes.ok) setLicense(await licRes.json());
      if (qRes.ok) {
        const d = await qRes.json();
        setQuestionnaires(d.questionnaires ?? []);
      } else if (licRes.ok) {
        // Demo: show demo questionnaire
        const lic = await licRes.clone().json() as LicenseStatus;
        if (lic.demo) setQuestionnaires([DEMO_QUESTIONNAIRE]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const q = await importFile(file, license?.demo ?? true);

      // Send to API for persistence (or demo validation)
      const res = await fetch(`/api/github/questionnaires/${q.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q),
      });
      const data = await res.json();

      if (!res.ok) {
        setImportResult({ ok: false, message: data.error ?? 'Import failed' });
      } else if (data.demo) {
        setImportResult({ ok: true, message: `Demo: "${q.slug}" imported in-memory with ${q.questions.length} questions. Not persisted to GitHub.` });
      } else {
        setImportResult({ ok: true, message: `Questionnaire "${q.slug}" saved. PR opened:`, prUrl: data.pr?.url });
        // Refresh list
        setQuestionnaires((prev) => [...prev.filter((x) => x.slug !== q.slug), q]);
      }
    } catch (err) {
      setImportResult({ ok: false, message: err instanceof Error ? err.message : 'Import failed' });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) return <AppShell><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div></AppShell>;

  return (
    <AppShell license={license ?? undefined}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Questionnaires</h1>
          <p className="text-gray-500 text-sm mt-1">Import SIG, CAIQ, or custom questionnaires</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="btn-primary cursor-pointer">
            {importing ? 'Importing…' : '↑ Import CSV / XLSX'}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {license?.demo && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Demo mode: max 1 questionnaire import, 30 questions. Not persisted to GitHub.
        </div>
      )}

      {importResult && (
        <div className={`mb-4 p-4 rounded-lg border flex items-center justify-between ${importResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <p className="text-sm">{importResult.message}</p>
          {importResult.prUrl && (
            <a href={importResult.prUrl} target="_blank" rel="noreferrer" className="text-sm font-medium underline ml-3">View PR →</a>
          )}
        </div>
      )}

      {/* Import instructions */}
      <div className="card mb-6 bg-gray-50 border-dashed">
        <h3 className="font-medium text-gray-700 mb-2">Supported formats</h3>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>• <strong>CSV / XLSX</strong> with columns: <code className="bg-gray-100 px-1 rounded">qid</code>, <code className="bg-gray-100 px-1 rounded">text</code> (or <code className="bg-gray-100 px-1 rounded">question</code>), <code className="bg-gray-100 px-1 rounded">section</code>, <code className="bg-gray-100 px-1 rounded">answer_type</code></li>
          <li>• Column names are flexible – auto-detected (SIG, CAIQ, and custom formats)</li>
          <li>• Missing columns are auto-assigned default values</li>
        </ul>
      </div>

      {/* List */}
      {questionnaires.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>No questionnaires yet. Import a CSV or XLSX file to start.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {questionnaires.map((q) => (
            <Link key={q.slug} href={`/questionnaires/${q.slug}`} className="card hover:border-brand-300 transition-colors block">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{q.slug}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{q.source_filename} · {q.questions.length} questions · Imported {q.imported_at.split('T')[0]}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-blue">{new Set(q.questions.map((x) => x.section)).size} sections</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

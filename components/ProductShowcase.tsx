'use client';
import { useEffect, useState } from 'react';

// ── static mock data ──────────────────────────────────────────────────────────

const MOCK_ANSWERS = [
  { id: 'ans-001', title: 'Data Encryption at Rest', tag: 'Encryption', color: 'bg-blue-100 text-blue-700' },
  { id: 'ans-002', title: 'Annual Penetration Testing', tag: 'Testing',    color: 'bg-purple-100 text-purple-700' },
  { id: 'ans-003', title: 'Role-Based Access Control', tag: 'Access',      color: 'bg-emerald-100 text-emerald-700' },
  { id: 'ans-004', title: 'SOC 2 Type II Certified',   tag: 'Compliance',  color: 'bg-amber-100 text-amber-700' },
  { id: 'ans-005', title: 'Incident Response Plan',    tag: 'IR',          color: 'bg-red-100 text-red-700' },
];

const MOCK_QUESTIONS = [
  { qid: 'Q.1.1', text: 'Describe your data encryption policy', mapped: 'ans-001' },
  { qid: 'Q.1.2', text: 'How often is pen testing conducted?',  mapped: 'ans-002' },
  { qid: 'Q.2.1', text: 'Explain access control mechanisms',    mapped: 'ans-003' },
  { qid: 'Q.2.2', text: 'Provide compliance certifications',    mapped: 'ans-004' },
];

const SCREEN_DURATION = 3500; // ms per screen
const SCREENS = ['answers', 'import', 'mapping', 'export'] as const;
type Screen = typeof SCREENS[number];

// ── browser chrome wrapper ────────────────────────────────────────────────────

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border-b border-gray-200">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <span className="w-3 h-3 rounded-full bg-emerald-400" />
        <div className="flex-1 mx-3">
          <div className="bg-white border border-gray-300 rounded-md px-3 py-0.5 text-xs text-gray-400 font-mono">
            answervault.vercel.app/dashboard
          </div>
        </div>
      </div>
      {/* App shell */}
      <div className="flex" style={{ height: '340px' }}>
        {/* Sidebar */}
        <div className="w-44 bg-gray-50 border-r border-gray-200 flex-shrink-0 py-3 px-2 space-y-0.5">
          {[
            { icon: '⊞', label: 'Dashboard' },
            { icon: '📚', label: 'Answers',   active: false },
            { icon: '🗂️', label: 'Evidence',  active: false },
            { icon: '📋', label: 'Questions', active: false },
            { icon: '⚙️', label: 'Settings',  active: false },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium ${
                i === 0 ? 'bg-brand-100 text-brand-700' : 'text-gray-500'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div className="absolute bottom-4 left-2 right-2 flex items-center gap-1.5 px-2 py-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-300" />
            <span className="text-xs text-gray-400">demo user</span>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 relative">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Screen 1: Answer Library ──────────────────────────────────────────────────

function AnswersScreen({ tick }: { tick: number }) {
  const visible = Math.min(tick, MOCK_ANSWERS.length);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-800">Answer Library</h2>
        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{visible} answers</span>
      </div>
      <div className="space-y-2">
        {MOCK_ANSWERS.slice(0, visible).map((a, i) => (
          <div
            key={a.id}
            className="anim-slide-right flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm"
            style={{ animationDelay: `${i * 80}ms`, opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-xs font-mono text-gray-500">{a.id.split('-')[1]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{a.title}</p>
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${a.color}`}>{a.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Screen 2: Import ──────────────────────────────────────────────────────────

function ImportScreen({ tick }: { tick: number }) {
  const barPct = Math.min(100, tick * 25);
  const done = tick >= 4;
  const questionsVisible = done ? Math.min(tick - 4, MOCK_QUESTIONS.length) : 0;
  return (
    <div>
      <h2 className="text-sm font-bold text-gray-800 mb-3">Import Questionnaire</h2>
      {!done ? (
        <div className="anim-fade-in border-2 border-dashed border-brand-300 rounded-xl p-6 text-center bg-brand-50">
          <div className="text-2xl mb-2">📄</div>
          <p className="text-xs font-medium text-brand-700 mb-3">SIG-Lite-2024.xlsx</p>
          <div className="h-2 bg-brand-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${barPct}%` }}
            />
          </div>
          <p className="text-xs text-brand-500 mt-2">{barPct < 100 ? `Parsing… ${barPct}%` : 'Done!'}</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs text-emerald-600 font-medium anim-slide-up">
            <span className="anim-check-pop inline-block">✅</span> 30 questions parsed from SIG-Lite-2024.xlsx
          </div>
          <div className="space-y-1.5">
            {MOCK_QUESTIONS.slice(0, questionsVisible).map((q, i) => (
              <div
                key={q.qid}
                className="anim-slide-right flex items-center gap-2"
                style={{ animationDelay: `${i * 120}ms`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <span className="font-mono text-xs text-gray-400 w-10">{q.qid}</span>
                <p className="text-xs text-gray-700 truncate">{q.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Screen 3: Mapping ─────────────────────────────────────────────────────────

function MappingScreen({ tick }: { tick: number }) {
  const mapped = Math.min(tick, MOCK_QUESTIONS.length);
  const pct = Math.round((mapped / MOCK_QUESTIONS.length) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-gray-800">Mapping Grid</h2>
        <span className={`text-xs font-semibold ${pct === 100 ? 'text-emerald-600' : 'text-brand-600'}`}>{pct}% mapped</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="space-y-2">
        {MOCK_QUESTIONS.map((q, i) => {
          const isMapped = i < mapped;
          return (
            <div key={q.qid} className="flex items-center gap-2 text-xs">
              <span className="font-mono text-gray-400 w-10 flex-shrink-0">{q.qid}</span>
              <span className="text-gray-600 flex-1 truncate">{q.text}</span>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all duration-300 ${
                  isMapped
                    ? 'bg-emerald-50 text-emerald-700 anim-check-pop'
                    : 'bg-gray-100 text-gray-400'
                }`}
                style={isMapped ? { animationDelay: `${i * 200}ms`, opacity: 0, animationFillMode: 'forwards' } : {}}
              >
                {isMapped ? (
                  <><span>✓</span> {MOCK_ANSWERS[i]?.id}</>
                ) : (
                  '— unmapped —'
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Screen 4: Export ──────────────────────────────────────────────────────────

function ExportScreen({ tick }: { tick: number }) {
  const showButtons = tick >= 2;
  const showSuccess = tick >= 4;
  return (
    <div>
      <h2 className="text-sm font-bold text-gray-800 mb-3">Export</h2>
      <div className="anim-fade-in bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm anim-check-pop">✓</div>
        <div>
          <p className="text-xs font-semibold text-emerald-800">Mapping complete — 100%</p>
          <p className="text-xs text-emerald-600">30 / 30 questions mapped</p>
        </div>
      </div>
      {showButtons && (
        <div className="anim-slide-up grid grid-cols-2 gap-2 mb-3" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          {[
            { label: '↓ CSV Export',       color: 'bg-gray-100 text-gray-700' },
            { label: '↓ XLSX Export',      color: 'bg-brand-100 text-brand-700' },
            { label: '↓ Evidence CSV',     color: 'bg-gray-100 text-gray-700' },
            { label: '↓ Evidence MD',      color: 'bg-gray-100 text-gray-700' },
          ].map((btn) => (
            <div key={btn.label} className={`rounded-lg px-3 py-2 text-xs font-medium text-center ${btn.color} cursor-pointer`}>
              {btn.label}
            </div>
          ))}
        </div>
      )}
      {showSuccess && (
        <div className="anim-slide-up text-center py-2" style={{ opacity: 0, animationFillMode: 'forwards', animationDelay: '300ms' }}>
          <p className="text-xs text-gray-500">🎉 <span className="font-medium text-gray-700">SIG-Lite-2024-response.xlsx</span> ready to submit</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const SCREEN_LABELS: Record<Screen, string> = {
  answers: 'Answer Library',
  import:  'Import Questionnaire',
  mapping: 'Map Questions',
  export:  'Export & Submit',
};

export default function ProductShowcase() {
  const [screenIdx, setScreenIdx] = useState(0);
  const [tick, setTick] = useState(0);      // sub-animation ticker (increments every 500ms)
  const [elapsed, setElapsed] = useState(0); // ms elapsed in current screen

  useEffect(() => {
    setTick(0);
    setElapsed(0);

    const ticker = setInterval(() => {
      setTick((t) => t + 1);
      setElapsed((e) => e + 500);
    }, 500);

    const screener = setTimeout(() => {
      setScreenIdx((s) => (s + 1) % SCREENS.length);
    }, SCREEN_DURATION);

    return () => { clearInterval(ticker); clearTimeout(screener); };
  }, [screenIdx]);

  const screen = SCREENS[screenIdx];
  const progressPct = Math.min(100, (elapsed / SCREEN_DURATION) * 100);

  return (
    <div className="relative">
      {/* Floating glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl blur-2xl" />

      <div className="relative anim-float">
        <BrowserFrame>
          <div key={`${screen}-${screenIdx}`} className="h-full">
            {screen === 'answers' && <AnswersScreen tick={tick} />}
            {screen === 'import'  && <ImportScreen  tick={tick} />}
            {screen === 'mapping' && <MappingScreen tick={tick} />}
            {screen === 'export'  && <ExportScreen  tick={tick} />}
          </div>
        </BrowserFrame>

        {/* Step indicator */}
        <div className="mt-4 flex items-center gap-2">
          {SCREENS.map((s, i) => (
            <button
              key={s}
              onClick={() => setScreenIdx(i)}
              className={`flex-1 text-center transition-all ${
                i === screenIdx ? 'opacity-100' : 'opacity-40 hover:opacity-70'
              }`}
            >
              <div className={`h-1 rounded-full mb-1.5 overflow-hidden bg-gray-200`}>
                <div
                  className="h-full bg-brand-500 rounded-full transition-none"
                  style={{ width: i === screenIdx ? `${progressPct}%` : i < screenIdx ? '100%' : '0%' }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">{SCREEN_LABELS[s]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: 'OAuth state mismatch – possible CSRF attempt. Please try again.',
  no_code:        'GitHub did not return an authorization code. Try again.',
  token_exchange_failed: 'Failed to exchange OAuth code for access token. Check your GitHub App settings.',
};

function LoginContent() {
  const params = useSearchParams();
  const error = params.get('error');
  const next = params.get('next') ?? '';

  const loginUrl = `/api/auth/login${next ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Image src="/logo.svg" alt="AnswerVault" width={64} height={64} className="mx-auto drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AnswerVault</h1>
          <p className="text-gray-500 mt-2">Security questionnaire response platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{ERROR_MESSAGES[error] ?? `Error: ${error}`}</p>
            </div>
          )}

          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to continue</h2>
          <p className="text-sm text-gray-500 mb-6">
            AnswerVault uses your GitHub account to store answers, evidence, and questionnaire mappings directly in your repo.
          </p>

          <a href={loginUrl} className="btn-primary w-full justify-center text-base py-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Continue with GitHub
          </a>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Required GitHub scopes: <code className="bg-gray-100 px-1 rounded">repo</code>, <code className="bg-gray-100 px-1 rounded">read:user</code>
            </p>
          </div>
        </div>

        {/* Demo note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          No <code className="bg-white/60 px-1 rounded">LICENSE_KEY</code>? The app runs in{' '}
          <span className="font-medium text-amber-600">Demo Mode</span> with a pre-loaded dataset.
        </p>
      </div>
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

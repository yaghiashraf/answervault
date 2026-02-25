import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AnswerVault Privacy Policy – how we handle your data.',
  alternates: { canonical: 'https://answervault.vercel.app/privacy' },
};

const LAST_UPDATED = 'February 25, 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="AnswerVault" width={28} height={28} />
            <span className="font-bold text-gray-900">AnswerVault</span>
          </Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">← Back to home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Overview</h2>
            <p>AnswerVault (&quot;we&quot;, &quot;the software&quot;) is a self-hosted application. When you deploy AnswerVault on Vercel, <strong>your data never passes through our servers</strong>. All questionnaire responses, answers, and evidence files are stored directly in your GitHub repository and processed exclusively by the Vercel deployment you control.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Data We Collect</h2>
            <h3 className="font-medium text-gray-800 mb-2">2a. GitHub OAuth</h3>
            <p>When you sign in with GitHub, we request the following OAuth scopes:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li><code className="bg-gray-100 px-1 rounded text-xs">repo</code> – to read and write files in the repository you select</li>
              <li><code className="bg-gray-100 px-1 rounded text-xs">read:user</code> – to display your username and avatar in the app</li>
            </ul>
            <p className="mt-3">Your GitHub access token is stored in an encrypted, <code className="bg-gray-100 px-1 rounded text-xs">httpOnly</code> session cookie (<code className="bg-gray-100 px-1 rounded text-xs">av_session</code>) that expires after 7 days. It is never written to any database or logged.</p>

            <h3 className="font-medium text-gray-800 mb-2 mt-4">2b. Cookies</h3>
            <p>We set exactly two cookies:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li><code className="bg-gray-100 px-1 rounded text-xs">av_session</code> – encrypted JWT session, 7-day expiry, <code className="bg-gray-100 px-1 rounded text-xs">httpOnly; Secure; SameSite=Lax</code></li>
              <li><code className="bg-gray-100 px-1 rounded text-xs">av_oauth_state</code> – CSRF nonce during GitHub OAuth, 10-minute expiry, deleted immediately after sign-in</li>
            </ul>
            <p className="mt-3">No tracking, analytics, or advertising cookies are set.</p>

            <h3 className="font-medium text-gray-800 mb-2 mt-4">2c. Application Data</h3>
            <p>All answers, evidence metadata, questionnaire files, and mapping files are stored as YAML/JSON files in the GitHub repository <strong>you select</strong>. AnswerVault does not store copies of this data outside your repository.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>GitHub API</strong> – used to read and write files, create branches and pull requests. Subject to <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" className="text-brand-600 hover:underline" target="_blank" rel="noreferrer">GitHub&apos;s Privacy Policy</a>.</li>
              <li><strong>Vercel</strong> – hosts the application. Vercel may log HTTP request metadata (IP, user-agent, timestamps) per their infrastructure. Subject to <a href="https://vercel.com/legal/privacy-policy" className="text-brand-600 hover:underline" target="_blank" rel="noreferrer">Vercel&apos;s Privacy Policy</a>.</li>
              <li><strong>Stripe</strong> – used for payment processing only. Payment data is handled entirely by Stripe and never reaches AnswerVault servers. Subject to <a href="https://stripe.com/privacy" className="text-brand-600 hover:underline" target="_blank" rel="noreferrer">Stripe&apos;s Privacy Policy</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Data Retention</h2>
            <p>Session cookies expire after 7 days and are deleted upon sign-out. Application data is retained in your GitHub repository for as long as you keep it there. Deleting your session cookie or revoking GitHub OAuth access immediately terminates your session.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Your Rights</h2>
            <p>Because AnswerVault is self-hosted and stores no data on shared infrastructure, you maintain full control over your data at all times. To delete your data, delete the files from your GitHub repository. To revoke access, remove the AnswerVault OAuth application from your <a href="https://github.com/settings/applications" className="text-brand-600 hover:underline" target="_blank" rel="noreferrer">GitHub authorized apps</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Children</h2>
            <p>AnswerVault is designed for professional use and is not directed at children under 16. We do not knowingly collect data from minors.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Changes to This Policy</h2>
            <p>We may update this policy as the software evolves. Material changes will be noted in the GitHub repository changelog. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>Questions about this policy: <a href="mailto:hello@answervault.app" className="text-brand-600 hover:underline">hello@answervault.app</a></p>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-100 bg-gray-50 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-wrap gap-4 justify-between text-sm text-gray-400">
          <span>© 2026 AnswerVault</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
            <Link href="/terms"   className="hover:text-gray-600">Terms</Link>
            <a href="mailto:hello@answervault.app" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

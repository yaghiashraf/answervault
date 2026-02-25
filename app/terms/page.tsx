import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AnswerVault Terms of Service – license terms and usage conditions.',
  alternates: { canonical: 'https://answervault.vercel.app/terms' },
};

const LAST_UPDATED = 'February 25, 2026';

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance</h2>
            <p>By purchasing, downloading, deploying, or using AnswerVault (the &quot;Software&quot;), you agree to these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use the Software.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. License Grant</h2>
            <p>Upon purchasing a license, we grant you a <strong>non-exclusive, non-transferable, perpetual license</strong> to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Deploy one (1) instance of the Software per license key purchased</li>
              <li>Modify the source code for your own internal use</li>
              <li>Use the Software for commercial purposes within your organisation</li>
            </ul>
            <p className="mt-3">Demo mode (no license key) is free to use for evaluation purposes with no time limit.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Restrictions</h2>
            <p>You may <strong>not</strong>:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Resell, sublicense, or redistribute the Software or your license key to third parties</li>
              <li>Use a single license key across multiple independent deployments (each deployment requires its own license)</li>
              <li>Remove or alter any copyright, trademark, or license notices in the Software</li>
              <li>Represent the Software as your own original product to sell commercially</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Payments &amp; Refunds</h2>
            <p>Licenses are priced at <strong>$499 USD per deployment</strong>, payable as a one-time fee via Stripe. All sales are final. We do not offer refunds except where required by applicable law. If the Software does not function as described and the issue cannot be resolved within a reasonable time, we will consider refund requests on a case-by-case basis at our sole discretion.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Updates</h2>
            <p>Purchased licenses include updates within the same major version (e.g. all 1.x releases). Future major versions (2.x, 3.x, etc.) may require a new license purchase at a discounted upgrade price. Updates are delivered via the public GitHub repository as new releases.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Disclaimer of Warranties</h2>
            <p>THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. YOUR USE OF THE SOFTWARE IS AT YOUR SOLE RISK.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ANSWERVAULT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF OR INABILITY TO USE THE SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SOFTWARE.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Your Data &amp; Security</h2>
            <p>You are solely responsible for the security of the GitHub repository used with AnswerVault and for maintaining appropriate access controls. AnswerVault does not store your application data — it is stored in your GitHub repository, which you control. You are responsible for ensuring your use of GitHub&apos;s services complies with GitHub&apos;s terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Compliance</h2>
            <p>AnswerVault is a tool to help you <em>organise</em> your security responses. It does not guarantee compliance with any regulatory framework (ISO 27001, SOC 2, GDPR, etc.). You remain solely responsible for the accuracy of your questionnaire responses and any compliance decisions you make.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Governing Law</h2>
            <p>These Terms are governed by the laws of the jurisdiction in which AnswerVault is operated. Any disputes shall be resolved by binding arbitration or in the courts of that jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to Terms</h2>
            <p>We reserve the right to update these Terms. Material changes will be announced via the GitHub repository. Continued use of the Software after changes constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contact</h2>
            <p>Questions about these Terms: <a href="mailto:hello@answervault.app" className="text-brand-600 hover:underline">hello@answervault.app</a></p>
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

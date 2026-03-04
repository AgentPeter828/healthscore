export const metadata = {
  title: "Refund Policy — HealthScore",
  description: "Refund Policy for HealthScore by Project Firestorm Pty Ltd.",
};

export default function RefundPage() {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Refund Policy
        </h1>
        <p className="text-gray-500 text-sm">
          Last updated: 1 March 2025 &bull; Effective: 1 March 2025
        </p>
        <div className="mt-6 rounded-lg bg-green-50 border border-green-100 p-4 text-sm text-green-800">
          <strong>Our promise:</strong> We offer a 30-day money-back guarantee on all paid plans. If you&apos;re not happy with HealthScore in the first 30 days, we&apos;ll refund you in full — no questions asked.
        </div>
      </div>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        {/* 1. 30-Day Money-Back Guarantee */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 30-Day Money-Back Guarantee</h2>
          <p>
            We stand behind HealthScore. If you are not satisfied with your paid subscription for any reason within the first <strong>30 days</strong> of your initial payment, you are entitled to a full refund of that payment.
          </p>
          <p className="mt-3">
            This guarantee applies to:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside ml-4">
            <li>First payments on Starter, Growth, and Scale monthly plans</li>
            <li>First payments on any annual plan (when annual billing becomes available)</li>
            <li>Upgrades from one paid plan to a higher paid plan (within 30 days of the upgrade)</li>
          </ul>
          <p className="mt-3">
            <strong>No conditions. No interrogation.</strong> You do not need to provide a reason, and we will not ask for one. Simply contact us, and we will process your refund.
          </p>
        </section>

        {/* 2. How to Request a Refund */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How to Request a Refund</h2>
          <p>To request a refund:</p>
          <ol className="mt-3 space-y-3 list-decimal list-inside ml-4">
            <li>
              <strong>Email us</strong> at <a href="mailto:hello@healthscore.app" className="text-blue-600 underline">hello@healthscore.app</a> with the subject line &ldquo;Refund Request&rdquo;.
            </li>
            <li>
              <strong>Include your account email address</strong> so we can locate your account.
            </li>
            <li>
              <strong>That&apos;s it.</strong> You do not need to provide a reason, though feedback is always appreciated.
            </li>
          </ol>
          <p className="mt-4">
            We aim to process all refund requests within <strong>2 business days</strong>. You will receive an email confirmation once your refund has been initiated.
          </p>
        </section>

        {/* 3. ACL Guarantees */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Australian Consumer Law Guarantees</h2>
          <p>
            Our 30-day money-back guarantee is in addition to, and does not limit, your rights under the <em>Australian Consumer Law</em> (Schedule 2 to the <em>Competition and Consumer Act 2010</em> (Cth)) (&ldquo;ACL&rdquo;).
          </p>
          <p className="mt-3">
            Under the ACL, the Service comes with guarantees that cannot be excluded. If the Service fails to meet a consumer guarantee — for example, if it is not of acceptable quality, is not fit for purpose, or is not provided with due care and skill — you may be entitled to a remedy. Depending on the nature and severity of the failure:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside ml-4">
            <li>
              <strong>Minor failure:</strong> We will re-supply the affected services, or provide a partial refund for the period affected.
            </li>
            <li>
              <strong>Major failure:</strong> You are entitled to cancel the contract and receive a full refund, or to keep the service at a reduced price.
            </li>
          </ul>
          <p className="mt-3">
            A &ldquo;major failure&rdquo; occurs where a reasonable consumer would not have subscribed if they had known about the problem, or the service is substantially unfit for its purpose and cannot be easily remedied within a reasonable time.
          </p>
          <p className="mt-3">
            To make a consumer guarantee claim, contact us at <a href="mailto:hello@healthscore.app" className="text-blue-600 underline">hello@healthscore.app</a>.
          </p>
        </section>

        {/* 4. Exclusions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Exclusions</h2>
          <p>
            The 30-day money-back guarantee does <strong>not</strong> apply to:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside ml-4">
            <li>
              <strong>Free plan users</strong> — the Free plan does not involve any payment, so no refund is applicable.
            </li>
            <li>
              <strong>Renewals after the initial 30-day period</strong> — monthly renewal charges (beyond the first payment) are not covered by the money-back guarantee, except as required by the ACL or other applicable law.
            </li>
            <li>
              <strong>Accounts suspended or terminated for violations</strong> — accounts terminated due to breach of our Terms of Service are not eligible for a refund.
            </li>
            <li>
              <strong>Add-on services or professional services fees</strong> — where applicable, these are subject to their own refund terms.
            </li>
          </ul>
          <p className="mt-3">
            Nothing in these exclusions limits your rights under applicable consumer protection law, including the ACL.
          </p>
        </section>

        {/* 5. Partial Refunds for Annual Plans */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Partial Refunds for Annual Plans</h2>
          <p>
            Annual billing is not yet available, but when it launches, the following policy will apply:
          </p>
          <p className="mt-3">
            If you cancel an annual subscription after the 30-day money-back guarantee period has elapsed, you are <strong>not</strong> entitled to a prorated refund for the unused portion of your annual term under our standard policy — except as required by applicable law (including the ACL for major service failures).
          </p>
          <p className="mt-3">
            <strong>Exception — major service failures.</strong> If the Service suffers a major failure (as defined under the ACL or applicable law), you may be entitled to cancel and receive a prorated refund for the unused portion of your annual subscription, regardless of when the failure occurred.
          </p>
          <p className="mt-3">
            We recommend starting with a monthly plan if you are uncertain about committing to an annual subscription.
          </p>
        </section>

        {/* 6. Processing Time */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Processing Time</h2>
          <p>
            Once a refund has been approved and initiated by us, the time to receive the funds depends on your payment provider:
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Payment Method</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Typical Processing Time</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { method: "Credit / debit card (Visa, Mastercard)", time: "5–10 business days" },
                  { method: "American Express", time: "5–10 business days" },
                  { method: "Bank transfer / ACH", time: "5–10 business days" },
                ].map((row) => (
                  <tr key={row.method} className="border-t border-gray-100">
                    <td className="py-3 px-4 text-gray-700">{row.method}</td>
                    <td className="py-3 px-4 text-gray-600">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Refunds are processed via Stripe. We will send you a confirmation email once the refund is initiated on our end. The timing of when the funds appear in your account is determined by your bank or card issuer, which is outside our control.
          </p>
        </section>

        {/* 7. Contact */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Questions</h2>
          <p>
            If you have any questions about our Refund Policy, please contact us:
          </p>
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm">
            <p><strong>Project Firestorm Pty Ltd</strong></p>
            <p>Melbourne, Victoria, Australia</p>
            <p className="mt-2">
              Email: <a href="mailto:hello@healthscore.app" className="text-blue-600 underline">hello@healthscore.app</a>
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}

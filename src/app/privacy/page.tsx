import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="PRIVACY POLICY" lastUpdated="MARCH 2026">
      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">1. INFORMATION WE COLLECT</h2>
        <p className="mb-3">We collect the following types of information:</p>
        <ul className="space-y-2 ml-4">
          <li><span className="text-accent">&gt;</span> <span className="text-foreground">Account information:</span> Email address, display name, and authentication credentials when you create an account.</li>
          <li><span className="text-accent">&gt;</span> <span className="text-foreground">Usage data:</span> Pages visited, features used, timestamps, device information, and browser type.</li>
          <li><span className="text-accent">&gt;</span> <span className="text-foreground">Portfolio data:</span> Ticker symbols, share quantities, and average prices you enter into the portfolio tracker.</li>
          <li><span className="text-accent">&gt;</span> <span className="text-foreground">Alert preferences:</span> Tickers, conditions, and notification settings you configure.</li>
          <li><span className="text-accent">&gt;</span> <span className="text-foreground">Payment information:</span> Processed securely by Stripe. We do not store your full card details.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">2. HOW WE USE YOUR INFORMATION</h2>
        <p className="mb-3">We use collected information to:</p>
        <ul className="space-y-2 ml-4">
          <li><span className="text-accent">&gt;</span> Provide, maintain, and improve the Service</li>
          <li><span className="text-accent">&gt;</span> Process your subscription and manage billing</li>
          <li><span className="text-accent">&gt;</span> Send you alerts, notifications, and service-related communications</li>
          <li><span className="text-accent">&gt;</span> Analyze usage patterns to improve features and user experience</li>
          <li><span className="text-accent">&gt;</span> Comply with legal obligations and enforce our Terms of Service</li>
        </ul>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">3. DATA STORAGE AND SECURITY</h2>
        <p>
          Your data is stored on secure servers provided by Supabase (hosted on AWS). We implement industry-standard security measures including encryption in transit (TLS), encryption at rest, and access controls. While we take reasonable measures to protect your information, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">4. COOKIES AND TRACKING</h2>
        <p>
          We use essential cookies for authentication and session management. We may use analytics cookies to understand how users interact with the Service. You can control cookie preferences through your browser settings. Disabling essential cookies may prevent certain features from functioning properly.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">5. THIRD-PARTY SERVICES</h2>
        <p className="mb-3">We integrate with the following third-party services:</p>
        <ul className="space-y-2 ml-4">
          <li><span className="text-accent">&gt;</span> <span className="text-foreground">Supabase:</span> Database and authentication infrastructure</li>
          <li><span className="text-accent">&gt;</span> <span className="text-foreground">Stripe:</span> Payment processing (when available)</li>
          <li><span className="text-accent">&gt;</span> <span className="text-foreground">OpenAI:</span> AI analysis pipeline — article text may be sent for processing</li>
          <li><span className="text-accent">&gt;</span> <span className="text-foreground">Yahoo Finance:</span> Real-time market data</li>
          <li><span className="text-accent">&gt;</span> <span className="text-foreground">Vercel:</span> Hosting and deployment infrastructure</li>
        </ul>
        <p className="mt-3">
          Each third-party service has its own privacy policy. We encourage you to review their policies.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">6. YOUR RIGHTS</h2>
        <p className="mb-3">Under applicable data protection laws (including GDPR), you have the right to:</p>
        <ul className="space-y-2 ml-4">
          <li><span className="text-accent">&gt;</span> Access the personal data we hold about you</li>
          <li><span className="text-accent">&gt;</span> Request correction of inaccurate data</li>
          <li><span className="text-accent">&gt;</span> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
          <li><span className="text-accent">&gt;</span> Object to or restrict processing of your data</li>
          <li><span className="text-accent">&gt;</span> Request data portability</li>
          <li><span className="text-accent">&gt;</span> Withdraw consent at any time</li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, contact us at privacy@shadowbrokers.io.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">7. DATA RETENTION</h2>
        <p>
          We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (such as fraud prevention). Anonymized usage data may be retained indefinitely for analytics purposes.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">8. CHILDREN&apos;S PRIVACY</h2>
        <p>
          The Service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal data, we will take steps to delete that information promptly.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">9. CHANGES TO THIS POLICY</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a prominent notice on the Service. The &quot;Last Updated&quot; date at the top of this page indicates when the policy was last revised.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">10. CONTACT</h2>
        <p>
          If you have questions about this Privacy Policy or our data practices, contact us at privacy@shadowbrokers.io.
        </p>
      </section>
    </LegalPageLayout>
  );
}

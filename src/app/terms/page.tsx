import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export default function TermsPage() {
  return (
    <LegalPageLayout title="TERMS OF SERVICE" lastUpdated="MARCH 2026">
      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">1. ACCEPTANCE OF TERMS</h2>
        <p>
          By accessing or using the ShadowBrokers platform (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service. We reserve the right to update these Terms at any time, and your continued use constitutes acceptance of any changes.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">2. DESCRIPTION OF SERVICE</h2>
        <p>
          ShadowBrokers is an AI-powered financial intelligence platform that provides sentiment analysis, market data aggregation, portfolio tracking, and related tools. The Service processes publicly available news articles and market data to generate automated analysis. The Service does not provide financial advice, investment recommendations, or trading signals.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">3. ACCOUNT REGISTRATION</h2>
        <p>
          To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">4. SUBSCRIPTION AND BILLING</h2>
        <p>
          ShadowBrokers offers Free, Pro, and Ultra subscription tiers. Paid subscriptions are billed monthly in Euros (EUR). By subscribing to a paid plan, you authorize us to charge your payment method on a recurring basis. You may cancel at any time, and your access will continue until the end of the current billing period. Refunds are not provided for partial billing periods. Prices are subject to change with 30 days&apos; notice.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">5. ACCEPTABLE USE</h2>
        <p>
          You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to reverse-engineer, decompile, or disassemble the Service; (c) scrape, crawl, or use automated tools to extract data beyond API access provided by your plan; (d) share your account credentials with third parties; (e) resell, redistribute, or sublicense access to the Service; (f) interfere with or disrupt the Service infrastructure; (g) use the Service to manipulate markets or engage in fraudulent activity.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">6. INTELLECTUAL PROPERTY</h2>
        <p>
          All content, features, and functionality of the Service — including but not limited to text, graphics, logos, software, and AI-generated analyses — are the exclusive property of ShadowBrokers or its licensors and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works from any part of the Service without express written permission.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">7. DISCLAIMER OF WARRANTIES</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED. AI-GENERATED ANALYSIS MAY CONTAIN ERRORS OR INACCURACIES.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">8. LIMITATION OF LIABILITY</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHADOWBROKERS AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM. THIS LIMITATION APPLIES REGARDLESS OF THE LEGAL THEORY ON WHICH THE CLAIM IS BASED.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">9. DATA AND PRIVACY</h2>
        <p>
          Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection, use, and storage of your data as described in our Privacy Policy. We implement reasonable security measures to protect your data, but no system is completely secure and we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">10. TERMINATION</h2>
        <p>
          We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service ceases immediately. Sections related to intellectual property, disclaimers, limitations of liability, and governing law survive termination. You may also terminate your account at any time by contacting us.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">11. GOVERNING LAW</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the European Union and the applicable member state jurisdiction. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in the applicable jurisdiction. If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">12. CHANGES TO TERMS</h2>
        <p>
          We reserve the right to modify these Terms at any time. Material changes will be communicated via email or a prominent notice on the Service at least 30 days before they take effect. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2 className="text-sm md:text-base font-bold tracking-widest text-foreground mb-3">13. CONTACT</h2>
        <p>
          If you have questions about these Terms, contact us at legal@shadowbrokers.io.
        </p>
      </section>
    </LegalPageLayout>
  );
}

import Link from 'next/link'

export const metadata = {
  description: 'Privacy policy for Everynews',
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      <h1 className='mb-8 text-4xl font-bold'>Privacy Policy</h1>

      <div className='prose prose-gray max-w-none dark:prose-invert'>
        <p className='text-lg text-muted-foreground mb-8'>
          Last updated June 20, 2025
        </p>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Scope</h2>
          <p>
            This Policy explains how Everynews ("we," "us," "our") collects,
            uses, stores, and discloses personal data when you use the Everynews
            platform, websites, and related services.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Data Controller</h2>
          <p>
            Everynews, Republic of Korea, is the controller for personal data
            processed under this Policy. Contact{' '}
            <Link
              href='mailto:privacy@every.news'
              className='text-orange-500 hover:underline'
            >
              privacy@every.news
            </Link>
            .
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Categories of Personal Data Processed
          </h2>
          <h3 className='text-xl font-semibold mb-2'>Account Data</h3>
          <p className='mb-4'>
            Name, email, authentication credentials, role, organization.
          </p>
          <h3 className='text-xl font-semibold mb-2'>Configuration Data</h3>
          <p className='mb-4'>
            Alert queries, delivery schedules, integration settings, Slack
            channel identifiers, webhook URLs.
          </p>
          <h3 className='text-xl font-semibold mb-2'>Usage Data</h3>
          <p className='mb-4'>
            Server logs, IP addresses, timestamps, user-agent strings,
            click-through metrics.
          </p>
          <h3 className='text-xl font-semibold mb-2'>Feedback Data</h3>
          <p className='mb-4'>Relevance votes, free-text comments.</p>
          <h3 className='text-xl font-semibold mb-2'>
            Cookies and Similar Technologies
          </h3>
          <p className='mb-4'>
            Session tokens, preference cookies, analytics identifiers.
          </p>
          <h3 className='text-xl font-semibold mb-2'>Phone Numbers</h3>
          <p className='mb-4'>
            Phone numbers for SMS notifications when voluntarily provided during
            onboarding.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Purposes and Legal Bases
          </h2>
          <h3 className='text-xl font-semibold mb-2'>Service Provision</h3>
          <p className='mb-4'>Create accounts, generate and deliver alerts.</p>
          <h3 className='text-xl font-semibold mb-2'>Service Improvement</h3>
          <p className='mb-4'>
            Model training, feature development, error diagnostics.
          </p>
          <h3 className='text-xl font-semibold mb-2'>Security</h3>
          <p className='mb-4'>
            Intrusion detection, abuse prevention, log retention.
          </p>
          <h3 className='text-xl font-semibold mb-2'>Compliance</h3>
          <p className='mb-4'>Tax, accounting, legal obligations.</p>
          <h3 className='text-xl font-semibold mb-2'>
            Marketing Communications
          </h3>
          <p className='mb-4'>Only with opt-in consent.</p>
          <h3 className='text-xl font-semibold mb-2'>SMS Notifications</h3>
          <p className='mb-4'>
            Training reminders and updates via SMS with opt-in consent. Standard
            messaging rates may apply.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Data Retention</h2>
          <p>
            Account and configuration data persist until account deletion. Logs
            retained 12 months, then aggregated or deleted. Backup archives
            purged after 30 days. Legal retention overrides apply.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Disclosure to Third Parties
          </h2>
          <h3 className='text-xl font-semibold mb-2'>Infrastructure</h3>
          <p className='mb-4'>
            Cloud hosting, email delivery, vector storage, located in United
            States and Republic of Korea.
          </p>
          <h3 className='text-xl font-semibold mb-2'>Integrations</h3>
          <p className='mb-4'>
            When you connect Slack, webhooks, or email, relevant alert content
            and metadata are delivered to those services.
          </p>
          <h3 className='text-xl font-semibold mb-2'>Legal Requests</h3>
          <p className='mb-4'>Disclosed only when legally required.</p>
          <h3 className='text-xl font-semibold mb-2'>SMS Provider</h3>
          <p className='mb-4'>
            Phone numbers shared with our SMS provider for message delivery,
            subject to their privacy policy.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            International Transfers
          </h2>
          <p>
            Data may be processed outside your jurisdiction. Standard
            Contractual Clauses or equivalent safeguards are applied where
            required.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Security Measures</h2>
          <p>
            End-to-end TLS, encryption at rest, role-based access, auditing,
            least-privilege keys, regular penetration tests.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>User Rights</h2>
          <p>
            Subject to local laws Access, rectification, erasure, restriction,
            portability, objection, withdrawal of consent. Exercise via{' '}
            <Link
              href='mailto:privacy@every.news'
              className='text-orange-500 hover:underline'
            >
              privacy@every.news
            </Link>
            .
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Automated Decision-Making
          </h2>
          <p>
            Alert relevance scoring uses automated algorithms. No solely
            automated decisions produce legal or similarly significant effects
            on individuals.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Children</h2>
          <p>
            Service not directed to minors under 16. Accounts for minors
            prohibited.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>SMS Opt-Out</h2>
          <p>
            To stop receiving SMS messages, text STOP to any message. After
            opting out, we will not send further SMS messages or sell/transfer
            your phone number.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Sibling Product Communications
          </h2>
          <p>
            From time to time, we may send you emails about other products and
            services offered by Everynews or our affiliated companies that we
            believe may be of interest to you. You may opt out of receiving
            these sibling product emails at any time by contacting{' '}
            <Link
              href='mailto:products@every.news'
              className='text-orange-500 hover:underline'
            >
              products@every.news
            </Link>
            . This opt-out will not affect your receipt of service-related
            emails regarding your Everynews account.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Changes to This Policy
          </h2>
          <p>
            Material changes posted on this page with a new "Last updated" date.
            Continued use signifies acceptance of revisions.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Complaints</h2>
          <p>
            Users may lodge complaints with their local supervisory authority.
          </p>
        </section>
      </div>
    </div>
  )
}

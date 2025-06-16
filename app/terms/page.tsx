import Link from 'next/link'

export const metadata = {
  description: 'Terms of use for Everynews',
  title: 'Terms of Use',
}

export default function TermsPage() {
  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      <h1 className='mb-8 text-4xl font-bold'>Terms of Use</h1>

      <div className='prose prose-gray max-w-none dark:prose-invert'>
        <p className='text-lg text-muted-foreground mb-8'>
          Last Updated June 14, 2025
        </p>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Acceptance</h2>
          <p>
            Use of Everynews constitutes acceptance of these Terms. Discontinue
            use if you disagree.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Service</h2>
          <p>
            Everynews aggregates hyperlinks, excerpts, and metadata from
            publicly available online sources, then delivers compilations to
            designated endpoints. Everynews does not host or reproduce full
            third-party works.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Intellectual Property</h2>
          <h3 className='text-xl font-semibold mb-2'>Platform IP</h3>
          <p className='mb-4'>
            All software, branding, and compiled alerts are owned by Everynews
            or its licensors.
          </p>
          <h3 className='text-xl font-semibold mb-2'>Third-Party Content</h3>
          <p className='mb-4'>
            Copyright and allied rights in linked articles, papers, patents, or
            other materials remain with their respective owners. Links and
            snippets are provided solely for indexing and reference.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            User Rights and Restrictions
          </h2>
          <h3 className='text-xl font-semibold mb-2'>Permitted Use</h3>
          <p className='mb-4'>Internal research, monitoring, and analysis.</p>
          <h3 className='text-xl font-semibold mb-2'>Prohibited Use</h3>
          <ul className='list-disc pl-6 space-y-2'>
            <li>
              Storing or redistributing full third-party content without
              permission.
            </li>
            <li>Circumventing paywalls or technical protection measures.</li>
            <li>
              Automated high-volume extraction that violates source site terms.
            </li>
            <li>
              Any activity violating applicable copyright, database-right, or
              privacy laws.
            </li>
          </ul>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Feedback License</h2>
          <p>
            User feedback may be used, reproduced, and sublicensed by Everynews
            to improve the service without compensation.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Delivery Channels</h2>
          <p>
            User must ensure integrations (email, Slack, webhooks) comply with
            recipient policies and data protection rules.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>No Ownership Transfer</h2>
          <p>
            Everynews delivers pointers to third-party materials; ownership of
            such materials is not transferred. Users obtain any further rights
            directly from the original publishers.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Disclaimer of Warranties
          </h2>
          <p>
            Service provided "as is." No warranty of accuracy, completeness, or
            suitability.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, Everynews is not liable for
            indirect, incidental, consequential, or punitive damages, or for any
            claim arising from third-party content.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Indemnity</h2>
          <p>
            User will indemnify and hold Everynews harmless from claims related
            to misuse of the service or infringement caused by user actions.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>
            Suspension and Termination
          </h2>
          <p>
            Everynews may suspend or terminate access at any time for violation
            of these Terms or to comply with law.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Modifications</h2>
          <p>
            Terms may be updated; continued use after changes constitutes
            acceptance.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Governing Law</h2>
          <p>Everynews is based in Republic of Korea. ROK law governs.</p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Contact</h2>
          <p>
            Contact us at{' '}
            <Link
              href='mailto:legal@every.news'
              className='text-orange-500 hover:underline'
            >
              legal@every.news
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}

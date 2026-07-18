<script setup lang="ts">
import LegalPage from '@/components/legal/LegalPage.vue'
import { CONTACT_EMAIL } from '@/lib/contact'
</script>

<template>
  <LegalPage title="Data Processing Agreement" updated="16 July 2026">
    <p>
      This Data Processing Agreement ("<strong>DPA</strong>") forms part of the
      <router-link :to="{ name: 'terms' }">Terms of Service</router-link> between
      <strong>Business Document Gateway</strong> ("<strong>Processor</strong>", "<strong>we</strong>") and the Account Owner
      ("<strong>Controller</strong>", "<strong>you</strong>"). It governs the processing of personal data that we carry
      out on your behalf when you use the Business Document Gateway service (the "<strong>Service</strong>") to collect
      Documents from your clients. It reflects the requirements of Article 28 of the GDPR / RGPD.
    </p>

    <h2>1. Roles</h2>
    <p>
      For personal data contained in the Documents and requests you create, you are the <strong>Controller</strong> and
      we are the <strong>Processor</strong>. You determine the purposes and means of the processing; we process the data
      only on your documented instructions, which include your configuration and use of the Service and this DPA.
    </p>

    <h2>2. Subject matter and details of processing</h2>
    <table>
      <tbody>
        <tr><th>Subject matter</th><td>Collection, storage, and management of documents and related information via the Service.</td></tr>
        <tr><th>Duration</th><td>For the term of your account, plus any short technical backup or legal-retention window.</td></tr>
        <tr><th>Nature and purpose</th><td>Hosting, storage, transmission, review, and download of Documents; sending related notifications.</td></tr>
        <tr><th>Types of personal data</th><td>Determined by you — typically identification and contact details and the contents of the Documents you request from your clients.</td></tr>
        <tr><th>Categories of data subjects</th><td>Your clients and any individuals whose data appears in the Documents.</td></tr>
      </tbody>
    </table>

    <h2>3. Processor obligations</h2>
    <p>We will:</p>
    <ul>
      <li>process personal data only on your documented instructions, including regarding international transfers, unless required otherwise by law (in which case we will inform you unless legally prohibited);</li>
      <li>ensure that persons authorised to process the data are bound by confidentiality;</li>
      <li>implement appropriate technical and organisational security measures (Section 5);</li>
      <li>respect the conditions for engaging sub-processors (Section 4);</li>
      <li>assist you, taking into account the nature of the processing, in responding to data subject requests and in meeting your obligations regarding security, breach notification, and data protection impact assessments;</li>
      <li>at your choice, delete or return the personal data at the end of the provision of the Service, subject to legal retention requirements;</li>
      <li>make available information necessary to demonstrate compliance and allow for and contribute to audits as described in Section 7.</li>
    </ul>

    <h2>4. Sub-processors</h2>
    <p>
      You give general authorisation for us to engage sub-processors to provide the Service. We impose data protection
      obligations on each sub-processor no less protective than those in this DPA, and we remain responsible for their
      performance. Our current sub-processors include:
    </p>
    <table>
      <thead>
        <tr><th>Sub-processor</th><th>Purpose</th></tr>
      </thead>
      <tbody>
        <tr><td>Supabase</td><td>Database, authentication, and document storage</td></tr>
        <tr><td>Resend</td><td>Transactional email delivery</td></tr>
        <tr><td>Stripe</td><td>Payment and subscription processing</td></tr>
        <tr><td>[HOSTING PROVIDER, e.g. Vercel]</td><td>Application hosting and delivery</td></tr>
      </tbody>
    </table>
    <p>We will inform you of intended changes to sub-processors and give you the opportunity to object on reasonable data protection grounds.</p>

    <h2>5. Security measures</h2>
    <p>We maintain appropriate measures under Article 32 of the GDPR, including:</p>
    <ul>
      <li>encryption of data in transit (TLS);</li>
      <li>row-level security and access controls limiting data access to authorised parties;</li>
      <li>optional access codes (PIN) and link expiry on client portals;</li>
      <li>logging and monitoring; and</li>
      <li>measures to restore availability and access to data in a timely manner after an incident.</li>
    </ul>

    <h2>6. Data subject requests and breach notification</h2>
    <p>
      Taking into account the nature of the processing, we will assist you by appropriate measures to fulfil your
      obligation to respond to requests from data subjects. If we become aware of a personal data breach affecting your
      data, we will notify you without undue delay and provide information reasonably available to help you meet your
      notification obligations.
    </p>

    <h2>7. Audits</h2>
    <p>
      We will make available information necessary to demonstrate compliance with this DPA and allow for audits,
      including inspections, conducted by you or an auditor mandated by you, subject to reasonable notice,
      confidentiality, and frequency limits, and in a manner that does not compromise the security of other customers.
    </p>

    <h2>8. International transfers</h2>
    <p>
      Where processing involves transferring personal data outside the European Economic Area, we will ensure an
      appropriate transfer mechanism is in place, such as the European Commission's Standard Contractual Clauses.
    </p>

    <h2>9. Deletion and return</h2>
    <p>
      On termination of the Service, or on your instruction, we will delete or return the personal data we process on
      your behalf, subject to short technical backup windows and any retention required by law. Deleting a request or
      your account removes the associated Documents from active storage.
    </p>

    <h2>10. Liability and order of precedence</h2>
    <p>
      Liability under this DPA is subject to the limitations in the Terms of Service. In the event of a conflict between
      this DPA and the Terms regarding the processing of personal data, this DPA prevails.
    </p>

    <h2>11. Acceptance</h2>
    <p>
      By accepting the Terms of Service and using the Service to collect Documents, you enter into this DPA. If you
      require a countersigned copy for your records, contact us at
      <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
    </p>
  </LegalPage>
</template>

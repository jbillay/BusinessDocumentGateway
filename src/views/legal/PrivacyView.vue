<script setup lang="ts">
import LegalPage from '@/components/legal/LegalPage.vue'
import { CONTACT_EMAIL } from '@/lib/contact'
</script>

<template>
  <LegalPage title="Privacy Policy" updated="16 July 2026">
    <p>
      This Privacy Policy explains how <strong>Business Document Gateway</strong> ("<strong>we</strong>",
      "<strong>us</strong>") collects and uses personal data when you use the Business Document Gateway service (the
      "<strong>Service</strong>"). We are committed to protecting your privacy in accordance with the EU General Data
      Protection Regulation (GDPR / RGPD) and applicable French law.
    </p>

    <h2>1. Controller</h2>
    <p>
      <!-- TODO(legal): add registered entity name and address after counsel review. -->
      For personal data relating to Account Owners and visitors to our website, the data controller is
      <strong>Business Document Gateway</strong>, established in France. You can reach us at
      <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
    </p>
    <p>
      <strong>Documents uploaded by Clients.</strong> When an Account Owner collects Documents from their own clients,
      the Account Owner is the controller of that data and we act only as their processor. Our handling of that data is
      governed by our <router-link :to="{ name: 'dpa' }">Data Processing Agreement</router-link>. If you are a Client
      who received an upload link, please direct data protection requests to the Account Owner who invited you.
    </p>

    <h2>2. Data we collect</h2>
    <ul>
      <li><strong>Account data</strong> — name, company, email address, and password (stored hashed) when you register.</li>
      <li><strong>Document request data</strong> — the requests you create, checklists, portal settings, and status information.</li>
      <li><strong>Uploaded Documents</strong> — files uploaded by you or your Clients through the Service.</li>
      <li><strong>Payment data</strong> — when you subscribe to Pro, billing is handled by Stripe. We receive limited subscription information (plan, status, renewal date) but never your full card details.</li>
      <li><strong>Usage and technical data</strong> — log data such as IP address, device/browser information, and actions taken, used to operate and secure the Service.</li>
    </ul>

    <h2>3. How we use your data and legal bases</h2>
    <table>
      <thead>
        <tr><th>Purpose</th><th>Legal basis (GDPR Art. 6)</th></tr>
      </thead>
      <tbody>
        <tr><td>Provide and operate the Service, including accounts and document requests</td><td>Performance of a contract</td></tr>
        <tr><td>Process payments and manage subscriptions</td><td>Performance of a contract</td></tr>
        <tr><td>Send transactional emails (confirmations, reminders, notifications)</td><td>Performance of a contract</td></tr>
        <tr><td>Secure the Service and prevent abuse</td><td>Legitimate interests</td></tr>
        <tr><td>Optional analytics to improve the Service</td><td>Consent</td></tr>
        <tr><td>Comply with legal obligations (e.g. accounting)</td><td>Legal obligation</td></tr>
      </tbody>
    </table>

    <h2>4. Sharing and sub-processors</h2>
    <p>We do not sell your personal data. We share it only with service providers that help us run the Service, under appropriate contractual safeguards:</p>
    <ul>
      <li><strong>Supabase</strong> — database, authentication, and file storage hosting.</li>
      <li><strong>Resend</strong> — transactional email delivery.</li>
      <li><strong>Stripe</strong> — payment processing and subscription management.</li>
      <li><strong>[HOSTING PROVIDER, e.g. Vercel]</strong> — application hosting and content delivery.</li>
    </ul>
    <p>We may also disclose data where required by law or to protect our rights.</p>

    <h2>5. International transfers</h2>
    <p>
      Some providers may process data outside the European Economic Area. Where that occurs, we rely on appropriate
      safeguards such as the European Commission's Standard Contractual Clauses to ensure your data remains protected.
    </p>

    <h2>6. Retention</h2>
    <p>
      We keep personal data only as long as necessary for the purposes described above: for the life of your account,
      and afterwards as required to meet legal, accounting, or dispute-resolution obligations. Uploaded Documents are
      retained according to the Account Owner's use and deleted when a request or account is deleted, subject to short
      technical backup windows.
    </p>

    <h2>7. Security</h2>
    <p>
      We implement technical and organisational measures to protect personal data, including encryption in transit,
      access controls, row-level security on our database, and optional access codes and link expiry on client portals.
      No system is completely secure, but we work to protect your data against unauthorised access, loss, or misuse.
    </p>

    <h2>8. Your rights</h2>
    <p>Under the GDPR you have the right to:</p>
    <ul>
      <li>access the personal data we hold about you;</li>
      <li>request correction of inaccurate data;</li>
      <li>request erasure ("right to be forgotten");</li>
      <li>restrict or object to certain processing;</li>
      <li>data portability;</li>
      <li>withdraw consent at any time, without affecting prior processing.</li>
    </ul>
    <p>
      To exercise these rights, contact <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>. You also have the
      right to lodge a complaint with your supervisory authority — in France, the Commission Nationale de
      l'Informatique et des Libertés (<a href="https://www.cnil.fr" target="_blank" rel="noopener">CNIL</a>).
    </p>

    <h2>9. Cookies</h2>
    <p>
      We use strictly necessary cookies and local storage to keep you signed in, and — only with your consent —
      optional analytics. See our <router-link :to="{ name: 'cookie-policy' }">Cookie Policy</router-link> to learn
      more and manage your choices at any time.
    </p>

    <h2>10. Children</h2>
    <p>The Service is not directed at children and is intended for use by businesses and professionals only.</p>

    <h2>11. Changes to this policy</h2>
    <p>
      We may update this Privacy Policy from time to time. We will post the updated version here and, for material
      changes, provide additional notice. The "last updated" date above reflects the latest revision.
    </p>

    <h2>12. Contact</h2>
    <p>
      For any privacy question or request, contact us at <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
      <span>[If you appoint a Data Protection Officer, add their contact details here.]</span>
    </p>
  </LegalPage>
</template>

<script setup lang="ts">
import LegalPage from '@/components/legal/LegalPage.vue'
import { CONTACT_EMAIL } from '@/lib/contact'
</script>

<template>
  <LegalPage title="Terms of Service" updated="16 July 2026">
    <!-- TODO(legal): add registered entity name, SIREN, and registered office after counsel review. -->
    <p>
      These Terms of Service (the "<strong>Terms</strong>") govern your access to and use of the Business Document
      Gateway application and related services (the "<strong>Service</strong>"), operated by
      <strong>Business Document Gateway</strong>, established in France ("<strong>we</strong>", "<strong>us</strong>",
      "<strong>our</strong>"). By creating an account or using the Service, you agree to these Terms. If you do not
      agree, do not use the Service.
    </p>

    <h2>1. Definitions</h2>
    <ul>
      <li><strong>Account Owner</strong> — the individual or organisation that registers an account to collect documents.</li>
      <li><strong>Client</strong> — a third party invited by an Account Owner to upload documents via a secure portal link.</li>
      <li><strong>Documents</strong> — files and information uploaded to the Service by an Account Owner or their Clients.</li>
      <li><strong>Content</strong> — Documents together with any other data submitted to the Service.</li>
    </ul>

    <h2>2. Eligibility and accounts</h2>
    <p>
      You must be at least 18 years old and able to form a binding contract to use the Service. You are responsible for
      the accuracy of the information you provide, for maintaining the confidentiality of your credentials, and for all
      activity that occurs under your account. Notify us promptly of any unauthorised use.
    </p>

    <h2>3. The Service</h2>
    <p>
      The Service lets Account Owners create document requests, send secure upload links to Clients, receive and review
      uploaded Documents, and download collected files. Features available depend on your plan. We may add, change, or
      remove features over time.
    </p>

    <h2>4. Plans, billing, and payments</h2>
    <p>
      The Service offers a Free plan and a paid Pro plan. Current pricing and plan limits are shown on our
      <router-link :to="{ name: 'pricing' }">pricing page</router-link>. Paid subscriptions are billed in advance on a
      monthly or annual basis through our payment processor, Stripe. By subscribing you authorise us and Stripe to
      charge your payment method on a recurring basis until you cancel.
    </p>
    <ul>
      <li><strong>Renewals.</strong> Subscriptions renew automatically at the end of each billing period unless cancelled beforehand.</li>
      <li><strong>Cancellation.</strong> You may cancel at any time from the billing page. Your paid features continue until the end of the period already paid for, after which the account reverts to Free.</li>
      <li><strong>Refunds.</strong> Except where required by applicable law, payments are non-refundable.</li>
      <li><strong>Taxes.</strong> Stated prices exclude applicable taxes (including VAT), which will be added where required.</li>
      <li><strong>Changes.</strong> We may change prices with reasonable prior notice; changes take effect at your next renewal.</li>
    </ul>

    <h2>5. Acceptable use</h2>
    <p>You agree not to use the Service to:</p>
    <ul>
      <li>upload or transmit unlawful, infringing, harmful, or malicious content;</li>
      <li>collect Documents without a lawful basis or the necessary consent from the individuals concerned;</li>
      <li>attempt to gain unauthorised access to the Service, other accounts, or portal links;</li>
      <li>disrupt or overload the Service, or circumvent usage limits or security measures;</li>
      <li>use the Service to send unsolicited communications or for any illegal purpose.</li>
    </ul>

    <h2>6. Account Owner responsibilities</h2>
    <p>
      As the party that decides what Documents to collect from Clients, you act as the <strong>data controller</strong>
      for those Documents and we act as your <strong>data processor</strong>. You are responsible for having a lawful
      basis to request and process the Documents, for informing your Clients appropriately, and for handling their data
      protection requests. Our processing on your behalf is governed by our
      <router-link :to="{ name: 'dpa' }">Data Processing Agreement</router-link>.
    </p>

    <h2>7. Your content</h2>
    <p>
      You and your Clients retain all rights to your Content. You grant us a limited licence to host, store, process,
      and transmit Content solely to provide and maintain the Service. You are responsible for keeping your own copies;
      the Service is not a backup or archival service.
    </p>

    <h2>8. Intellectual property</h2>
    <p>
      The Service, including its software, design, and trademarks, is owned by us and our licensors and is protected by
      intellectual property laws. These Terms grant you a limited, non-exclusive, non-transferable right to use the
      Service; no other rights are granted.
    </p>

    <h2>9. Third-party services</h2>
    <p>
      The Service relies on third-party providers (including cloud hosting, email delivery, and payment processing).
      Your use of the Service may be subject to those providers' terms. We are not responsible for third-party services
      outside our control.
    </p>

    <h2>10. Availability and disclaimer of warranties</h2>
    <p>
      We aim to keep the Service available but do not guarantee uninterrupted or error-free operation. To the maximum
      extent permitted by law, the Service is provided "<strong>as is</strong>" and "<strong>as available</strong>"
      without warranties of any kind, whether express or implied, including fitness for a particular purpose and
      non-infringement.
    </p>

    <h2>11. Limitation of liability</h2>
    <p>
      To the maximum extent permitted by law, we will not be liable for any indirect, incidental, special,
      consequential, or punitive damages, or for loss of profits, data, or goodwill. Our total aggregate liability
      arising out of or relating to the Service will not exceed the amounts you paid to us for the Service in the twelve
      (12) months preceding the event giving rise to the claim. Nothing in these Terms excludes liability that cannot be
      excluded under applicable law.
    </p>

    <h2>12. Indemnity</h2>
    <p>
      You agree to indemnify and hold us harmless from claims, damages, and expenses arising out of your Content, your
      use of the Service, or your breach of these Terms or applicable law.
    </p>

    <h2>13. Suspension and termination</h2>
    <p>
      You may stop using the Service and close your account at any time. We may suspend or terminate access if you
      breach these Terms, fail to pay, or use the Service in a way that risks harm to others or to the Service. On
      termination, your right to use the Service ends; we may delete Content after a reasonable period in accordance
      with our <router-link :to="{ name: 'privacy' }">Privacy Policy</router-link>.
    </p>

    <h2>14. Changes to these Terms</h2>
    <p>
      We may update these Terms from time to time. If we make material changes, we will provide reasonable notice (for
      example, by email or in-app). Continued use of the Service after changes take effect constitutes acceptance.
    </p>

    <h2>15. Governing law and jurisdiction</h2>
    <p>
      These Terms are governed by the laws of France, without regard to conflict-of-law rules. Subject to any mandatory
      consumer protections that apply to you, the competent French courts will have exclusive jurisdiction over any
      dispute arising out of or relating to these Terms or the Service.
    </p>

    <h2>16. Contact</h2>
    <p>
      Questions about these Terms? Contact us at <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>.
    </p>
  </LegalPage>
</template>

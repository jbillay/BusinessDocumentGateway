<script setup lang="ts">
import GuidePage from '@/components/marketing/GuidePage.vue'
</script>

<template>
  <GuidePage
    title="The new-client onboarding document checklist"
    lede="The documents accountants, agencies, and consultancies actually need on day one — organised so you can copy it straight into your next request."
    updated="19 July 2026"
  >
    <p>
      Every firm has a version of this list in someone's head. Writing it down — once, properly — is the difference
      between onboarding that takes a week and onboarding that takes a month of follow-up emails. Use the sections
      below as a starting point, delete what doesn't apply, and save the result as your reusable template.
    </p>

    <h2>Identity and compliance (almost everyone)</h2>
    <ul>
      <li><strong>Photo ID</strong> — passport or driving licence, in date, for every director or signatory</li>
      <li><strong>Proof of address</strong> — utility bill or bank statement, under 3 months old</li>
      <li><strong>Company registration details</strong> — certificate of incorporation or registry extract</li>
      <li><strong>Beneficial-ownership information</strong> — for AML/KYC checks where they apply to you</li>
    </ul>

    <h2>Financial onboarding (accountants and bookkeepers)</h2>
    <ul>
      <li><strong>Last filed accounts</strong> and the trial balance behind them</li>
      <li><strong>Bank statements</strong> — last 3 months for every business account</li>
      <li><strong>Tax references</strong> — VAT number, corporation/income tax references, payroll scheme details</li>
      <li><strong>Access hand-over</strong> — accounting software invite, or an export if they're switching</li>
      <li><strong>Outstanding items</strong> — unfiled returns, open notices, anything mid-flight from the previous firm</li>
    </ul>

    <h2>Project onboarding (agencies and consultancies)</h2>
    <ul>
      <li><strong>Signed engagement letter</strong> or master services agreement</li>
      <li><strong>Brand assets</strong> — logo files, brand guidelines, fonts</li>
      <li><strong>Access credentials</strong> — domain, hosting, analytics, ad accounts (shared securely, never in email)</li>
      <li><strong>Existing materials</strong> — current site content, previous campaign reports, photography</li>
    </ul>

    <h2>People onboarding (HR)</h2>
    <ul>
      <li><strong>Right-to-work documents</strong></li>
      <li><strong>Signed contract</strong> and policy acknowledgements</li>
      <li><strong>Bank and tax details</strong> for payroll</li>
      <li><strong>Emergency contact</strong> and any relevant certifications</li>
    </ul>

    <h2>Three rules that make any checklist work</h2>
    <p>
      <strong>Specify the format.</strong> "Bank statement" invites a phone screenshot. "Bank statement — PDF export
      from your online banking, all pages" gets you something you can actually file.
    </p>
    <p>
      <strong>Explain the awkward ones.</strong> Clients stall on documents they don't understand the need for. One
      clause of explanation next to the AML items saves four emails.
    </p>
    <p>
      <strong>Keep the list versioned in one place.</strong> The checklist that lives in an inbox drifts: each partner
      asks for a slightly different set, and nobody knows which is current. Keep one canonical template and reuse it
      for every new client — that's also exactly what a
      <router-link :to="{ name: 'landing' }">document collection tool</router-link> with a reusable library does for
      you, including the chasing.
    </p>
  </GuidePage>
</template>

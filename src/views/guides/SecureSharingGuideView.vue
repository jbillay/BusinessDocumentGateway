<script setup lang="ts">
import GuidePage from '@/components/marketing/GuidePage.vue'
</script>

<template>
  <GuidePage
    title="Secure alternatives to email attachments for client files"
    lede="Why sensitive documents shouldn't travel as attachments, what the GDPR expects from a small firm, and the practical options ranked."
    updated="19 July 2026"
  >
    <p>
      Most firms know, vaguely, that emailing a passport scan isn't great. Here's the concrete version: an attachment
      is copied in full to at least two mail servers and every device that syncs either inbox, it stays there
      indefinitely, it's rarely encrypted at rest, and either party's compromised mailbox exposes it forever. If you
      handle identity documents, bank statements, contracts, or payroll data for clients, attachments are the weakest
      link in your practice.
    </p>

    <h2>What the GDPR actually asks of you</h2>
    <p>
      The regulation doesn't name technologies — it asks for "appropriate technical and organisational measures"
      (Article 32) proportionate to the risk. For client documents that means, in practice:
    </p>
    <ul>
      <li><strong>Transport encryption</strong> — the file travels over HTTPS, not as a plain attachment</li>
      <li><strong>Access control</strong> — only the intended people can open the location it lands in</li>
      <li><strong>Limited retention</strong> — links and copies stop working when the job is done, instead of living in inboxes forever</li>
      <li><strong>Accountability</strong> — you can say who uploaded what, and when</li>
    </ul>
    <p>
      An email attachment fails all four. Almost any dedicated channel passes the first two; the differences show up in
      retention and accountability.
    </p>

    <h2>The options, ranked for a small firm</h2>
    <h3>1. A dedicated document-collection portal</h3>
    <p>
      Purpose-built for exactly this: the client gets a secure link (optionally protected by an access code and an
      expiry date), uploads against a checklist, and every file lands in one access-controlled place with a record of
      what arrived when. No account for the client, nothing left behind in an inbox. This is the strongest option and
      the least work — it's what <router-link :to="{ name: 'landing' }">Business Document Gateway</router-link> does,
      with <router-link :to="{ name: 'pricing' }">security included on the free plan</router-link>.
    </p>
    <h3>2. A shared cloud-drive folder</h3>
    <p>
      Workable if you're disciplined: per-client folders, invite-only access, and a calendar reminder to revoke
      sharing when the engagement ends. The weaknesses are practical — clients upload to the wrong folder, nothing
      chases them, and access reviews depend on someone remembering.
    </p>
    <h3>3. Password-protected archives over email</h3>
    <p>
      Better than nothing, worse than it looks: the password usually travels over the same channel, ZIP encryption
      varies from strong to trivial, and you've still parked the archive in two inboxes indefinitely.
    </p>
    <h3>4. Plain attachments</h3>
    <p>Only for documents you'd be comfortable seeing forwarded. Which is not what your clients send you.</p>

    <h2>The transition that actually sticks</h2>
    <p>
      Firms rarely fail at security for lack of tools — they fail because the secure path is slower than the insecure
      one. The fix is to make the secure path the <em>convenient</em> path: one link you send at the start of every
      engagement, that does the chasing for you and hands you a tidy ZIP at the end. When the right way is also the
      easy way, the attachments stop on their own.
    </p>
  </GuidePage>
</template>

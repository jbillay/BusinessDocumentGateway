<script setup lang="ts">
import GuidePage from '@/components/marketing/GuidePage.vue'
</script>

<template>
  <GuidePage
    title="How to collect documents from clients (without the email chaos)"
    lede="A practical workflow for accountants, agencies, and small firms who chase paperwork every week — and what to automate first."
    updated="19 July 2026"
  >
    <p>
      If you onboard clients, file returns, run payroll, or manage projects, you already know the pattern: you ask for
      five documents, you get two, one is the wrong year, and the thread devolves into "did you see my last email?".
      Collecting documents isn't hard because clients are difficult — it's hard because <strong>email is a terrible
      collection tool</strong>. Here's a workflow that fixes it.
    </p>

    <h2>1. Turn your request into a checklist, not a paragraph</h2>
    <p>
      The single biggest improvement costs nothing: stop describing what you need in prose. A sentence like "please
      send your ID, proof of address and last three bank statements" becomes a mental to-do list the client has to
      reconstruct every time they open your email. Send a <strong>numbered checklist</strong> instead — one line per
      document, with the format and period spelled out ("Bank statement — PDF — March to May").
    </p>
    <p>
      Checklists also give you something email never will: a way to see at a glance what's still missing.
    </p>

    <h2>2. Give every request a deadline (and say why)</h2>
    <p>
      "As soon as possible" produces documents in three weeks. A concrete date — with the reason attached — produces
      them in days: "by Friday the 12th, so we can file before the deadline and avoid the late penalty". Clients
      prioritise what protects <em>them</em>.
    </p>

    <h2>3. Move the upload out of the inbox</h2>
    <p>
      Email attachments fail in every direction at once: size limits bounce large files, sensitive documents sit
      unencrypted in two inboxes forever, and versions multiply ("final_v2_REAL.pdf"). A dedicated upload link — one
      secure page where the client can see the checklist and drop files against each item — removes all three problems,
      and spares your client from creating yet another account. (This is exactly what a
      <router-link :to="{ name: 'landing' }">document collection portal</router-link> does; if you prefer to stay
      manual, even a well-organised shared-drive folder beats attachments.)
    </p>

    <h2>4. Let reminders be automatic — and polite</h2>
    <p>
      The most draining part of collection is the chasing, because every reminder you write by hand costs you a small
      moment of social discomfort. Automated reminders remove the discomfort <em>and</em> the forgetting: a friendly
      nudge goes out on schedule, tied to the deadline, listing only what's still outstanding. Nobody has to feel like
      they're nagging, so reminders actually get sent.
    </p>

    <h2>5. Review as files arrive, not at the end</h2>
    <p>
      The wrong-year bank statement discovered on deadline day is a crisis; the same statement flagged the hour it was
      uploaded is a non-event. Review each document as it lands and reject the ones that miss — with a one-line reason
      — so the client can fix it while the context is fresh.
    </p>

    <h2>6. Deliver everything to yourself once, in one place</h2>
    <p>
      Finish the job properly: when the last document is approved, everything should land in your working folder in one
      motion — consistently named, grouped by request, ready to file. If you're assembling that ZIP by hand from six
      email threads, that's the last piece worth automating.
    </p>

    <h2>The checklist, condensed</h2>
    <ul>
      <li>One numbered checklist per request — never prose</li>
      <li>A real deadline, with the client's reason attached</li>
      <li>A secure upload link instead of attachments</li>
      <li>Automatic reminders tied to the deadline</li>
      <li>Same-day review with specific rejection reasons</li>
      <li>One tidy download at the end</li>
    </ul>
    <p>
      You can run this workflow with discipline and a shared drive — or let a purpose-built tool run it for you. See
      <router-link :to="{ name: 'pricing' }">what that costs</router-link> (the honest answer: nothing, to start).
    </p>
  </GuidePage>
</template>

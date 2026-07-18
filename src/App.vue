<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import CookieBanner from '@/components/legal/CookieBanner.vue'
import CookieSettingsDialog from '@/components/legal/CookieSettingsDialog.vue'
</script>

<template>
  <!-- Keyboard users jump straight past the sticky nav; views expose id="main". -->
  <a class="bdg-skip-link" href="#main">Skip to content</a>
  <Toast position="top-right" />
  <ConfirmDialog />
  <!--
    Deliberately no <transition> around the router-view: Vue's Transition waits on
    requestAnimationFrame, which throttled/background renderers never tick, leaving
    an unmounted "zombie" view in the DOM. Page-enter polish comes from a pure CSS
    animation on the view root (see main.css) that can't block navigation.
  -->
  <router-view />
  <!-- GDPR consent, app-wide (task 021) -->
  <CookieBanner />
  <CookieSettingsDialog />
</template>

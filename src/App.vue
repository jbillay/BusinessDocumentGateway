<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <Toast position="top-right" />
  <ConfirmDialog />
  <!--
    Deliberately no <transition> around the router-view: Vue's Transition waits on
    requestAnimationFrame, which throttled/background renderers never tick, leaving
    an unmounted "zombie" view in the DOM. Page-enter polish comes from a pure CSS
    animation on the view root (see main.css) that can't block navigation.
  -->
  <router-view />
</template>

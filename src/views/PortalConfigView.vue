<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { brandingUrl } from '@/lib/supabase'
import { usePortalSettingsStore, type PortalSettingsInput } from '@/stores/portalSettings'
import { useBillingStore } from '@/stores/billing'
import { PORTAL_SETTINGS_DEFAULTS, planLimitCode } from '@/types'

const router = useRouter()
const toast = useToast()
const store = usePortalSettingsStore()
const billing = useBillingStore()

/** Branding is a Pro feature: fields stay visible but locked on Free (task 016). */
const locked = computed(() => billing.entitlements !== null && !billing.canUseBranding)

const form = reactive<PortalSettingsInput>({ ...PORTAL_SETTINGS_DEFAULTS })
const errors = reactive<{ logo?: string }>({})
const saving = ref(false)

const logoInput = ref<HTMLInputElement | null>(null)
const pendingLogo = ref<File | null>(null)
const pendingLogoUrl = ref<string | null>(null)

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const MAX_LOGO_SIZE = 2 * 1024 * 1024

function resetForm() {
  const s = store.settings
  Object.assign(form, s ? { ...s } : { ...PORTAL_SETTINGS_DEFAULTS })
  clearPendingLogo()
  errors.logo = undefined
}

watch(() => store.settings, resetForm)
onMounted(() => {
  store.load()
  billing.load()
})
onBeforeUnmount(clearPendingLogo)

function clearPendingLogo() {
  if (pendingLogoUrl.value) URL.revokeObjectURL(pendingLogoUrl.value)
  pendingLogo.value = null
  pendingLogoUrl.value = null
}

const logoPreview = computed(() => pendingLogoUrl.value ?? brandingUrl(form.logo_path))

function onLogoPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!/\.(png|svg)$/i.test(file.name)) {
    errors.logo = 'Please choose a PNG or SVG file.'
    return
  }
  if (file.size > MAX_LOGO_SIZE) {
    errors.logo = 'Logo must be 2MB or smaller.'
    return
  }
  errors.logo = undefined
  clearPendingLogo()
  pendingLogo.value = file
  pendingLogoUrl.value = URL.createObjectURL(file)
}

function removeLogo() {
  clearPendingLogo()
  form.logo_path = null
  errors.logo = undefined
}

/** Keeps the swatch and hex field in sync while tolerating partial typing. */
function safeColor(value: string, fallback: string): string {
  return HEX_RE.test(value) ? value : fallback
}

const previewPrimary = computed(() => safeColor(form.primary_color, PORTAL_SETTINGS_DEFAULTS.primary_color))
const previewAccent = computed(() => safeColor(form.accent_color, PORTAL_SETTINGS_DEFAULTS.accent_color))

function cancel() {
  resetForm()
  router.push({ name: 'dashboard' })
}

async function save() {
  if (locked.value) return
  saving.value = true
  try {
    const previousLogo = store.settings?.logo_path ?? null
    if (pendingLogo.value) {
      form.logo_path = await store.uploadLogo(pendingLogo.value)
    }
    await store.save({
      ...form,
      primary_color: previewPrimary.value,
      accent_color: previewAccent.value,
    })
    if (previousLogo && previousLogo !== form.logo_path) await store.deleteLogo(previousLogo)
    clearPendingLogo()
    toast.add({ severity: 'success', summary: 'Portal settings saved', life: 3000 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Save failed',
      detail:
        planLimitCode(error) === 'branding'
          ? 'Custom branding is a Pro feature — upgrade to make the portal yours.'
          : error instanceof Error
            ? error.message
            : undefined,
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="config-page">
    <AppNavbar />

    <main class="config-page__main">
      <div class="config-header">
        <div>
          <h1 class="config-header__title">Portal Configuration</h1>
          <p class="config-header__subtitle">Customize the client upload experience.</p>
        </div>
        <div class="config-header__actions">
          <Button label="Cancel" severity="secondary" outlined :disabled="saving" @click="cancel" />
          <Button label="Save Changes" severity="contrast" :loading="saving" :disabled="locked" @click="save" />
        </div>
      </div>

      <section v-if="locked" class="bdg-card config-locked">
        <span class="config-locked__icon"><i class="pi pi-lock" /></span>
        <div class="config-locked__text">
          <h2>Make the portal yours — branding is a Pro feature</h2>
          <p>
            Your logo, colours, and welcome message replace the BDG defaults on every client portal. Settings below
            are shown so you can see what's possible; upgrade to unlock them.
          </p>
        </div>
        <Button label="Upgrade to Pro" icon="pi pi-arrow-up-right" @click="router.push({ name: 'billing' })" />
      </section>

      <div class="config-layout">
        <div class="config-forms">
          <!-- Brand Identity -->
          <section class="bdg-card config-card">
            <div class="config-card__header">
              <span class="config-card__icon" style="background: #eef2ff; color: #4f46e5"><i class="pi pi-palette" /></span>
              <h2>Brand Identity</h2>
            </div>

            <div class="bdg-field">
              <label>Portal Logo</label>
              <div class="logo-row">
                <span class="logo-thumb">
                  <img v-if="logoPreview" :src="logoPreview" alt="Portal logo preview" />
                  <i v-else class="pi pi-image" />
                </span>
                <Button label="Upload Image" icon="pi pi-upload" outlined :disabled="locked" @click="logoInput?.click()" />
                <Button
                  v-if="logoPreview"
                  label="Remove"
                  text
                  severity="secondary"
                  :disabled="locked"
                  @click="removeLogo"
                />
                <span class="logo-hint">PNG or SVG, max 2MB</span>
              </div>
              <small v-if="errors.logo" class="p-error">{{ errors.logo }}</small>
              <input ref="logoInput" type="file" accept=".png,.svg" class="hidden" @change="onLogoPicked" />
            </div>

            <div class="formgrid grid">
              <div class="bdg-field col-12 md:col-6">
                <label for="primaryColor">Primary Brand Color</label>
                <div class="color-field">
                  <input type="color" :value="previewPrimary" :disabled="locked" @input="form.primary_color = ($event.target as HTMLInputElement).value" aria-label="Primary brand color" />
                  <InputText id="primaryColor" v-model="form.primary_color" maxlength="7" :disabled="locked" />
                </div>
              </div>
              <div class="bdg-field col-12 md:col-6">
                <label for="accentColor">Accent Color</label>
                <div class="color-field">
                  <input type="color" :value="previewAccent" :disabled="locked" @input="form.accent_color = ($event.target as HTMLInputElement).value" aria-label="Accent color" />
                  <InputText id="accentColor" v-model="form.accent_color" maxlength="7" :disabled="locked" />
                </div>
              </div>
            </div>
          </section>

          <!-- Welcome Content -->
          <section class="bdg-card config-card">
            <div class="config-card__header">
              <span class="config-card__icon" style="background: #eff6ff; color: var(--bdg-blue)"><i class="pi pi-file-edit" /></span>
              <h2>Welcome Content</h2>
            </div>

            <div class="bdg-field">
              <label for="headline">Headline</label>
              <InputText id="headline" v-model="form.headline" maxlength="80" :disabled="locked" />
            </div>
            <div class="bdg-field" style="margin-bottom: 0">
              <label for="welcomeMessage">Welcome Message</label>
              <Textarea id="welcomeMessage" v-model="form.welcome_message" rows="3" auto-resize maxlength="500" style="width: 100%" :disabled="locked" />
            </div>
          </section>

          <!-- Security note -->
          <section class="bdg-card config-card config-card--note">
            <div class="config-card__header" style="margin-bottom: 0.5rem">
              <span class="config-card__icon" style="background: #fef2f2; color: #dc2626"><i class="pi pi-lock" /></span>
              <h2>Security &amp; Access</h2>
            </div>
            <p class="config-note">
              Access codes and link expiry are now set <strong>per request</strong> — configure them when creating a
              request, or from the request's detail page. This keeps each client's portal isolated.
            </p>
          </section>
        </div>

        <!-- Live preview -->
        <aside class="config-preview">
          <div class="config-preview__label bdg-label-sm"><i class="pi pi-eye" /> Live Preview</div>
          <div class="preview-frame bdg-card">
            <div class="preview-frame__logo">
              <img v-if="logoPreview" :src="logoPreview" alt="" />
              <BrandLogo v-else :size="22" :wordmark="false" />
            </div>
            <h3 class="preview-frame__headline" :style="{ color: previewPrimary }">
              {{ form.headline || 'Secure Document Upload' }}
            </h3>
            <p class="preview-frame__message">{{ form.welcome_message }}</p>
            <div class="preview-frame__dropzone" :style="{ borderColor: previewAccent, color: previewAccent }">
              <i class="pi pi-cloud-upload" />
              <span class="preview-frame__drop-title">Drag &amp; Drop files here</span>
              <span class="preview-frame__drop-sub">or click to browse</span>
            </div>
            <button class="preview-frame__submit" :style="{ background: previewPrimary }" type="button" disabled>
              Submit Documents
            </button>
          </div>
        </aside>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.config-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.config-page__main {
  flex: 1;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.5rem;
}
.config-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.config-header__title {
  margin: 0;
  font-size: 1.75rem;
}
.config-header__subtitle {
  margin: 0.25rem 0 0;
  color: #64748b;
}
.config-header__actions {
  display: flex;
  gap: 0.5rem;
}
.config-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 1.5rem;
  align-items: start;
}
.config-forms {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}
.config-card {
  padding: 1.5rem;
}
.config-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.config-card__header h2 {
  margin: 0;
  font-size: 1.2rem;
}
.config-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  font-size: 1rem;
}
.logo-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.logo-thumb {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  border: 1px dashed var(--bdg-border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  overflow: hidden;
  background: #f8fafc;
  flex-shrink: 0;
}
.logo-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.logo-hint {
  color: #94a3b8;
  font-size: 0.875rem;
}
.color-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.color-field input[type='color'] {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--bdg-border);
  border-radius: 0.5rem;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}
.color-field .p-inputtext {
  flex: 1;
}
.config-note {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.55;
}
.config-locked {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  flex-wrap: wrap;
}
.config-locked__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: #dbeafe;
  color: var(--bdg-blue, #3b82f6);
  font-size: 1.1rem;
  flex-shrink: 0;
}
.config-locked__text {
  flex: 1;
  min-width: 16rem;
}
.config-locked__text h2 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
}
.config-locked__text p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
}
/* Live preview */
.config-preview {
  position: sticky;
  top: 5rem;
}
.config-preview__label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.preview-frame {
  padding: 1.5rem 1.25rem;
  border-radius: 1.5rem;
  text-align: center;
}
.preview-frame__logo {
  display: flex;
  justify-content: center;
  margin-bottom: 0.875rem;
  min-height: 1.5rem;
}
.preview-frame__logo img {
  max-height: 2rem;
  max-width: 70%;
  object-fit: contain;
}
.preview-frame__headline {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  line-height: 1.3;
}
.preview-frame__message {
  margin: 0 0 1.25rem;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.preview-frame__dropzone {
  border: 2px dashed;
  border-radius: 1rem;
  padding: 1.75rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: rgba(59, 130, 246, 0.04);
  margin-bottom: 1.25rem;
}
.preview-frame__dropzone .pi {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}
.preview-frame__drop-title {
  font-weight: 600;
  font-size: 0.875rem;
}
.preview-frame__drop-sub {
  color: #64748b;
  font-size: 0.8rem;
}
.preview-frame__submit {
  width: 100%;
  border: none;
  border-radius: 0.625rem;
  color: #ffffff;
  font-weight: 600;
  font-family: inherit;
  font-size: 0.9rem;
  padding: 0.7rem 1rem;
  opacity: 0.92;
}
.preview-frame__meta {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 1rem;
  color: #94a3b8;
  font-size: 0.78rem;
}
.preview-frame__meta .pi {
  font-size: 0.75rem;
  margin-right: 0.3rem;
}
.hidden {
  display: none;
}
@media (max-width: 900px) {
  .config-layout {
    grid-template-columns: 1fr;
  }
  .config-preview {
    position: static;
    max-width: 24rem;
  }
}
</style>

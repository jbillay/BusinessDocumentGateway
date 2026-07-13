export type RequestStatus = 'pending' | 'awaiting_client' | 'completed' | 'expired'

export interface Profile {
  id: string
  first_name: string
  last_name: string
  company: string
  email: string
  avatar_url: string | null
}

export interface UploadedFile {
  id: string
  item_id: string
  file_name: string
  file_size: number
  storage_path: string
  created_at: string
}

export interface RequestItem {
  id: string
  request_id: string
  title: string
  description: string
  category: string
  position: number
  status: 'pending' | 'uploaded'
  uploaded_files: UploadedFile[]
}

export type RequestPriority = 'normal' | 'high'

export interface DocumentRequest {
  id: string
  user_id: string
  name: string
  description: string
  priority: RequestPriority
  client_name: string
  client_company: string
  client_email: string
  client_phone: string
  expected_date: string | null
  status: RequestStatus
  portal_token: string
  created_at: string
  updated_at: string
  request_items: RequestItem[]
}

export interface ActivityEvent {
  id: number
  user_id: string
  request_id: string | null
  type: string
  message: string
  created_at: string
}

/** Draft checklist item used by the create/edit request form. */
export interface RequestItemDraft {
  id?: string
  title: string
  description: string
  category?: string
  status?: 'pending' | 'uploaded'
}

/** Portal customization settings, one row per workspace owner. */
export interface PortalSettings {
  user_id: string
  logo_path: string | null
  primary_color: string
  accent_color: string
  headline: string
  welcome_message: string
  password_protected: boolean
  /** Shared access code given to clients — not a user credential. */
  portal_pin: string | null
  /** null = links never expire. */
  link_expiry_days: number | null
}

export const PORTAL_SETTINGS_DEFAULTS = {
  logo_path: null,
  primary_color: '#0f172a',
  accent_color: '#3b82f6',
  headline: 'Secure Document Upload',
  welcome_message:
    'Please securely upload the requested documents using the portal below. All files are encrypted end-to-end.',
  password_protected: false,
  portal_pin: null,
  link_expiry_days: null,
} satisfies Omit<PortalSettings, 'user_id'>

/** Select options for link expiry; 0 means "never" (stored as null). */
export const LINK_EXPIRY_OPTIONS: { label: string; value: number }[] = [
  { label: 'Never', value: 0 },
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
]

/** Branding block returned to the public portal by get_portal_request. */
export interface PortalBranding {
  headline: string
  welcome_message: string | null
  primary_color: string
  accent_color: string
  logo_path: string | null
}

/** Shape returned by the public get_portal_request RPC. */
export interface PortalItem {
  id: string
  title: string
  description: string
  position: number
  status: 'pending' | 'uploaded'
  files: { id: string; file_name: string; file_size: number }[]
}

export interface PortalRequest {
  id: string
  name: string
  client_name: string
  status: RequestStatus
  expected_date: string | null
  company: string
  owner_name: string
  branding: PortalBranding | null
  items: PortalItem[]
}

/** Gate responses get_portal_request may return instead of the full request. */
export interface PortalGate {
  link_expired?: boolean
  pin_required?: boolean
  wrong_pin?: boolean
  branding?: PortalBranding | null
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  awaiting_client: 'Awaiting Client',
  completed: 'Completed',
  expired: 'Expired',
}

export const STATUS_SEVERITIES: Record<RequestStatus, 'warn' | 'info' | 'success' | 'danger'> = {
  pending: 'warn',
  awaiting_client: 'info',
  completed: 'success',
  expired: 'danger',
}

export function requestProgress(request: DocumentRequest): number {
  const items = request.request_items ?? []
  if (items.length === 0) return 0
  const uploaded = items.filter((i) => i.status === 'uploaded').length
  return Math.round((uploaded / items.length) * 100)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

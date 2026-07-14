export type RequestStatus = 'pending' | 'awaiting_client' | 'in_review' | 'completed' | 'expired'

/** Lifecycle of one requested document: review decisions are made by the requestor. */
export type ItemStatus = 'pending' | 'uploaded' | 'approved' | 'rejected'

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
  status: ItemStatus
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
  /** Per-request access code for the client portal; null = no PIN. */
  portal_pin: string | null
  /** null = the portal link never expires. */
  expires_at: string | null
  created_at: string
  updated_at: string
  request_items: RequestItem[]
}

export function linkExpired(request: Pick<DocumentRequest, 'expires_at'>): boolean {
  return request.expires_at !== null && Date.now() > new Date(request.expires_at).getTime()
}

export interface ActivityEvent {
  id: number
  user_id: string
  request_id: string | null
  type: string
  message: string
  created_at: string
}

/** Reusable document template owned by a user, grouped by category. */
export interface LibraryDocument {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  position: number
  created_at: string
}

/** Draft checklist item used by the create/edit request form. */
export interface RequestItemDraft {
  id?: string
  title: string
  description: string
  category?: string
  status?: ItemStatus
}

/** Portal branding settings, one row per workspace owner (security is per request). */
export interface PortalSettings {
  user_id: string
  logo_path: string | null
  primary_color: string
  accent_color: string
  headline: string
  welcome_message: string
}

export const PORTAL_SETTINGS_DEFAULTS = {
  logo_path: null,
  primary_color: '#0f172a',
  accent_color: '#3b82f6',
  headline: 'Secure Document Upload',
  welcome_message:
    'Please securely upload the requested documents using the portal below. All files are encrypted end-to-end.',
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
  status: ItemStatus
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
  /** Requestor contact, returned with link_expired so the client knows who to ask. */
  owner_name?: string
  owner_email?: string
  company?: string
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  awaiting_client: 'Awaiting Client',
  in_review: 'In Review',
  completed: 'Completed',
  expired: 'Expired',
}

export const STATUS_SEVERITIES: Record<RequestStatus, 'warn' | 'info' | 'success' | 'danger'> = {
  pending: 'warn',
  awaiting_client: 'info',
  in_review: 'info',
  completed: 'success',
  expired: 'danger',
}

/** Received = the client uploaded it (whether or not it has been approved yet). */
export function itemReceived(status: ItemStatus): boolean {
  return status === 'uploaded' || status === 'approved'
}

export function requestProgress(request: DocumentRequest): number {
  const items = request.request_items ?? []
  if (items.length === 0) return 0
  const uploaded = items.filter((i) => itemReceived(i.status)).length
  return Math.round((uploaded / items.length) * 100)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

# Copilot Instructions for bdg-ui

## Project Overview

- **bdg-ui** is a Vue 3 application using Vite for build tooling and PrimeVue for UI components. It is part of a larger BusinessDocumentGateway system.
- The main entry point is `src/main.js`, which loads `App.vue` and sets up routing via `src/router/index.js`.
- State management is handled by Pinia stores in `src/stores/`. Key stores include `requests.js`, `documents.js`, `userSession.js`, and related status stores.
- Supabase is used for backend data operations, configured in `src/lib/supabase.js`.

## Key Architectural Patterns

- **Component Structure:**
  - UI is split into views (`src/views/`) and reusable components (`src/components/`).
  - Views represent pages/steps in workflows (e.g., `NewRequest.vue` for request creation).
  - Components are often composed with PrimeVue elements and custom icons.
- **State & Data Flow:**
  - Pinia stores encapsulate business logic and API calls. Example: `requestsStore` manages request creation and fetching, including document associations.
  - Stores are imported and used in views/components for reactive state.
- **Supabase Integration:**
  - All CRUD operations for requests and documents go through Supabase client (`src/lib/supabase.js`).
  - Real-time features are scaffolded but not fully implemented (see commented code in stores).

## Developer Workflows

- **Install dependencies:**
  - `npm install`
- **Run development server:**
  - `npm run dev`
- **Build for production:**
  - `npm run build`
- **Lint code:**
  - `npm run lint`
- **Debugging:**
  - Use browser devtools and Vue Devtools for component state.
  - Pinia stores can be inspected live.

## Project-Specific Conventions

- **Request/Document Model:**
  - Requests have associated documents, managed via store methods (`createNewRequest`, `fetchUserRequestsWithDocuments`).
  - Emails are stored as arrays of objects: `client_email: [{ email: 'foo@bar.com' }]`.
- **PrimeVue Usage:**
  - UI elements use PrimeVue components (e.g., `Chip`, `Stepper`, `DataTable`).
  - Icons should be using PrimeIcons.
- **Error Handling:**
  - Errors from Supabase/API calls are logged to console and surfaced via PrimeVue Toasts.
- **Routing:**
  - Navigation is handled via Vue Router (`useRouter`).

## Integration Points

- **Supabase:**
  - All backend data is stored and retrieved via Supabase tables (`requests`, `documents`).
- **PrimeVue:**
  - UI/UX is built with PrimeVue components and forms.

## Examples

- **Adding a client email:**
  ```js
  newRequest.value.client_email.push({ email: clientEmail.value })
  ```
- **Fetching user requests:**
  ```js
  await requestsStoreSession.fetchUserRequests()
  ```
- **Creating a new request:**
  ```js
  await requestsStoreSession.createNewRequest(newRequest, requestedDocuments)
  ```

## Key Files & Directories

- `src/views/NewRequest.vue` – Main workflow for creating requests
- `src/stores/requests.js` – Request logic and Supabase integration
- `src/lib/supabase.js` – Supabase client setup
- `src/components/` – Reusable UI components
- `src/router/index.js` – Routing setup

---

If any conventions or workflows are unclear, please ask for clarification or provide feedback to improve these instructions.

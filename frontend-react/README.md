# Frontdesk Support Portal – React Frontend

This directory contains the modernized **React 18 + TypeScript** client application for the Frontdesk Support Portal, styled with **Tailwind CSS**, Lucide React, and built using **Vite**.

---

## Architecture & Integration

- **Single Page Application:** Uses `HashRouter` (`/#/...`) to integrate seamlessly with Flask's root static asset serving.
- **Direct Build Pipeline:** Running `npm run build` directly outputs the optimized production bundle (`index.html`, CSS, and JS chunks) into `../backend/web/`.
- **API Communication:** Axios client pre-configured with `withCredentials: true`, automatic CSRF token capture via `/api/auth/session`, and reactive state handling.
- **Brand Tokens:**
  - Navy: `#2B2D42`
  - Slate: `#8D99AE`
  - Light Background: `#EDF2F4`
  - Crimson Red: `#EF233C`
  - Deep Red: `#D90429`

---

## Development

### Prerequisites
- Node.js 18+ or 20+ LTS
- npm 9+

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Production Build
Compiles TypeScript, packages assets, and outputs directly into `../backend/web/`:
```bash
npm run build
```

---

## Directory Structure

- `src/api/` — Typed API integration endpoints (auth, tickets, staff, holidays, reports).
- `src/components/` — Shared UI components (Modals, Badges, Buttons, Attachment picker).
- `src/context/` — Global `AuthContext` for session lifecycle, permissions, and reactive role checks.
- `src/types/` — Shared TypeScript interface definitions for API payloads and SLA data structures.
- `src/utils/` — Indian Standard Time (IST) calendar utilities, SLA countdowns, and date formatters.
- `src/views/` — Application screens:
  - `auth/` — Sign In, Verification, Password Change.
  - `tickets/` — Ticket Queue (scopes, KPI filters, data table) & Ticket Detail View.
  - `staff/` — Staff Roster, Add Staff modal, Reassign Agent modal.
  - `holidays/` — Holiday Calendar, Declare Holiday modal.
  - `reports/` — SLA Reports, Weekly Closure Chart, Staff Leaderboard, Audit History modal.

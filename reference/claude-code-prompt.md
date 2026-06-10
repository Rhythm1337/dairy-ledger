# Claude Code Prompt — Dairy Ledger Setup

Copy everything below and paste into Claude Code (VS Code extension or terminal).

---

Set up a Next.js project called "dairy-ledger" with the following specs. I have a working React prototype that needs to be ported to a proper Next.js app.

## What this app does

A mobile-first web app to track daily dairy purchases (milk, paneer, custom products) from a local dairy vendor. Users log what they bought, the app calculates costs based on configurable rates, tracks monthly outstanding balances, records payments, and lets users verify the dairy's bill against their own records. No backend — all data stored in the browser with export/import for backups.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- localStorage for data persistence (NO backend, NO database, NO auth)
- PWA support (manifest.json + service worker for "Add to Home Screen")
- Deploy target: Vercel

## Project Setup

Initialize with:
```
npx create-next-app@latest dairy-ledger --typescript --tailwind --app --src-dir --eslint
```

## Data Model

All data is stored as a single JSON object in localStorage under the key `dairy-ledger-data`:

```typescript
interface Item {
  id: string;
  name: string;
  rate: number;          // price per unit (e.g., 70 for ₹70/L)
  unit: string;          // display unit: "L", "kg", "pcs"
  entryUnit: string;     // input unit: "L", "g", "kg", "pcs"
  divisor: number;       // conversion: 1 for L→L, 1000 for g→kg
  step: number;          // input step: 0.5 for litres, 50 for grams
  presets: number[];     // quick-fill buttons: [0.5, 1, 1.5, 2]
  emoji: string;
  enabled: boolean;
}

interface Entry {
  id: string;
  date: string;          // "YYYY-MM-DD"
  quantities: Record<string, number>;  // { milk: 1, paneer: 200 }
  createdAt: number;
}

interface Payment {
  id: string;
  month: string;         // "YYYY-MM"
  date: string;          // "YYYY-MM-DD"
  amount: number;
  note: string;
  createdAt: number;
}

interface AppData {
  items: Item[];
  entries: Entry[];
  payments: Payment[];
  quickDefaults: Record<string, number>;  // { milk: 1 }
}
```

Default items shipped with the app:
- Milk: ₹70/L, step 0.5, presets [0.5, 1, 1.5, 2], emoji 🥛
- Paneer: ₹320/kg, entered in grams (divisor 1000), step 50, presets [100, 200, 250, 500], emoji 🧀

## Pages & Features

This is a single-page app with bottom tab navigation (Home, Add, History, Settings). Use client-side routing or tab state — no need for separate Next.js routes. The whole app is a single client component since everything runs in the browser.

### Home Tab
- **Total Outstanding banner** at top — sum of all unpaid monthly balances. Prominent amber color if outstanding, green "All Clear ✓" if settled
- **Quick Add** — stepper control (−/value/+) for daily milk quantity with one-tap "Add" button. Saves to today's date
- **Repeat Yesterday** — if yesterday has entries but today doesn't, show a banner with yesterday's order and a "Same Today" button to duplicate
- **Current Month Summary** — card showing per-product totals (qty + cost), total cost, paid amount, balance due
- **Recent Entries** — last 5-6 entries with date, items, cost, and edit/duplicate/delete actions

### Add Tab
- Date picker (defaults to today)
- One input row per enabled product: label, number input, preset buttons (0.5 | 1 | 1.5 | 2 etc.)
- Live cost preview that updates as quantities change
- "Add Entry" button (or "Update Entry" when editing)

### History Tab
- Month-by-month collapsible sections, newest first
- Each month shows:
  - Per-product quantity totals
  - Total cost + paid amount + balance
  - **Verify button**: enter what the dairy charged, app shows if they overcharged/undercharged/matched with exact difference
  - **Record Payment**: inline form with amount (pre-filled with balance), date, optional note
  - Payment history list
  - Full entry list with edit/duplicate/delete per entry

### Settings Tab
- **Products & Rates**: list all items with emoji, name, rate, toggle enable/disable, edit button
- **Add Product**: bottom sheet modal with emoji picker, name, unit type selector (Litres / Kg in kg / Kg in grams / Pieces), rate input
- **Export Backup**: downloads all data as `dairy-ledger-backup-YYYY-MM-DD.json`
- **Import Backup**: file picker to upload a JSON backup, validates structure before importing
- **Data summary**: shows count of entries, payments, products
- **Reset Everything**: danger button with confirmation

## Storage Layer

Create a `lib/storage.ts` with:
```typescript
const STORAGE_KEY = 'dairy-ledger-data';

export function loadData(): AppData { ... }  // from localStorage, with defaults
export function saveData(data: AppData): void { ... }  // to localStorage
export function exportData(data: AppData): void { ... }  // trigger JSON file download
export function importData(file: File): Promise<AppData> { ... }  // parse + validate uploaded JSON
```

Important: wrap localStorage access in try/catch and check for SSR (typeof window !== 'undefined'). Use a React context or hook (`useAppData`) that loads on mount and provides a `save` function that writes to both state and localStorage.

## Design System

Use Tailwind with these custom values in tailwind.config.ts:

```
Colors:
- cream-50: #FFFDF8 (card backgrounds)
- cream-100: #FAF8F5 (input backgrounds)  
- cream-200: #F4F0E8 (page background, stat card bg)
- cream-300: #EDE8DF (secondary button bg)
- cream-400: #DDD7CC (borders)
- cream-500: #B0A898 (muted text)
- green-800: #2D4A2D (primary buttons, active states)
- green-900: #1A2E1A (header gradient start)
- amber-600: #A06020 (due amounts)
- amber-100: #FFF3E0 (due badge bg)
- red-400: #C47070 (danger actions)

Fonts (load from Google Fonts):
- Display/serif: 'Fraunces' — used for all money amounts, headings, large numbers
- Body/sans: 'DM Sans' — used for body text, labels, buttons
- Mono: 'DM Mono' — used for dates, data labels, section headers, small caps

The app should feel warm and earthy, like an Indian shopkeeper's ledger book. NOT techy or startup-y.
```

## Mobile-First Layout

- Max width 480px, centered on desktop
- Bottom tab bar with frosted glass effect (backdrop-blur, semi-transparent bg)
- Safe area padding for mobile notches: `pb-[env(safe-area-inset-bottom)]`
- All tap targets minimum 44px
- Bottom sheet modals for item editing (slide up from bottom, backdrop blur)

## PWA Setup

Add `public/manifest.json`:
```json
{
  "name": "Dairy Ledger",
  "short_name": "Dairy Ledger",
  "description": "Track dairy purchases, verify bills",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F4F0E8",
  "theme_color": "#2D4A2D",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Add next-pwa or a simple service worker for offline caching. The app should work without internet once loaded.

## Key UX Details

- All currency displayed as ₹ with Indian number formatting (en-IN locale): ₹1,234.00
- Toast notifications for all actions (added, updated, deleted, exported, imported) — auto-dismiss after 2 seconds
- Preset buttons highlight when their value matches the current input
- Date inputs default to today
- Payment amount pre-fills with the outstanding balance
- "Verify" comparison shows: ✅ "Bills match!" / ⚠️ "Overcharged by ₹X" / 🤔 "Undercharged by ₹X"
- Collapsible month sections default to expanded for current month, collapsed for others
- Duplicate button copies an entry's quantities to today's date
- Edit navigates to the Add tab with the form pre-filled

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, Google Fonts, metadata, PWA manifest link
│   ├── page.tsx            # Main app component (client component)
│   └── globals.css         # Tailwind imports + custom animations
├── components/
│   ├── DairyTracker.tsx    # Main app shell with tab navigation
│   ├── HomeTab.tsx         # Dashboard, quick add, month summary, recent entries
│   ├── AddTab.tsx          # Entry form with presets and cost preview
│   ├── HistoryTab.tsx      # Monthly sections with verify, payments, entries
│   ├── SettingsTab.tsx     # Products, export/import, reset
│   ├── ui/
│   │   ├── Badge.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Collapsible.tsx
│   │   ├── Stepper.tsx
│   │   ├── Toggle.tsx
│   │   ├── Toast.tsx
│   │   └── TabBar.tsx
│   └── ItemModal.tsx       # Add/edit product bottom sheet
├── hooks/
│   └── useAppData.ts       # Main data hook (load, save, CRUD operations)
├── lib/
│   ├── storage.ts          # localStorage read/write, export/import
│   ├── utils.ts            # fmt, fmtDate, fmtMonth, uid, entryCost helpers
│   └── types.ts            # TypeScript interfaces
└── ...
```

## What NOT to do

- No authentication, no login screen
- No backend API, no database, no Firebase, no Supabase
- No server components for the main app (it's all client-side state)
- No Redux or complex state management — React useState + context is enough
- No dark mode for v1

## Reference

I have a working prototype as a single React component (638 lines). The logic is complete and tested. Port the logic as-is, split into the component structure above, and style with Tailwind instead of inline styles. Here's the current working component for reference — preserve all the behavior exactly:

[The prototype is in the attached file dairy-tracker.jsx]

Please set up the full project, install dependencies, and make sure it runs with `npm run dev`. Structure the code cleanly but don't over-engineer — this is a simple app.

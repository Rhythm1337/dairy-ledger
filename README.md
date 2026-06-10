# 🥛 Dairy Ledger

A warm, mobile-first web app to track daily dairy purchases (milk, paneer, and any custom products) from a local vendor — and **catch billing mistakes**.

It was built to solve a real problem: a household buying milk daily from a dairy that hands over a monthly bill with no itemised breakdown. Now you log what you actually bought each day, the app totals it at your own rates, and the **Verify** feature tells you instantly whether the dairy's bill matches, overcharged, or undercharged you.

Everything runs in the browser. **No account, no backend, no database** — your data stays on your device, with one-tap backup/restore.

## Features

- **Quick Add** — one tap to log today's usual order (e.g. 1 L milk)
- **Repeat Yesterday** — duplicate yesterday's order with a single button
- **Monthly summary** — per-product quantities, totals, payments, and balance due
- **Verify the bill** — enter what the dairy charged and see ✅ match / ⚠️ overcharged / 🤔 undercharged, to the rupee
- **Record payments** — track what you've paid each month against the running balance
- **Custom products & rates** — add anything (curd, butter, ghee…) with its own unit (L / kg / grams / pieces) and price
- **Backup & restore** — export all data to a JSON file, import it back on any device
- **Installable (PWA)** — "Add to Home Screen" for an app-like experience, works offline

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS (design tokens) + ported inline styles
- `localStorage` for persistence — no server
- PWA manifest for installability

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The layout is tuned for a phone — use your browser's device toolbar (or a real phone on the same network) for the intended experience.

### Other scripts

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Deploying

This is a static-friendly Next.js app and deploys to [Vercel](https://vercel.com/) with zero configuration — import the repo and it builds with `npm run build`. It also works on any host that can serve a Next.js app.

## How data is stored

All app state lives in a single `localStorage` key (`dairy-ledger-data`) as JSON:

- `items` — products with their rate, unit, and input settings
- `entries` — daily purchases (`date` + per-product quantities)
- `payments` — recorded payments per month
- `quickDefaults` — the default quantity used by Quick Add

Because it's local-only, **export a backup** (Settings → Export) before clearing browser data or switching devices.

## Project structure

```
src/
├── app/
│   ├── layout.tsx        # metadata, fonts, PWA manifest link
│   ├── page.tsx          # renders the app
│   └── globals.css       # fonts + animations
├── components/
│   ├── DairyTracker.tsx  # main shell: state, actions, header, tab bar, modal
│   ├── HomeTab.tsx
│   ├── AddTab.tsx
│   ├── HistoryTab.tsx
│   ├── SettingsTab.tsx
│   └── ui.tsx            # Badge, IconBtn, Collapsible, Modal
└── lib/
    ├── types.ts          # TypeScript interfaces
    ├── constants.ts      # default products, unit options
    ├── utils.ts          # formatting + cost helpers
    ├── storage.ts        # localStorage load/save, export/import
    └── styles.ts         # shared inline-style tokens
```

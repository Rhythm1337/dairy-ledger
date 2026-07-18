# Dairy Ledger (Vibe)

A small app to keep track of how much milk and other dairy we buy every day.

## Why I made this

My mother faced a problem where she was overcharged on the dairy bill. She buys milk daily from a local dairy, and she was just keeping track of it on WhatsApp, which made it hard to add everything up and check if the bill was right.

So I vibe coded this. You log what you buy each day, it adds everything up at your own rates, and it tells you whether the dairy's bill matches what you actually owe. It also keeps track of payments and what's still due.

Everything is saved in your browser. No account, no login.

## The other reason

I'm also using this project to learn DevOps. It's a real app I actually use, so it's a good sandbox for testing and deploying, running it on servers, putting it in Docker, setting up pipelines, and generally messing around with that side of things.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000 (it's built for a phone screen, so use your browser's mobile view).

### With Docker

```bash
docker compose up --build
```

## Built with

Next.js, TypeScript, and the browser's localStorage for saving data. No backend.

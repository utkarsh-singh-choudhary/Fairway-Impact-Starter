# Fairway Impact — Golf Performance, Charity & Draw Platform

A subscription-driven web app combining golf score tracking, monthly draw-based rewards,
and charitable giving. Built per the Digital Heroes PRD (v1.0, March 2026).

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, Stripe (subscriptions/webhooks), Multer (proof uploads)
- **Frontend:** React (Vite), React Router, Tailwind CSS, Framer Motion, Axios

> Note: the PRD's deployment checklist mentions Supabase. This scaffold uses MongoDB (MERN)
> since that's the requested stack. If a Postgres/Supabase backend is required instead, the
> Mongoose models translate directly to Prisma/Supabase tables — happy to port on request.

## Project Structure

```
backend/
  config/db.js              MongoDB connection
  models/                   User, Subscription, Score, Charity, Donation, Draw, Winner
  middleware/                auth.js (JWT), subscriptionCheck.js (real-time gating), errorHandler.js
  controllers/               business logic per module
  routes/                    Express routers
  utils/drawEngine.js        random + algorithmic number generation, pool math, match tiering
  utils/seed.js              creates admin + demo user + sample charities
  server.js                  app entrypoint

frontend/
  src/pages/                 Home, Login, Signup, Subscribe, Dashboard, ScoreEntry, Charities, Draws, AdminDashboard
  src/context/AuthContext    global session state
  src/api/axios.js           API client with auth header + 401 redirect
  src/components/            NavBar, ProtectedRoute/AdminRoute
```

## Core Logic Implemented (per PRD)

- **Score rolling (§05):** `Score.addScoreForUser` keeps only the latest 5 scores per user,
  deletes the oldest automatically, and a unique index enforces one score per date.
- **Draw engine (§06/§07):** `utils/drawEngine.js` supports random generation and
  frequency-weighted algorithmic generation; pool math splits 40/35/25 across 5/4/3-match
  tiers; unclaimed jackpot rolls to next month.
- **Subscription lifecycle (§04):** Stripe Checkout + webhooks manage active/lapsed/cancelled
  states; `requireActiveSubscription` middleware re-validates status on every gated request.
- **Charity system (§08):** minimum 10% contribution enforced server-side, independent
  donations supported separately from gameplay-linked contributions.
- **Winner verification (§09):** proof upload → admin approve/reject → pending→paid payment
  state machine.
- **Admin dashboard (§11):** user management, draw simulate/publish, charity CRUD, winner
  verification/payout, and an overview report endpoint (§16 testing checklist maps directly
  to these flows).

## Setup

### Backend
```bash
cd backend
cp .env.example .env   # fill in MongoDB URI, JWT secret, Stripe keys
npm install
npm run seed            # creates admin@golfcharity.test / ChangeMe123!
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env    # set VITE_API_URL
npm install
npm run dev
```

### Stripe webhook (local testing)
```bash
stripe listen --forward-to localhost:5000/api/subscriptions/webhook
```

## Deployment — Vercel (single project via Services)

This uses Vercel's **Services** feature (Beta) to deploy the frontend and backend together as
one Vercel project on one domain, instead of two separate projects. The root `vercel.json`
defines both services and routes `/api/*` to the backend and everything else to the frontend.

```json
{
  "services": {
    "frontend": { "root": "frontend", "framework": "vite" },
    "backend": { "root": "backend", "framework": "express" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ],
  "crons": [
    { "path": "/api/cron/simulate-monthly-draw", "schedule": "0 6 1 * *" }
  ]
}
```

### Setup steps
1. **Enable Services on the project**: in Vercel dashboard → Project Settings → Build and
   Deployment, set Framework Preset to **Services**. Services is Beta — confirm it's enabled
   for your account/plan before relying on it. If it's unavailable, fall back to deploying
   `frontend/` and `backend/` as two separate Vercel projects (same code works either way;
   just point `VITE_API_URL` at the backend project's URL instead of a relative `/api` path).
2. Import the repo as one Vercel project (root of the monorepo, not a subfolder).
3. Add all `backend/.env.example` variables as environment variables on the project —
   including `CLOUDINARY_*` and `CRON_SECRET` (see below).
4. Set `frontend/.env` / `VITE_API_URL` to `/api` (relative) since frontend and backend now
   share one domain — no CORS config needed between them.
5. Deploy. Vercel builds each service separately and serves both from one deployment URL.

### Backend-specific notes (apply regardless of single- vs two-project deployment)
- **File uploads:** winner proof screenshots upload to Cloudinary (`config/cloudinary.js`)
  instead of local disk — Vercel's filesystem doesn't persist between invocations. Create a
  free Cloudinary account and drop the credentials into env vars.
- **Monthly draw scheduling:** the root `vercel.json` `crons` entry hits
  `/api/cron/simulate-monthly-draw` on the 1st of each month, protected by `CRON_SECRET`. It
  only *simulates* — an admin still reviews and publishes via the dashboard, matching the
  PRD's simulation-before-publish requirement.
- **MongoDB connections:** `config/db.js` caches the connection across invocations
  (`global._mongooseConn`) so you don't exhaust Atlas's connection limit under load.
- Run `npm run seed` once against the **production** MongoDB URI (from your local machine,
  pointing `.env` at the prod DB) to create the initial admin account, then change its
  password immediately.
- Update the Stripe webhook endpoint URL in the Stripe dashboard to your deployed
  `https://your-app.vercel.app/api/subscriptions/webhook`.

### Database
Use a **new** MongoDB Atlas cluster (free M0 tier is enough for evaluation). Whitelist
`0.0.0.0/0` in Atlas Network Access for Vercel's serverless IPs (they're not static), or use
Atlas's Vercel integration which handles this automatically.

> If Supabase/Postgres is a hard PRD requirement rather than MongoDB, the Mongoose models
> here translate directly to Prisma schema + Postgres tables — say the word and I'll port the
> data layer.

## What's Scaffolded vs. What Needs Finishing

This is a functional starter covering every module in the PRD end-to-end (auth → subscribe →
score entry → draw simulation/publish → winner verification → charity giving → admin
reporting). Before calling it submission-ready:

- [ ] Wire up real Stripe price IDs and test the full checkout → webhook → access flow
- [ ] Create a Cloudinary account and add credentials (winner proof uploads depend on this)
- [ ] Set `CRON_SECRET` in Vercel and confirm the monthly cron job fires (check Vercel's Cron
      Jobs dashboard tab after first deploy)
- [ ] Polish empty/loading/error states and add toast notifications
- [ ] Add email notifications (Nodemailer is installed; templates not yet written)
- [ ] Write tests for the draw engine and score rolling logic (highest-risk business logic)
- [ ] Replace placeholder Tailwind styling with a distinctive visual identity per §12

## Serverless Adaptations Made for Vercel

| Problem | Original approach | Vercel-compatible fix |
|---|---|---|
| `app.listen()` doesn't work in serverless | `server.js` ran the whole app | Split into `app.js` (exported) + `api/index.js` (serverless entry) + `server.js` (local-dev only) |
| Connections exhausted across invocations | Fresh `mongoose.connect()` per boot | `config/db.js` caches the connection on `global` |
| Ephemeral/read-only filesystem | Multer disk storage to `uploads/` | Multer memory storage → Cloudinary upload stream |
| No persistent process for scheduling | `node-cron` in-process | Vercel Cron Job → protected `/api/cron/simulate-monthly-draw` route |

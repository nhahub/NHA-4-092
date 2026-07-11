# RoadMap Builder

An AI-powered learning roadmap platform. Pick a goal, and RoadMap Builder generates
a phased roadmap; clicking any phase asks Gemini for beginner-friendly materials,
resources, difficulty, and estimated time — displayed as clean cards.

Stack: **React + Vite** (frontend), **Node.js + Express** (backend), **MongoDB Atlas**
(database), **Gemini API** (AI). Kept intentionally simple — no TypeScript, no Redux,
no Docker, no heavy backend architecture.

## Project structure

```
roadmap-builder/
├── frontend/     React + Vite app
├── api/          Express backend (also deployed as a Vercel serverless function)
├── vercel.json    Deployment config
└── .env.example   All required environment variables
```

## 1. Get your free API keys first

### MongoDB Atlas (free tier)
1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free "M0" cluster.
3. Under **Database Access**, create a database user (username + password).
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) — fine for
   development/small projects.
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/roadmap-builder?retryWrites=true&w=majority`

### Gemini API key (free tier)
1. Go to https://aistudio.google.com/app/apikey
2. Sign in and click **Create API key**.
3. Copy the key.

## 2. Local setup

```bash
# from the project root
npm run install:all
```

Create `api/.env` (copy from the root `.env.example`) and fill in your real values:

```bash
cp .env.example api/.env
```

Then edit `api/.env`:
```
MONGODB_URI=mongodb+srv://your-real-connection-string...
GEMINI_API_KEY=your-real-gemini-key
JWT_SECRET=any-long-random-string
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

Run both servers (two terminals):

```bash
# Terminal 1 - backend
cd api
npm run dev

# Terminal 2 - frontend
cd frontend
npm run dev
```

Open http://localhost:5173. Sign up for an account, go through onboarding, and your
roadmap will be created. Click any phase tab to see Gemini-generated materials.

## 3. Deploy to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, click **Add New → Project** and import the repo. Vercel will detect
   `vercel.json` automatically — no changes needed to build settings.
3. Under **Environment Variables**, add the same variables from `.env.example`:
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
   - `CLIENT_ORIGIN` (set this to your Vercel deployment URL once you have it, e.g.
     `https://your-app.vercel.app`)
4. Click **Deploy**.

That's it — no code changes are required after adding environment variables. The
frontend calls `/api/*`, which Vercel automatically routes to the Express app in
`api/server.js`.

## Notes

- MongoDB is never hard-coded to a local URI — it always reads `MONGODB_URI` from
  the environment.
- The Gemini API key is only ever used on the backend (`api/routes/ai.js`); it's
  never exposed to the browser.
- Loading, error, and empty states are built in for the AI generation flow, roadmap
  loading, and task lists — the UI shows friendly messages instead of raw errors.
- Icons are from Font Awesome only (no emoji).

## Fix pass completed

This version addresses the supplied testing notes:
- Styled phase buttons/tabs and removed browser default white button styling.
- Lesson progress is persisted immediately to the roadmap API, with phase auto-completion and next-phase unlocking.
- Lesson detail content is unique per lesson, using `lessonDetails` instead of one constant phase explanation.
- Resources are clickable links with YouTube/Web search fallbacks.
- Multiple roadmaps are supported and switchable from the Roadmap page.
- Profile avatar now opens a dropdown menu.
- Connected accounts are mock profile handles only: Add when missing, Edit when saved. No real OAuth connection is implied.
- Two-factor authentication UI was removed.
- Notifications are generated for roadmap creation, lesson completion, phase completion, and streak saving.
- Achievements now include 48 badges.
- Roadmap has a vertical tree/timeline visual with lock, progress, and completion states.
- Onboarding includes 60+ technical and non-technical tracks, paginated 6 per page.
- Each generated phase is normalized to at least 10 lessons.
- Final lesson button says “Start next phase” or “Finish roadmap.”
- Phases are sequential and locked until the previous phase is complete.
- Roadmaps now generate 8–10 phases.
- Focus mode is linked in the sidebar and tracks local completed sessions.
- Progress dashboard uses lessons, phases, streak, and focus-session data.
- Profile settings include a Skills from Progress section.
- AI generation prompts were upgraded; there is also a local fallback so the UI still works without a Gemini key.

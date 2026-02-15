# Niha

Capacity-aware daily planning app for people who experience fluctuating cognitive, emotional, or physical capacity. Built with Expo (React Native) and Fastify.

Check in with how you're doing today, get AI-generated adaptive plans (A/B/C options), and discover patterns in your data over time.

## Features

- **Daily check-in** with tap-based sliders for energy, focus, mood, sleep quality, and sensory load
- **AI-generated plans** (A/B/C options) with adaptive tone based on your communication preferences
- **Dashboard** with trend charts and pattern insights ("Your energy dips on Mondays")
- **History** with date filtering and expandable plan details
- **Onboarding flow** for neurodivergence type, cycle tracking, work pattern, and communication style
- **Profile & settings** with tone presets, field visibility toggles, data export, and account deletion
- **Privacy-first** design with clear non-medical disclaimers

## Tech stack

| Layer | Tech |
|-------|------|
| Mobile app | Expo SDK 54, React Native 0.81, Expo Router |
| API | Fastify 5, Prisma, SQLite |
| AI | Ollama (local), OpenAI, or Anthropic (configurable) |
| Auth | JWT with dev-login fallback, Google/Apple OAuth ready |

## Prerequisites

- **Node.js** 20+ and npm
- **Expo Go** app on your iPhone (from App Store) for mobile testing
- *(Optional)* [Ollama](https://ollama.com/) for local AI, or an OpenAI/Anthropic API key

## Quick start

```bash
# 1. Clone the repo
git clone https://github.com/damienjerry/Niha.git
cd Niha

# 2. Install dependencies
npm install

# 3. Set up environment files
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env

# 4. Edit apps/api/.env — at minimum set:
#    JWT_SECRET=any-string-at-least-32-characters-long
#    AI_PROVIDER=NONE   (if you don't have Ollama/OpenAI/Anthropic)

# 5. Initialize the database
cd apps/api && npx prisma db push && cd ../..

# 6. (Optional) Seed sample data
npm run seed

# 7. Start everything
npm run dev
```

This starts:
- API on `http://localhost:4001`
- Expo dev server on port 8082

## Testing on your iPhone

1. Make sure your iPhone and Mac are on the **same Wi-Fi network** (VPN off)
2. In a separate terminal, start the mobile app with LAN mode:
   ```bash
   npm run dev:mobile:lan
   ```
3. Open **Expo Go** on your iPhone and scan the QR code from the terminal
4. The app will load — sign in using the dev login (any email works)

## Testing in a browser

```bash
npm run dev
```
Then open `http://localhost:8082` in your browser. The web version uses the same codebase.

## Testing the API directly

```bash
# Health check
curl http://localhost:4001/health

# Dev login (get a JWT token)
curl -X POST http://localhost:4001/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@niha.dev"}'

# Use the token from above for authenticated requests:
TOKEN="paste-token-here"

# Get profile
curl http://localhost:4001/profile -H "Authorization: Bearer $TOKEN"

# Submit a check-in
curl -X POST http://localhost:4001/checkins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"energy": 6, "focus": 4, "mood": 7, "sleepQuality": 8, "notes": "Feeling okay today"}'

# View check-in history
curl "http://localhost:4001/checkins?limit=10" -H "Authorization: Bearer $TOKEN"

# Get insights (patterns appear after 5+ check-ins)
curl http://localhost:4001/insights -H "Authorization: Bearer $TOKEN"

# Export all your data
curl -X POST http://localhost:4001/account/export -H "Authorization: Bearer $TOKEN"
```

## App walkthrough

1. **Login** — Enter any email (dev mode). First-time users go to onboarding.
2. **Onboarding** — 5 optional steps: name/pronouns, neurodivergence types, cycle tracking, work pattern, communication style. All skippable.
3. **Home tab** — Check in with how you're doing. Tap the numbers (1-10) for each metric, optionally add notes, then generate a plan. You'll get 3 options (A/B/C) tailored to your capacity level and tone preferences.
4. **Dashboard tab** — See weekly trend charts and pattern insights generated from your check-in history. Insights become available after ~5 entries.
5. **History tab** — Browse past check-ins with date filtering (7/14/30 days). Tap any entry to expand its full plan.
6. **Profile tab** — Edit your profile, adjust communication style, toggle which check-in fields to show, export data, or delete your account.

## AI provider setup

Set `AI_PROVIDER` in `apps/api/.env`:

| Value | Setup |
|-------|-------|
| `NONE` | Rules-based fallback (no AI needed) |
| `OLLAMA` | Install [Ollama](https://ollama.com/), run `ollama pull llama3.1:8b`, start Ollama |
| `OPENAI` | Set `OPENAI_API_KEY` in `.env` |
| `ANTHROPIC` | Set `ANTHROPIC_API_KEY` in `.env` |

## Project structure

```
Niha/
  apps/
    api/                    # Fastify API server
      src/
        routes/             # Auth, check-ins, profile, insights, account
        ai/                 # AI provider adapters + prompt generation
        utils/              # Zod validators
      prisma/
        schema.prisma       # Database schema
    mobile/                 # Expo React Native app
      app/
        (auth)/             # Login + onboarding screens
        (tabs)/             # Main app tabs (home, dashboard, history, profile)
      src/
        api/                # API client
        auth/               # Auth context + token storage
        components/         # Reusable UI components
        theme/              # Design tokens
```

## Two-terminal setup

If `npm run dev` doesn't work well (e.g., output overlap), run in two terminals:

```bash
# Terminal 1 — API
npm run dev:api

# Terminal 2 — Mobile (LAN mode for iPhone testing)
npm run dev:mobile:lan
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `No workspaces found` | Make sure you're in the repo root (`cd Niha`) |
| `EADDRINUSE` on port 4001 | `lsof -ti :4001 \| xargs kill -9` |
| iPhone can't connect | Same Wi-Fi, VPN off, use `npm run dev:mobile:lan` |
| `PlatformConstants could not be found` | `rm -rf apps/mobile/.expo && npm install`, restart Expo Go |
| Prisma engine download hangs | Check network; first run downloads binaries from `binaries.prisma.sh` |
| No AI suggestions generated | Check `AI_PROVIDER` in `.env`. Use `NONE` for rules-based fallback |

## Notes

- All guidance is **non-medical** and must not be treated as diagnosis or treatment advice
- Consumer ChatGPT Plus / Claude Max subscriptions are not API credentials — use provider API keys or local Ollama
- Data is stored in a local SQLite file (`apps/api/dev.db`) — no external database needed

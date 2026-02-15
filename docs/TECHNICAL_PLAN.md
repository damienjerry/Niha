## Technical Plan

### Chosen Stack
- Frontend: Expo React Native + Expo Router (single codebase for iOS + mobile web)
- Backend: Fastify (TypeScript)
- Database: SQLite with Prisma (prototype speed)
- Auth: JWT session with Google/Apple token exchange + dev fallback
- AI: provider adapter for Ollama, OpenAI, Anthropic

### Why this stack
Fastest path to a consistent iOS + browser experience with server-side persistence and a pluggable AI layer.

### Architecture Diagram
```text
Expo App (iOS + Web)
  -> Fastify API (JWT auth, check-ins, suggestions)
      -> Prisma ORM -> SQLite
      -> AI Adapter -> Ollama OR OpenAI OR Anthropic
```

### Data Model
- `User`: identity record by email/provider
- `CheckIn`: optional metrics + notes + timestamp
- `Suggestion`: AI output linked 1:1 with check-in

### API Routes
- `POST /auth/dev-login`
- `POST /auth/google`
- `POST /auth/apple`
- `GET /auth/me`
- `POST /checkins`
- `GET /checkins?limit=n`
- `GET /health`

### Auth Approach
- OAuth token obtained on client.
- Token validated server-side.
- Server issues JWT for API session.
- Dev fallback available for local unblocked prototype work.

### Integration Points
- Google ID token verification endpoint
- Apple token verification via Apple JWKS
- Ollama local inference endpoint
- OpenAI and Anthropic API endpoints

### Risks + Mitigations
- OAuth credentials unavailable: keep dev fallback and env-based provider toggles.
- Sparse user input: explicit low-coverage quality notice and history-aware generation.
- Medical misinterpretation: hardcoded non-medical notice in prompts and UI.

### Milestones
1. Scaffold monorepo and persistence layer.
2. Implement auth + session + check-in API.
3. Add AI provider abstraction and suggestion generation.
4. Build iOS/web UI flows.
5. Validate local run path and publish docs.

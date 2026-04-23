# Niha — Capacity-aware daily planning

<!-- ───── Orchestrator ──────────────────────────────────────────
  Scope: personal · Status: prototype (mostly design phase) · Criticality: low
  Repo: github.com/damienjerry/Niha (public)
  Stack: node api (fastify) + expo mobile (react-native) monorepo
  Workspaces: @niha/api, @niha/mobile
  Deploy: none yet
  Secrets: op://Personal/niha
  Tracked in: ~/Code/orchestrator/inventory/businesses.yaml (id: niha)
─────────────────────────────────────────────────────────────── -->

## What it is

Planning app for people with fluctuating cognitive/emotional/physical capacity. Daily check-in (energy, focus, mood, sleep, sensory), AI-generated A/B/C plan options, pattern insights.

## Dev

```sh
npm run dev           # api + mobile concurrently
npm run dev:api       # api only
npm run dev:mobile    # expo only
npm run dev:mobile:lan  # expo on LAN IP
```

Env defaults: `API_PORT=4001`, `EXPO_PORT=8082`.

## Stack

- API: `@niha/api` — node + fastify + TODO(db)
- Mobile: `@niha/mobile` — expo 54 / react-native 0.81.5 / react 19.1
- Overrides pin react/react-native versions across workspace

## Scope reminder

Personal project. AI adaptive content. Non-medical — keep disclaimers visible.

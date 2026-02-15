## PRD

### Problem
People experience fluctuating cognitive/emotional/physical capacity and need daily planning support that adapts to that fluctuation without medical framing.

### Users & Roles
- Primary user: individual self-managing day-to-day capacity (starting with neurodivergent adults).
- No admin role in V1 prototype.

### Core Workflows
1. User signs in (Google/Apple or developer fallback for local testing).
2. User submits optional check-in fields (none required).
3. System combines current and historical data and generates an adaptive plan.
4. User reviews historical check-ins and prior suggestions.

### V1 Scope (Must-have)
- iOS-native capable app with mobile browser support via shared codebase.
- Identity-based auth and server-side persistent records.
- AI-generated adaptive suggestions with explicit uncertainty handling for sparse data.
- Non-medical legal language throughout UX and outputs.

### Out of Scope
- Clinical features, diagnostics, treatment recommendations.
- Billing/subscriptions.
- Push notifications and wearables integrations.
- Production-grade compliance program.

### Success Criteria
- User can sign in, submit a check-in with optional fields, and receive a generated plan.
- User can view historical entries and suggestions.
- App communicates non-medical positioning and data-quality caveats clearly.

## Architecture Notes
- Client is a single Expo codebase for iOS-native and mobile web.
- API stores identity-linked records server-side using Prisma + SQLite.
- AI generation is provider-agnostic and selected at runtime via `AI_PROVIDER`.
- OAuth is supported through token exchange endpoints; local dev flow remains available when OAuth credentials are absent.
- All generated guidance is explicitly non-medical.

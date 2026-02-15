## Lightweight Design System

### Typography
- Primary text: bold geometric style via React Native weight hierarchy (`700/800`) for headings.
- Body text: high-contrast readable text with muted secondary copy.

### Spacing
- Base scale: 6, 10, 16, 24, 32
- Card-first layout with vertical rhythm for small mobile screens.

### Components
- `Card`
- `NumericInputField`
- Primary action button
- Secondary outline action button
- Warning notice card

### Color Direction
- Soft botanical background (`#f2f6f1`)
- Deep evergreen text (`#133025`)
- Clear action green (`#1e8f67`)
- Warm warning tone (`#7f4b24`)

## Wireframes (Text)

### 1) Sign In
- Header: product promise + non-medical disclaimer
- Actions: Continue with Google, Continue with Apple (iOS), Dev login fallback
- Error area: auth failures

### 2) Check-In + Plan
- Optional fields: energy/focus/mood/sleep/sensory + cycle + notes
- Helper copy: sparse data lowers quality, historical data may be used
- Action: Generate adaptive plan
- Result card: summary + Plan A/B/C + caution + non-medical notice

### 3) History
- Reverse-chronological cards of check-ins
- Snapshot of suggestion confidence + plan summary
- Quick return action to check-in screen

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun dev              # Start Next.js dev server (port 3000)
bun run build        # Production build

# Testing
npx jest                           # Run all tests
npx jest --watch                   # Watch mode
npx jest path/to/test.test.ts      # Run single test file
npx jest --coverage                # Coverage report

# Linting
npx eslint src/        # Lint (do NOT use `npx next lint` — it fails with "Invalid project directory")

# Dependencies
bun install            # Install packages (primary package manager)
```

## Architecture

**TDEE (Total Daily Energy Expenditure) Tracker** — a Next.js 16 App Router app with Firebase backend for tracking weight and calorie intake to calculate adaptive TDEE.

### Data Flow

- **Auth**: Firebase Auth (email/password) via `AuthProvider` context → `useAuth()` hook
- **Database**: Firestore with two collections:
  - `users/{userId}` — settings doc (goal, units, body stats)
  - `entries/{userId}_{YYYY-MM-DD}` — daily weight/calorie entries
- **CRUD**: All Firestore operations in `src/lib/firebase/firestore.ts`, called from client components
- **Providers**: `AuthProvider` → `ThemeProvider` → `ToastProvider` (stacked in root layout)

### TDEE Calculation (Two-Phase Strategy)

1. **Setup phase (first 14 days)**: Mifflin-St Jeor formula using body stats (sex, age, height, activity level) because adaptive calculation is unreliable during initial water/glycogen changes
2. **After setup**: Adaptive nSuns method — linear regression on weight trend, TDEE = avgCalories - (dailyWeightChange × 3500). Requires minimum 7 entries, uses 21-day analysis window, bounded to 800–6000 kcal

### Key Files

- `src/lib/tdee-calculations.ts` — Core TDEE algorithms (adaptive + formula-based)
- `src/lib/tdee-calculator.ts` — High-level stats aggregation (`calculateStats`)
- `src/lib/math-utils.ts` — Linear regression, EMA (smoothing factor 0.1), trend calculations
- `src/lib/firebase/firestore.ts` — All Firestore CRUD operations and TypeScript types
- `src/lib/constants.ts` — All magic numbers and configuration values

### Styling

- CSS Modules per component with CSS variables for theming (`--primary`, `--card-bg`, `--border`, `--text-secondary`, `--radius-lg`, etc.)
- Light/dark theme via `[data-theme]` attribute
- Font: Poppins (Google Fonts)
- Path alias: `@/*` → `./src/*`

### Testing

- Jest 30 + ts-jest, test environment: `node`
- Tests cover lib utilities only (not React components): `src/lib/__tests__/`
- Coverage excludes Firebase (`src/lib/firebase/`)
- Known: TypeScript errors in test helpers around optional `createdAt` field

### Routes

- `/` — Landing page
- `/login`, `/signup` — Auth pages
- `/dashboard` — Main dashboard (protected, redirects to settings if unconfigured)
- `/dashboard/settings` — User setup and goal configuration
- `/about`, `/tips`, `/how-it-works` — Info pages

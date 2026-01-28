# StrikingWizard - App Report

## Tech Stack

| Layer            | Choice                        | Why                                                        |
| ---------------- | ----------------------------- | ---------------------------------------------------------- |
| Framework        | Expo SDK 54                   | Fastest path to iOS + Android from a single codebase       |
| UI               | React Native 0.81             | Expo's default; New Architecture enabled                   |
| Language         | TypeScript 5.9 (strict mode)  | Type safety from day one                                   |
| Linting          | ESLint + Prettier             | Consistent code style, auto-fixable                        |
| Testing          | Jest (via jest-expo) + RNTL   | Expo-aware test runner + idiomatic component testing        |
| Package Manager  | pnpm 10                       | Fast, disk-efficient, workspace support                    |
| CI               | GitHub Actions                | Runs lint, typecheck, and test on every push/PR to main    |

## How to Run

### iOS (macOS only)

```bash
pnpm install
pnpm ios
```

Requires Xcode and an iOS Simulator.

### Android

```bash
pnpm install
pnpm android
```

Requires Android Studio and a configured emulator.

### Expo Go (physical device)

```bash
pnpm start
```

Scan the QR code with the Expo Go app.

## Repository Layout

```
striking-wizard-2/
  .github/workflows/ci.yml   # GitHub Actions CI pipeline
  app/                        # Expo + React Native application
    App.tsx                   #   Root component
    app.json                  #   Expo config (name, bundle IDs, splash, icons)
    index.ts                  #   Entry point
    tsconfig.json             #   TypeScript configuration
    eslint.config.mjs         #   ESLint flat config
    .prettierrc               #   Prettier settings
    __tests__/                #   Test files
    assets/                   #   Icons, splash images
  docs/                       # Documentation
    AppReport.md              #   This file
    PRD.md                    #   Product Requirements (draft)
  package.json                # Root workspace package.json (proxies scripts)
  pnpm-workspace.yaml         # pnpm workspace config
  README.md                   # Setup & run instructions
```

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and PR to `main`:

1. **Install** - `pnpm install --frozen-lockfile`
2. **Lint** - `pnpm lint` (ESLint)
3. **Typecheck** - `pnpm typecheck` (tsc --noEmit)
4. **Test** - `pnpm test` (Jest)

## App Identity

| Platform | Bundle / Package ID         |
| -------- | --------------------------- |
| iOS      | `com.strikingwizard.app`    |
| Android  | `com.strikingwizard.app`    |

These are placeholders and should be updated before the first production build.

## Decisions & Notes

- **Expo over bare React Native CLI**: Reduces native toolchain setup; prebuild (`expo prebuild`) is available when custom native modules are needed.
- **pnpm workspace**: The repo is structured as a monorepo (`app/` + `docs/`) so additional packages (e.g., shared utils, a backend) can be added later without restructuring.
- **New Architecture enabled**: `newArchEnabled: true` in `app.json` opts into React Native's new rendering pipeline (Fabric + TurboModules).
- **No navigation library yet**: Will be added when the first multi-screen feature is planned.
- **No state management yet**: Will be decided based on app complexity (likely Zustand or React Context).

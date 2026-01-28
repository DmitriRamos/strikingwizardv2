# StrikingWizard

Cross-platform mobile app built with Expo, React Native, and TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (installed via npx, no global install needed)
- iOS: Xcode + iOS Simulator (macOS only)
- Android: Android Studio + an Android emulator

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the Expo dev server
pnpm start

# Run on iOS Simulator
pnpm ios

# Run on Android Emulator
pnpm android
```

## Scripts

All scripts can be run from the repo root (they proxy into `app/`):

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `pnpm start`      | Start Expo dev server                |
| `pnpm ios`        | Launch on iOS Simulator              |
| `pnpm android`    | Launch on Android Emulator           |
| `pnpm lint`       | Run ESLint                           |
| `pnpm lint:fix`   | Run ESLint with auto-fix             |
| `pnpm format`     | Format code with Prettier            |
| `pnpm format:check` | Check formatting without changing  |
| `pnpm typecheck`  | Run TypeScript type checking         |
| `pnpm test`       | Run Jest tests                       |
| `pnpm test:watch` | Run Jest in watch mode               |

## Project Structure

```
striking-wizard-2/
  app/                  # Expo + React Native app
    App.tsx             # Root component
    app.json            # Expo config (name, bundle IDs, etc.)
    __tests__/          # Test files
    assets/             # Static assets (icons, splash)
  docs/                 # Documentation
  .github/workflows/    # CI configuration
```

## Tech Stack

- **Framework:** Expo SDK 54 + React Native 0.81
- **Language:** TypeScript 5.9
- **Linting:** ESLint + Prettier
- **Testing:** Jest + React Native Testing Library
- **Package Manager:** pnpm
- **CI:** GitHub Actions

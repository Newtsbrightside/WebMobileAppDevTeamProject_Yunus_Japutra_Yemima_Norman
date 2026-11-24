# mobile-app/AGENTS.md — read the root AGENTS.md first

This folder is the Finishline **client** app: Expo SDK 58, Expo Router, JavaScript only.
Everything in the root `AGENTS.md` applies here too. Extra rules for this folder:

## Expo changes every SDK — check the docs, not your memory

1. Read the `expo` version in `package.json` (SDK 58).
2. Use the versioned docs: https://docs.expo.dev/versions/v58.0.0/
3. Index of all docs, with corrections to common AI mistakes: https://docs.expo.dev/llms.txt

Things that changed and an agent will likely get wrong:
- Bottom tabs: `import { Tabs } from 'expo-router/js-tabs'` (the old `expo-router` export is deprecated).
- `useHeaderHeight` comes from `expo-router/react-navigation`.
- Android apps are edge-to-edge: the window no longer shrinks for the keyboard.
  Forms use `<KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={headerHeight}>` on BOTH platforms.
- `expo-secure-store` has no web version; `lib/session.js` falls back to localStorage on web.

## Rules

- JavaScript only. No TypeScript, no `.tsx`.
- Routes live in `app/` (not `src/app/`). Non-route code goes in `lib/` and `components/`.
- The API address comes ONLY from `process.env.EXPO_PUBLIC_API_URL` (read once in `lib/api.js`).
  Never write an address in a screen. Never put a secret in `EXPO_PUBLIC_` variables.
- Every request goes through `apiFetch()` in `lib/api.js`. A 401 becomes `AuthError`;
  the screen calls `useSessionExpired()` (logout + login screen + come back).
- The token is stored with `expo-secure-store` (`lib/session.js`). Plain settings may use AsyncStorage.
- Install packages with `npx expo install <package>` (picks SDK-compatible versions), never `npm install`.
- Only libraries that run in **Expo Go** — the team tests with Expo Go on an iPhone and an Android phone.
- Colours, spacing and the 48-point touch target come from `theme.js`. No raw numbers for spacing.
- Main buttons use `PrimaryButton` with `busy` while a request runs (no double orders).
- Do not create or edit `ios/` or `android/` folders.

## Commands

```bash
npx expo start            # scan the QR code with Expo Go (iPhone camera / Android Expo Go app)
npx expo start --web      # quick check in a browser (SecureStore falls back to localStorage)
npx expo-doctor           # dependency and config check
npx expo export --platform ios --platform android   # does every screen bundle?
```

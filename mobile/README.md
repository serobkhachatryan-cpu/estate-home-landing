# Oriel for iPhone

This is Oriel's native Expo / React Native iPhone client. It is not a webview.

## Local run

1. Copy `.env.example` to `.env` and point `EXPO_PUBLIC_ORIEL_API_URL` at the deployed Oriel API.
2. From this directory, run `npm run ios` after installing Xcode, or use `npm start` and Expo Go for interface work.
3. W3DS and Home Assistant use the `oriel` app URL scheme, so complete authentication testing needs an iOS development build on a physical iPhone.

## Before TestFlight

- Register a final Apple bundle identifier to replace provisional `com.oriel.homeops` in `app.json`.
- Supply Oriel's final 1024×1024 App Store icon and required iPhone screenshots.
- Set `ORIEL_PUBLIC_BASE_URL` and `HOME_ASSISTANT_TOKEN_ENCRYPTION_KEY` in the production API deployment.
- Test W3DS Wallet and Home Assistant OAuth on physical iPhones, including return-to-app behavior.
- Enrol in the Apple Developer Program, make an archive / TestFlight build, then complete App Store privacy information and review notes.

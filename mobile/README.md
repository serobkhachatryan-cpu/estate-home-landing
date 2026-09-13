# Oriel for iPhone

This is Oriel's native Expo / React Native iPhone client. It is not a webview.

## Local run

1. Copy `.env.example` to `.env` and point `EXPO_PUBLIC_ORIEL_API_URL` at the deployed Oriel API.
2. From this directory, run `npm run ios` after installing Xcode, or use `npm start` and Expo Go for interface work.
3. W3DS and Home Assistant use the `oriel` app URL scheme, so complete authentication testing needs an iOS development build on a physical iPhone.

## TestFlight release

The project has an iPhone-only `1.0.0` release configuration and a production
`1024×1024` icon. Its selected bundle identifier is
`com.serobkhachatryan.oriel`; register this exact identifier in the Apple
Developer account before creating the first build.

1. Sign in to Expo with `npx eas-cli@latest login`.
2. Enrol in the Apple Developer Program and sign in when EAS asks for Apple
   credentials.
3. Run `npx eas-cli@latest build --platform ios --profile production --auto-submit`.
   This creates an App Store build and sends it to TestFlight.
4. Test W3DS Wallet and Home Assistant OAuth on physical iPhones, including
   return-to-app behavior, before submitting the build for App Review.
5. Complete App Store Connect privacy information, review notes, and iPhone
   screenshots, then submit the chosen TestFlight build for review.

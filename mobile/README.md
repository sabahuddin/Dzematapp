# DžematApp - React Native Mobile (iOS & Android)

Nativna mobilna aplikacija za upravljanje džemtskom zajednicom, razvijena sa React Native i Expo.

## 🚀 Karakteristike

- ✅ Nativna iOS i Android aplikacija
- ✅ Login/Autentifikacija
- ✅ Dashboard sa statistikom
- ✅ Moduli pregled
- ✅ Profil upravljanja
- ✅ API integracija sa backend serverom

## 📋 Preduslov

- Node.js 18+ i npm
- iOS: Xcode (za development i deployment)
- Android: Android Studio (za development)
- Expo CLI: `npm install -g eas-cli`

## 🔧 Instalacija & Development

1. **Instaliraj dependencije:**
   ```bash
   npm install
   ```

2. **Kreiraj `.env` fajl:**
   ```bash
   cp .env.example .env
   ```

3. **Pokreni sa Expo Go (brže):**
   ```bash
   npm start
   ```
   Scan QR kod sa Expo Go aplikacijom na telefonu.

## 📱 Build za iOS

### Xcode Development

1. **Instaliraj Xcode dependencies:**
   ```bash
   npx pod-install
   ```

2. **Generiši iOS projekat:**
   ```bash
   eas build --platform ios --local
   ```

3. **Otvori u Xcode:**
   ```bash
   open ios/DzematApp.xcworkspace
   ```

4. **Configure sigiranje:**
   - Odaberi development team
   - Bundle identifier: `com.dzemat.app`
   - Configure certificate

5. **Run na simulatoru:**
   ```bash
   npm run ios
   ```

### App Store Distribution

1. **Archive build:**
   - Product → Archive (Cmd+Shift+K)
   - Odaberi Archive

2. **Distribute:**
   - Window → Organizer
   - Select Archive → Distribute App
   - Configure App Store Connect details
   - Upload

## 🤖 Build za Android

1. **Generiši APK/AAB:**
   ```bash
   eas build --platform android --local
   ```

2. **Android Studio emulator:**
   ```bash
   npm run android
   ```

3. **Play Store Distribution:**
   - Upload `.aab` fajl u Play Console
   - Configure store listing

## 📁 Struktura Projekta

```
mobile/
├── app/
│   ├── _layout.tsx              # Root layout sa auth
│   ├── login.tsx                # Login screen
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigator
│       ├── index.tsx            # Dashboard
│       ├── modules.tsx          # Moduli
│       └── profile.tsx          # Profil
├── services/
│   ├── api.ts                   # API client
│   └── auth.ts                  # Auth logika
├── types/
│   └── index.ts                 # TypeScript types
├── app.json                     # Expo config
├── eas.json                     # EAS build config
└── tsconfig.json                # TypeScript config
```

## 🔗 API Endpoints

- `POST /api/auth/login` - Prijava
- `GET /api/auth/session` - Sesija
- `POST /api/auth/logout` - Odjava
- `GET /api/statistics` - Dashboard

## 📚 Learn More

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [EAS Documentation](https://docs.expo.dev/eas/)

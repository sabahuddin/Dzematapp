# React Native Mobile App Setup - DžematApp

## Overview

Kreiran je **React Native sa Expo** projekat za iOS i Android distribuciju DžematApp-a.

Lokacija: `/mobile` direktorijum u projektu.

## 📂 Šta je Kreirano

### Core Services
- **`mobile/services/api.ts`** - Axios API client sa autentifikacijom
- **`mobile/services/auth.ts`** - Login, logout, session management

### Screens
- **`mobile/app/login.tsx`** - Login screen sa validacijom
- **`mobile/app/_layout.tsx`** - Root navigation sa auth check
- **`mobile/app/(tabs)/index.tsx`** - Dashboard sa statistikom
- **`mobile/app/(tabs)/modules.tsx`** - Moduli pregled
- **`mobile/app/(tabs)/profile.tsx`** - Profil upravljanja

### Configuration
- **`mobile/app.json`** - Expo konfiguracija (iOS bundle ID, Android package)
- **`mobile/eas.json`** - EAS build konfiguracija
- **`mobile/.env.example`** - Environment template
- **`mobile/BUILD_INSTRUCTIONS.md`** - Detaljan build guide

## 🚀 Brz Start

```bash
# 1. Preuzmi mobile direktorijum
cd mobile

# 2. Instaliraj dependencies
npm install

# 3. Kopaj .env
cp .env.example .env

# 4. Pokreni sa Expo Go
npm start
```

## 📱 Za iOS

### Development
```bash
npm run ios
```

### Build za App Store
1. `open ios/DzematApp.xcworkspace` u Xcode
2. Configure team i signing
3. Product → Archive
4. Distribute App → App Store Connect

Detalji: [BUILD_INSTRUCTIONS.md](./mobile/BUILD_INSTRUCTIONS.md)

## 🤖 Za Android

### Development
```bash
npm run android
```

### Build za Play Store
1. Kreiraj keystore: `keytool -genkey -v ...`
2. `./gradlew bundleRelease` u `android/`
3. Upload `.aab` u Play Console

Detalji: [BUILD_INSTRUCTIONS.md](./mobile/BUILD_INSTRUCTIONS.md)

## 🔌 API Integration

Aplikacija koristi backend na `http://localhost:5000` (puede biti customizovano u `.env`).

### Endpoints korišćeni
- `POST /api/auth/login` - User prijava
- `GET /api/auth/session` - Validate session
- `POST /api/auth/logout` - Odjava
- `GET /api/statistics` - Dashboard stats

### Authentication Flow
1. User unese username/password
2. POST `/api/auth/login` vraća token
3. Token se čuva u `AsyncStorage`
4. ApiClient automatski dodaje token svim zahtevima
5. Pri logout, token se briše

## 📦 Struktura Direktorijuma

```
mobile/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout
│   ├── login.tsx                # Login
│   └── (tabs)/
│       ├── _layout.tsx          # Tabs navigator
│       ├── index.tsx            # Home/Dashboard
│       ├── modules.tsx          # Modules
│       └── profile.tsx          # Profile
├── services/                     # API & Auth
│   ├── api.ts                   # HTTP client
│   └── auth.ts                  # Auth service
├── types/                        # TypeScript types
│   └── index.ts
├── app.json                      # Expo config
├── eas.json                      # Build config
├── package.json                  # Dependencies
└── BUILD_INSTRUCTIONS.md         # Build guide
```

## 🎯 Next Steps

1. **Develop Locally:**
   - Pokretanje sa `npm start`
   - Scan QR sa Expo Go

2. **Test sa Device:**
   - iOS: Run na simulator ili device
   - Android: Connect device, run

3. **Prepare for Release:**
   - Update version u `app.json` i native configs
   - Test sve flows
   - Sign correctly za App Store/Play Store

4. **Publish:**
   - iOS: Archive u Xcode → Submit to App Store
   - Android: Generate signed APK/AAB → Upload to Play Store

## ⚙️ Configuration

### Promeniti Backend URL
U `.env` fajlu:
```
API_BASE_URL=https://your-backend.com
```

### Promeniti App Identifiers

**iOS (app.json & Xcode):**
```json
"ios": {
  "bundleIdentifier": "com.your.bundle"
}
```

**Android (app.json & android/app/build.gradle):**
```json
"android": {
  "package": "com.your.package"
}
```

## 📝 Notes

- App koristi **Expo Router** za file-based routing
- Autentifikacija je **session-based** (AsyncStorage + API token)
- UI je napravio sa React Native primitives (bez custom UI library)
- Design je responsive za mobile devices

## 🆘 Support

Za greške ili pitanja, proverite:
1. [BUILD_INSTRUCTIONS.md](./mobile/BUILD_INSTRUCTIONS.md)
2. [Expo Docs](https://docs.expo.dev)
3. [React Native Docs](https://reactnative.dev)

---

**Status:** ✅ Ready for Development & Testing
**Created:** 2025-11-25
**Technology:** React Native + Expo

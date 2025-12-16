# DžematApp Mobile - Upute za pokretanje

## BRZI START (Expo Go testiranje)

### Zahtjevi
- Node.js 18+ 
- Expo Go aplikacija na telefonu (iOS/Android)
- MacBook i iPhone moraju biti na istoj WiFi mreži

### Instalacija i pokretanje

```bash
# 1. Raspakiraj arhivu
tar -xzf mobile-complete.tar.gz
cd mobile

# 2. Obriši stari node_modules ako postoji
rm -rf node_modules package-lock.json

# 3. Instaliraj dependencies
npm install

# 4. Pokreni Expo (sa čistim cacheom)
npx expo start -c
```

### Ako se pojavi pitanje za login
Izaberi **"Proceed anonymously"** (strelica dolje + Enter)

### Testiranje na iPhoneu
1. Otvori Expo Go aplikaciju na iPhoneu
2. Skeniraj QR kod koji se pojavi u terminalu
3. Aplikacija će se učitati

### Testni podaci za prijavu
- **Tenant kod:** default-tenant-demo
- **Korisničko ime:** ali.alic
- **Lozinka:** password123

### Rješavanje problema

**Ako Expo ne radi:**
```bash
rm -rf node_modules .expo
npm install
npx expo start -c
```

**Ako se ne povezuje na API:**
Provjeri da je web aplikacija pokrenuta na Replitu.

---

## iOS Build (for App Store)

### Preduslov
- Mac sa Xcode instaliran
- Apple Developer Account ($99/year)
- CocoaPods: `sudo gem install cocoapods`

### Korak-po-Korak

1. **Instaliraj CocoaPods dependencies:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Otvori u Xcode:**
   ```bash
   open ios/DzematApp.xcworkspace
   ```

3. **Konfiguracija sa Xcode:**
   - Select "DzematApp" project
   - General tab:
     - Bundle Identifier: `com.dzemat.app`
   - Signing & Capabilities:
     - Team: Odaberi tvoj Apple Developer Team
     - Check "Automatically manage signing"

4. **Build & Test:**
   - Select device (iPhone emulator ili device)
   - Product → Build (Cmd+B)
   - Product → Run (Cmd+R)

5. **Create Archive for App Store:**
   - Product → Build For → Archiving (Cmd+Shift+K)
   - Product → Archive
   - Window → Organizer
   - Select arhivu → "Distribute App"
   - Odaberi "App Store Connect"
   - Configure "Upload"
   - Review & Finalize

6. **Submit to App Store Connect:**
   - Go to appstoreconnect.apple.com
   - Create new app
   - Upload build iz Xcode
   - Configure:
     - App Store icon (1024x1024)
     - Screenshots
     - Description
   - Submit for review

### Common Issues

**"Pod install failed"**
```bash
rm -rf ios/Pods
rm ios/Podfile.lock
pod repo update
pod install
```

**"Code signing failed"**
- Xcode → Preferences → Accounts
- Download manual signing certificate
- Team ID treba biti postavljen

---

## Android Build (for Play Store)

### Preduslov
- Android Studio
- Google Play Developer Account ($25 one-time)
- JDK 11+

### Korak-po-Korak

1. **Generate Keystore (first time only):**
   ```bash
   keytool -genkey -v -keystore release.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias release-key \
     -storepass your_password \
     -keypass your_password
   ```

2. **Create keystore.properties (in android/):**
   ```
   storeFile=../release.keystore
   storePassword=your_password
   keyAlias=release-key
   keyPassword=your_password
   ```

3. **Build APK/AAB:**
   ```bash
   cd android
   ./gradlew bundleRelease
   cd ..
   ```
   Output: `android/app/build/outputs/bundle/release/app-release.aab`

4. **Upload to Play Console:**
   - Go to play.google.com/console
   - Create new app: "DžematApp"
   - Upload `.aab` file
   - Submit for review

---

## EAS Build (Alternative - Cloud Build)

Umesto lokalne kompilacije, koristi Expo's cloud build:

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

(Zahteva Expo account)

---

## Verzije paketa (Expo SDK 54 kompatibilne)
- React: 18.3.1
- React Native: 0.76.5
- Expo: ~54.0.0
- Expo Router: ~4.0.0

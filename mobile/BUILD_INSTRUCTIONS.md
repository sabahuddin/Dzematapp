# DžematApp iOS & Android Build Instructions

## Setup

### 1. Preuzmi Projekat
- Download mobile direktorijum sa Replit
- `cd mobile`
- `npm install`

### 2. Konfiguracija

Kreiraj `.env` fajl:
```bash
cp .env.example .env
```

Ažuriraj vrednosti:
```
API_BASE_URL=YOUR_BACKEND_URL
EXPO_PUBLIC_API_BASE_URL=YOUR_BACKEND_URL
```

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

**"Architecture mismatch"**
- In Xcode: Build Settings → Architectures
- Set to: `arm64 arm64e`

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
   - Content rating (IARC rating)
   - Target audience
   - Upload `.aab` file to Internal Testing track
   - Test sa colleagues
   - Move to Production
   - Submit for review

5. **Configure Store Listing:**
   - App icon (512x512)
   - Screenshots (landscape & portrait)
   - Description
   - Privacy policy URL
   - Contact email

### Common Issues

**"Gradle build failed"**
```bash
cd android
./gradlew clean
./gradlew build
cd ..
```

**"Signing failed"**
- Verify keystore path in `keystore.properties`
- Verify passwords are correct
- Use correct alias name

## Manual Testing

Before submitting:

### iOS
1. Run na actual device:
   ```bash
   npm run ios -- --device <device_name>
   ```
2. Test login flow
3. Navigate through tabs
4. Check API connectivity

### Android
1. Connect Android device (USB Debugging enabled)
2. Run:
   ```bash
   npm run android
   ```
3. Test same flows as iOS

## EAS Build (Alternative)

Umesto lokalne kompilacije, koristi Expo's cloud build:

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

(Zahteva Expo account i paid subscription)

## Version Management

Update version u `app.json`:
```json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

iOS: Også update `ios/DzematApp.xcodeproj` Build Settings → Current Project Version

Android: Update `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2
    versionName "1.0.1"
}
```

## Support

Za probleme, kontaktiraj dev team sa:
- Xcode version: `xcode-select --version`
- Node version: `node --version`
- CocoaPods: `pod --version`
- Gradle: `./gradlew --version`

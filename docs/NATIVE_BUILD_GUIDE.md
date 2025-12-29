# PulseOS Native Build Guide

This guide covers everything needed to build and deploy PulseOS for iOS and Android.

## Prerequisites

### Development Environment
- **macOS** (required for iOS builds)
- **Node.js** 18+ and npm
- **Git**

### iOS Requirements
- **Xcode 15+** (from Mac App Store)
- **Xcode Command Line Tools**: `xcode-select --install`
- **Apple Developer Account** (for distribution)
- **CocoaPods**: `sudo gem install cocoapods`

### Android Requirements
- **Android Studio** (latest stable)
- **Android SDK** (API 33+)
- **Java 17** (included with Android Studio)
- **Google Play Developer Account** (for distribution)

---

## Initial Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pulseos
npm install
```

### 2. Add Native Platforms

```bash
# Add iOS
npx cap add ios

# Add Android  
npx cap add android
```

### 3. Build Web Assets

```bash
npm run build
```

### 4. Sync to Native Projects

```bash
npx cap sync
```

---

## iOS Build

### App Icon (Required)

Create a **1024x1024 PNG** (no transparency, no alpha channel):

1. Use your logo/brand assets
2. Generate all sizes via:
   - [App Icon Generator](https://appicon.co/)
   - Xcode's Asset Catalog (drag 1024x1024 image)

3. Replace icons in: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Launch Screen

Edit in Xcode:
1. Open `ios/App/App.xcworkspace`
2. Navigate to `App > App > LaunchScreen.storyboard`
3. Customize with your branding (logo, background color #0a0a0b)

### Build & Run

```bash
# Open in Xcode
npx cap open ios

# Or run directly (requires connected device/simulator)
npx cap run ios
```

### Signing Configuration

1. In Xcode, select the App target
2. Go to **Signing & Capabilities**
3. Select your **Team** (Apple Developer account)
4. Set **Bundle Identifier**: `tech.pulseos.app`
5. Enable **Automatically manage signing**

### Required Capabilities

Add these in Xcode under Signing & Capabilities:
- Push Notifications (if using)
- In-App Purchase (for RevenueCat)
- Background Modes > Remote notifications (if using push)

### Privacy Descriptions (Info.plist)

These may already be set, but verify in `ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>PulseOS uses your location for local weather and recommendations.</string>

<key>NSCameraUsageDescription</key>
<string>PulseOS uses the camera for profile photos.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>PulseOS needs access to save and select photos.</string>
```

---

## Android Build

### App Icon (Required)

Use Android Studio's Image Asset Studio:

1. Open Android Studio
2. Right-click `app/src/main/res` > **New > Image Asset**
3. Select **Launcher Icons (Adaptive and Legacy)**
4. Import your 1024x1024 source image
5. Adjust foreground/background layers
6. Generate all required sizes

### Splash Screen

Edit `android/app/src/main/res/values/styles.xml`:

```xml
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">#0a0a0b</item>
        <item name="colorPrimaryDark">#0a0a0b</item>
        <item name="colorAccent">#8b5cf6</item>
        <item name="android:windowBackground">#0a0a0b</item>
        <item name="android:navigationBarColor">#0a0a0b</item>
        <item name="android:statusBarColor">#0a0a0b</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="AppTheme">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
    </style>
</resources>
```

### Build & Run

```bash
# Open in Android Studio
npx cap open android

# Or run directly
npx cap run android
```

### Signing Configuration

For release builds, create a keystore:

```bash
keytool -genkey -v -keystore pulseos-release.keystore -alias pulseos -keyalg RSA -keysize 2048 -validity 10000
```

Add to `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file("pulseos-release.keystore")
            storePassword "your-store-password"
            keyAlias "pulseos"
            keyPassword "your-key-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

## RevenueCat Production Setup

### iOS

1. Get production API key from RevenueCat dashboard
2. Add to iOS build configuration (Info.plist or environment):
   
```xml
<key>REVENUECAT_API_KEY</key>
<string>appl_YOUR_PRODUCTION_KEY</string>
```

### Android

1. Get production API key from RevenueCat dashboard  
2. Add to `android/app/src/main/res/values/strings.xml`:

```xml
<string name="revenuecat_api_key">goog_YOUR_PRODUCTION_KEY</string>
```

---

## Build Commands Summary

```bash
# Development workflow
npm run build          # Build web assets
npx cap sync          # Sync to native projects
npx cap run ios       # Run on iOS
npx cap run android   # Run on Android

# Open in IDEs
npx cap open ios      # Open Xcode
npx cap open android  # Open Android Studio

# After pulling changes
git pull
npm install
npm run build
npx cap sync
```

---

## App Store Submission Checklist

### iOS (App Store Connect)

- [ ] App icon (1024x1024)
- [ ] Screenshots (6.7", 6.5", 5.5")
- [ ] App description, keywords, categories
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating questionnaire
- [ ] In-app purchases configured
- [ ] Privacy manifest included
- [ ] App Review notes (test account if needed)

### Android (Google Play Console)

- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone + tablet)
- [ ] Short & full description
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] In-app products configured
- [ ] Target API level compliance
- [ ] Data safety form completed

---

## Troubleshooting

### iOS Pod Install Fails
```bash
cd ios/App
pod deintegrate
pod install --repo-update
```

### Android Gradle Sync Fails
- File > Invalidate Caches > Restart
- Delete `android/.gradle` and `android/app/build`
- Sync again

### Capacitor Sync Issues
```bash
npx cap sync --force
```

### Hot Reload for Development

Uncomment the server block in `capacitor.config.ts`:
```typescript
server: {
  url: 'https://your-project.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

Remember to comment this out for production builds!

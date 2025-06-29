# Building Android APK for Divido App

## Prerequisites

1. **Install EAS CLI** (if not already installed):
   ```powershell
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**:
   ```powershell
   eas login
   ```

## Method 1: Using EAS Build (Recommended)

### Step 1: Configure EAS Build
Create `eas.json` configuration file (if not exists):

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 2: Build APK for Preview/Testing
```powershell
# Build APK for internal testing
eas build --platform android --profile preview

# Or build for development (with dev client)
eas build --platform android --profile development
```

### Step 3: Download APK
After build completion, EAS will provide a download link for the APK file.

## Method 2: Local Build (if you have Android SDK installed)

### Step 1: Install Android SDK and configure
Make sure you have:
- Android Studio installed
- Android SDK configured
- Java JDK 11+ installed
- Environment variables set (ANDROID_HOME, etc.)

### Step 2: Generate Android project
```powershell
# Install Expo CLI if not installed
npm install -g @expo/cli

# Generate Android project
npx expo run:android
```

### Step 3: Build APK using Gradle
```powershell
# Navigate to android folder (if generated)
cd android

# Build debug APK
./gradlew assembleDebug

# Build release APK (requires signing)
./gradlew assembleRelease
```

The APK will be generated in:
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## Method 3: Expo Development Build

### Step 1: Install Expo Dev Client
```powershell
npx expo install expo-dev-client
```

### Step 2: Create development build
```powershell
npx expo run:android
```

## Quick Start (Recommended for Testing)

1. **Use EAS Build for APK**:
   ```powershell
   # Install EAS CLI
   npm install -g @expo/eas-cli
   
   # Login to Expo
   eas login
   
   # Build APK
   eas build --platform android --profile preview
   ```

2. **Wait for build completion** (usually 10-20 minutes)

3. **Download APK** from the provided link and install on your Android device

## Important Notes

- For first-time users, you'll need to create an Expo account
- EAS Build provides free builds with some limitations
- Local builds require Android development environment setup
- APK files can be shared and installed on any Android device
- For production releases, you'll need to sign the APK with your keystore

## Testing the APK

1. Enable "Install from Unknown Sources" on your Android device
2. Transfer the APK file to your device
3. Install the APK
4. Open the Divido app and test all features

## Environment Configuration

Make sure your `.env` file is properly configured with:
- Supabase credentials
- Cloudinary settings
- RevenueCat API keys
- Other required environment variables

The app will use these settings when built into the APK.

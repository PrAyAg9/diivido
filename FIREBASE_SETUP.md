# 🔥 Firebase Google Auth Setup Guide

This guide will help you set up Firebase Google Authentication for the Divido expense sharing app.

## 📋 Prerequisites

1. Google account
2. Firebase project
3. Android & iOS development environment set up

## 🚀 Step-by-Step Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `divido-expense-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Click **Google** and enable it
5. Set project support email
6. Click **Save**

### 3. Add Apps to Firebase Project

#### For Web App:

1. Click the **Web** icon (`</>`) in project overview
2. Register app with nickname: `Divido Web`
3. Copy the config object (we'll use this later)

#### For Android App:

1. Click the **Android** icon in project overview
2. Enter package name: `com.dividoapp.expense` (or your package name)
3. Download `google-services.json`
4. Place it in `android/app/` directory

#### For iOS App:

1. Click the **iOS** icon in project overview
2. Enter bundle ID: `com.dividoapp.expense` (or your bundle ID)
3. Download `GoogleService-Info.plist`
4. Add it to your iOS project in Xcode

### 4. Get OAuth Client IDs

1. In Firebase Console, go to **Authentication > Sign-in method > Google**
2. Click **Configure**
3. Note down the **Web client ID**
4. For Android client ID: Check `google-services.json` file
5. For iOS client ID: Check `GoogleService-Info.plist` file

### 5. Update Configuration Files

#### Update `services/firebase-config.ts`:

```typescript
const firebaseConfig = {
  apiKey: 'your-api-key-here',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456789',

  // OAuth Client IDs
  webClientId: 'your-web-client-id.apps.googleusercontent.com',
  iosClientId: 'your-ios-client-id.apps.googleusercontent.com',
  androidClientId: 'your-android-client-id.apps.googleusercontent.com',
};
```

### 6. Enable Real Google Auth

In `services/google-auth.ts`, change the dev mode flag:

```typescript
// Change this line from:
if (__DEV__ && true) { // Mock mode

// To:
if (__DEV__ && false) { // Real Firebase auth
```

### 7. Test the Setup

1. Run the app: `expo start`
2. Try to sign in with Google
3. Check Firebase Console > Authentication > Users to see if users are created

## 🛠️ Troubleshooting

### Common Issues:

1. **"OAuth client not found"**

   - Verify client IDs are correct in firebase-config.ts
   - Make sure Google sign-in is enabled in Firebase Console

2. **"Package name mismatch"**

   - Verify package names match between app.json and Firebase project

3. **"GoogleService files not found"**

   - Ensure google-services.json (Android) and GoogleService-Info.plist (iOS) are in correct locations

4. **Development vs Production**
   - Use different Firebase projects for dev/prod
   - Update config accordingly

## 📱 Platform-Specific Notes

### Android:

- Ensure `google-services.json` is in `android/app/`
- May need to add SHA-1 fingerprint for release builds
- Test on physical device for best results

### iOS:

- Ensure `GoogleService-Info.plist` is properly added to Xcode project
- Configure URL schemes if needed
- Test on simulator or device

### Web:

- Uses popup-based authentication
- Ensure domain is added to authorized domains in Firebase

## 🔄 Switching Back to Mock Mode

To temporarily disable real Google Auth and use mock accounts:

```typescript
// In services/google-auth.ts
if (__DEV__ && true) { // Enable mock mode
```

## 📞 Support

If you encounter issues:

1. Check Firebase Console logs
2. Review Expo logs for errors
3. Verify all configuration files are correct
4. Test on different devices/platforms

---

**Next Steps:**
Once Google Auth is working, you can enable it in the login/register screens by uncommenting the social auth sections.

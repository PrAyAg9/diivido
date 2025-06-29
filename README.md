# Divido - Expense Sharing Made Simple

A comprehensive expense sharing application built with React Native (Expo), Node.js, and MongoDB. Split bills, track expenses, and manage group finances with ease.

## 🚀 Features

### Core Features
- **User Authentication**: Secure signup/login with JWT tokens
- **Group Management**: Create and manage expense groups/trips
- **Expense Tracking**: Add, edit, and categorize expenses
- **Smart Bill Splitting**: Equal, custom, and percentage-based splits
- **Real-time Balances**: Track who owes what to whom
- **Payment Integration**: UPI-based settlement system
- **Multi-currency Support**: Support for multiple currencies with conversion

### Social Features
- **Friend Management**: Add friends and send invitations
- **Chat Interface**: Message friends and request money
- **Email Invitations**: Send app invitations via email using Nodemailer
- **Activity Feed**: Track group activities and transactions

### Premium Features (Pro Subscription)
- **Unlimited Groups**: Create unlimited groups/trips (Free: 10 groups)
- **Advanced Analytics**: Detailed spending insights and reports
- **Priority Support**: 24/7 premium customer support
- **Custom Categories**: Create custom expense categories
- **Export Reports**: Export detailed expense reports
- **Advanced Chat**: Voice messages and enhanced messaging

### Gamification
- **Level System**: Earn XP and level up
- **Achievements**: Unlock achievements for various milestones
- **Streak Tracking**: Daily usage streaks
- **Rewards**: Surprise prizes for reaching goals

## 🛠 Tech Stack

### Frontend (Mobile App)
- **React Native** with Expo SDK 51
- **TypeScript** for type safety
- **Expo Router** for navigation
- **Lucide React Native** for icons
- **AsyncStorage** for local data persistence
- **Expo Image Picker** for profile photos
- **RevenueCat** for subscription management

### Backend (API Server)
- **Node.js** with Express.js
- **TypeScript** for backend development
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Nodemailer** for email services
- **Cloudinary** for image uploads
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### External Services
- **MongoDB Atlas**: Cloud database
- **Cloudinary**: Image hosting and processing
- **Gmail SMTP**: Email delivery
- **RevenueCat**: Subscription management
- **Exchange Rate API**: Currency conversion

## 📁 Project Structure

```
divido/
├── app/                          # Frontend React Native app
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── welcome.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Dashboard
│   │   ├── groups.tsx            # Groups list
│   │   ├── activity.tsx          # Activity feed
│   │   └── profile.tsx           # User profile
│   ├── add-expense.tsx           # Add expense screen
│   ├── create-group.tsx          # Create group screen
│   ├── group-details.tsx         # Group details screen
│   ├── chat.tsx                  # Chat interface
│   ├── subscription.tsx          # Subscription management
│   ├── payment-methods.tsx       # Payment methods
│   ├── notifications.tsx         # Notifications
│   └── privacy-settings.tsx      # Privacy settings
├── backend/                      # Backend Node.js API
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   ├── models/               # MongoDB schemas
│   │   ├── routes/               # API routes
│   │   ├── middlewares/          # Custom middlewares
│   │   ├── services/             # Business logic
│   │   └── index.ts              # Server entry point
│   └── package.json
├── components/                   # Reusable UI components
├── contexts/                     # React contexts
├── services/                     # API services
├── utils/                        # Utility functions
├── types/                        # TypeScript type definitions
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account
- Expo CLI
- Android Studio / Xcode (for device testing)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd divido
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Configure your `.env` file:
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/divido

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=5000
NODE_ENV=development
```

```bash
# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate back to root
cd ..

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Configure your `.env` file:
```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# Cloudinary (for image uploads)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
EXPO_PUBLIC_CLOUDINARY_API_KEY=your-api-key

# Email Configuration (same as backend)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

```bash
# Start Expo development server
npx expo start
```

## 🌐 Production Deployment

### Backend Deployment (Railway/Heroku/DigitalOcean)

1. **Environment Variables**: Set all environment variables in your hosting platform
2. **Database**: Use MongoDB Atlas for production database
3. **Domain**: Update CORS settings for your production domain

#### Railway Deployment:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Environment Variables for Production:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=production-secret-key
SMTP_USER=production-email@gmail.com
SMTP_PASS=app-password
CLOUDINARY_CLOUD_NAME=production-cloud
CLOUDINARY_API_KEY=production-key
CLOUDINARY_API_SECRET=production-secret
NODE_ENV=production
PORT=5000
```

### Frontend Deployment

#### For Web (Expo Web):
```bash
# Build for web
npx expo build:web

# Deploy to Vercel/Netlify
npm install -g vercel
vercel --prod
```

#### For Mobile App Stores:

##### iOS App Store:
```bash
# Build for iOS
npx expo build:ios

# Or use EAS Build
npx eas build --platform ios
```

##### Google Play Store:
```bash
# Build for Android
npx expo build:android

# Or use EAS Build
npx eas build --platform android
```

### Production Environment Configuration

Update your production `.env`:
```env
# Production API URL
EXPO_PUBLIC_API_URL=https://your-api.railway.app/api

# Production Cloudinary
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=production-cloud
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=production-preset
EXPO_PUBLIC_CLOUDINARY_API_KEY=production-key

# Production email
SMTP_USER=production-email@domain.com
SMTP_PASS=production-app-password
```

## 📧 Email Configuration & Invitation System

### Gmail SMTP Setup
1. Enable 2-factor authentication on Gmail
2. Generate app password: Google Account → Security → App passwords
3. Use app password in SMTP_PASS (not your regular password)

### Invitation Link Configuration

#### Development Mode (localhost):
- Invitation emails contain `http://localhost:8081` links
- Recipients need Expo Go app to test
- Links work only on same network

#### Production Mode:
1. **Web App**: Deploy to Vercel/Netlify for universal links
2. **Mobile App**: Use deep linking with custom URL scheme

#### Universal Links Setup:
```bash
# Configure app.json for deep linking
{
  "expo": {
    "scheme": "divido",
    "web": {
      "bundler": "metro"
    }
  }
}
```

#### Production Invitation Flow:
1. User sends invitation email
2. Email contains: `https://yourapp.com/invite?token=xyz`
3. Non-users redirected to app store
4. Existing users open app directly

## 📱 Mobile App Development & Distribution

### Development Build
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Create development build
eas build --profile development --platform android
eas build --profile development --platform ios
```

### App Store Deployment

#### iOS App Store:
1. **Apple Developer Account** ($99/year)
2. **Configure App Store Connect**
3. **Build for production**:
   ```bash
   eas build --platform ios --profile production
   ```
4. **TestFlight Testing**
5. **App Store Review & Release**

#### Google Play Store:
1. **Google Play Developer Account** ($25 one-time)
2. **Build AAB**:
   ```bash
   eas build --platform android --profile production
   ```
3. **Upload to Play Console**
4. **Internal Testing → Production**

### Real Device Testing
```bash
# Physical device testing
eas device:create
eas build --profile development

# Install on device
# iOS: Install via TestFlight or direct IPA
# Android: Install APK directly
```

## 🔐 RevenueCat Subscription Setup

### 1. RevenueCat Configuration
```bash
# Create account at revenuecat.com
# Create new project
# Configure products/entitlements
```

### 2. App Store Configuration
```typescript
// iOS products in App Store Connect
MONTHLY_PRO = "divido_pro_monthly"
ANNUAL_PRO = "divido_pro_annual"

// Android products in Play Console
MONTHLY_PRO = "divido_pro_monthly"
ANNUAL_PRO = "divido_pro_annual"
```

### 3. Environment Variables
```env
# Add to .env
REVENUECAT_IOS_API_KEY=appl_xxxxx
REVENUECAT_ANDROID_API_KEY=goog_xxxxx
```

### 4. Testing Subscriptions
```bash
# iOS: Test with sandbox users
# Android: Test with license testers
```

## 🎮 Gamification Implementation

### Achievement System
```typescript
// Achievement tracking
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

// XP Events
- Create first group: +50 XP
- Add expense: +10 XP
- Invite friend: +25 XP
- Complete payment: +15 XP
- Daily login streak: +5 XP per day
```

### Rewards System
- **Level 5**: Custom expense categories
- **Level 10**: Priority support access
- **Level 15**: Advanced analytics preview
- **Level 20**: Exclusive app themes

## 🔧 Development Environment Switching

### Test Mode → Production Mode

#### 1. Backend Changes:
```env
# Development
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/divido-dev

# Production
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-cluster.mongodb.net/divido
```

#### 2. Frontend Changes:
```env
# Development
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# Production
EXPO_PUBLIC_API_URL=https://api.yourapp.com/api
```

#### 3. Email Links:
```typescript
// Development
const inviteLink = `exp://192.168.1.100:8081/invite?token=${token}`;

// Production
const inviteLink = `https://yourapp.com/invite?token=${token}`;
```

## 🐛 Troubleshooting Guide

### Common Issues & Solutions

#### 1. "Cannot connect to backend"
```bash
# Check if backend is running
cd backend && npm run dev

# Verify API_URL in .env
echo $EXPO_PUBLIC_API_URL

# Test API endpoint
curl http://localhost:5000/api/health
```

#### 2. "Email not sending"
```bash
# Check SMTP credentials
# Verify app password (not regular password)
# Check Gmail security settings
```

#### 3. "Invitation links not working"
```bash
# Check URL scheme configuration
# Verify deep linking setup
# Test with expo://localhost:8081 for development
```

#### 4. "Build fails"
```bash
# Clear cache
npx expo r -c

# Update dependencies
npm update

# Check for peer dependency issues
npm ls
```

#### 5. "RevenueCat not working"
```bash
# Verify API keys
# Check product configurations
# Test with sandbox/test users
```

### Debug Commands
```bash
# Frontend debugging
npx expo r --clear
npx expo doctor
npx expo install --fix

# Backend debugging
cd backend
npm run dev
npm run test
npm run logs

# Database debugging
# Check MongoDB Atlas network access
# Verify connection string
# Check user permissions
```

## 📊 Analytics & Monitoring

### Error Tracking
```bash
# Install Sentry for error monitoring
npm install @sentry/react-native

# Configure in app.json
{
  "expo": {
    "hooks": {
      "postPublish": [
        {
          "file": "sentry-expo/upload-sourcemaps",
          "config": {
            "organization": "your-org",
            "project": "divido"
          }
        }
      ]
    }
  }
}
```

### Performance Monitoring
- Flipper integration for React Native debugging
- MongoDB performance monitoring
- API response time tracking

## 🚀 Deployment Checklist

### Pre-Production Checklist
- [ ] Environment variables configured
- [ ] Database production-ready
- [ ] SMTP email service configured
- [ ] Cloudinary production setup
- [ ] RevenueCat products configured
- [ ] App store accounts created
- [ ] Domain and SSL certificates
- [ ] Error monitoring setup
- [ ] Privacy policy and terms created
- [ ] App icons and splash screens
- [ ] Store listing content prepared

### Launch Checklist
- [ ] Backend deployed and tested
- [ ] Frontend builds successful
- [ ] Email invitations working
- [ ] Payment flow tested
- [ ] Subscription system functional
- [ ] Social features operational
- [ ] Performance optimized
- [ ] Security audit completed
- [ ] Beta testing completed
- [ ] App store submissions approved

## 📞 Support & Contact

**Developer**: Prayag Thakur  
**Email**: prayag.thakur@example.com  
**GitHub**: [Repository Issues](../../issues)

For technical support:
1. Check this README first
2. Search existing GitHub issues
3. Create new issue with detailed description
4. Include error logs and environment details

---

**Made with ❤️ by Prayag Thakur**  
© 2025 Prayag Thakur. All rights reserved.

Build the TypeScript code:

```bash
npm run build
```

#### Step 4: Running the App

1. **Start the Backend Server** (in one terminal):

   ```bash
   cd backend
   npm run dev
   ```

   The server will start on http://localhost:5000

2. **Start the Frontend** (in another terminal):

   ```bash
   # From the root directory
   npx expo start
   ```

   This will start the Expo development server.

3. **Connect to the App**:
   - Use the Expo Go app on your phone to scan the QR code
   - Press 'w' to open in a web browser
   - Press 'a' to open in an Android emulator
   - Press 'i' to open in an iOS simulator

### Important Configuration Notes

1. **When testing on a real device**:
   Update the API URL in `services/api.ts` to point to your computer's IP address rather than localhost:

   ```typescript
   // Change this:
   export const API_URL = 'http://localhost:5000/api';

   // To this (replace with your computer's IP):
   export const API_URL = 'http://192.168.1.100:5000/api';
   ```

2. **MongoDB Connection**:
   Make sure your MongoDB connection string in the backend `.env` file has the correct password.

## Features

- User authentication
- Create and manage groups
- Add and track expenses
- Split expenses equally or custom amounts
- Record payments
- View balances and activity

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login existing user

### Groups

- `POST /api/groups` - Create a new group
- `GET /api/groups` - Get all groups for the current user
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/members` - Add a member to a group

### Expenses

- `POST /api/expenses` - Create a new expense
- `GET /api/expenses/group/:groupId` - Get expenses for a group
- `PUT /api/expenses/:id` - Update an expense
- `POST /api/expenses/:expenseId/mark-paid` - Mark a split as paid

### Payments

- `POST /api/payments` - Create a new payment
- `GET /api/payments` - Get payments (filtered by groupId if provided)
- `PUT /api/payments/:id/status` - Update payment status

## Troubleshooting

1. **Connection Issues**: If your app can't connect to the backend:

   - Check that both servers are running
   - Verify the API URL is correct (especially if testing on a physical device)
   - Check for any network restrictions or firewall issues

2. **Database Errors**:

   - Verify your MongoDB connection string
   - Ensure your IP address is whitelisted in MongoDB Atlas
   - Check the server logs for specific errors

3. **Authentication Problems**:

   - Clear AsyncStorage if you're experiencing login loops
   - Check the JWT_SECRET matches between environments

4. **Missing Packages**:
   - Run `npm install` in both the root directory and the backend directory

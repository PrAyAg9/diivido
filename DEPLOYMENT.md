# Backend Deployment Guide

## 🚀 Deployment Instructions

The backend deployment was failing because platforms were detecting the frontend `package.json` instead of the backend. This has been fixed with proper configuration.

## 📁 Project Structure

```
divido/
├── backend/          # Backend API server
│   ├── src/
│   ├── package.json  # Backend dependencies
│   └── render.yaml   # Backend-specific config
├── render.yaml       # Root deployment config
├── Dockerfile        # Docker deployment
└── package.json      # Frontend (Expo) config
```

## 🛠️ Fixed Issues

1. **Render Error**: Was trying to run `expo-router/entry` (frontend) instead of backend
2. **Vercel Error**: Was looking for `public` directory (frontend) instead of API routes
3. **Wrong Entry Point**: Platforms were detecting wrong package.json

## 🌐 Deployment Options

### Option 1: Render (Recommended)

1. Connect your GitHub repo to Render
2. **Deploy from project root** (not backend subdirectory)
3. Render will use the `render.yaml` configuration
4. Set environment variables in Render dashboard

### Option 2: Railway

1. Deploy the `backend` directory only
2. Railway will auto-detect the Node.js app
3. Set environment variables in Railway dashboard

### Option 3: Heroku

1. Deploy the `backend` directory only
2. Or use the Dockerfile for container deployment
3. Set environment variables in Heroku config vars

### Option 4: Docker (Any Platform)

1. Build: `docker build -t divido-backend .`
2. Run: `docker run -p 5000:5000 divido-backend`
3. Deploy to any container platform

## 🔧 Environment Variables

Set these in your deployment platform:

```env
PORT=5000
MONGODB_URI=mongodb+srv://pat982003:prayag123@divido.kfbytcw.mongodb.net/?retryWrites=true&w=majority&appName=Divido
JWT_SECRET=your_jwt_secret_here
SMTP_USER=jamessmith98igi@gmail.com
SMTP_PASS=hlmt jbgr kxbd vuvw
GEMINI_API_KEY=AIzaSyCIQBcWSThzgV_Q7EaouXM9k5nfTYOwyX8
ELEVEN_LABS_API_KEY=sk_0a4cad5467e6a9da672ea8a44bb6459c29e0f4d5e728c4c8
ELEVEN_LABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
BASE_URL=https://your-deployed-backend.com
NODE_ENV=production
```

## 🧪 Testing Deployment

1. **Local Test**: `cd backend && npm start`
2. **Health Check**: Visit `/health` endpoint
3. **API Test**: Try `/api/auth/health` endpoint

## 🔍 Troubleshooting

### Issue: "Cannot find module expo-router/entry"

- **Cause**: Platform detecting frontend package.json
- **Solution**: Use the root `render.yaml` which specifies backend directory

### Issue: "No public directory found"

- **Cause**: Platform expecting frontend build
- **Solution**: Deploy to a backend-focused platform or use proper API configuration

### Issue: Build fails

- **Solution**: Ensure all dependencies are in backend/package.json
- **Check**: TypeScript compiles without errors

## 📞 API Endpoints

Once deployed, your API will be available at:

- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/groups` - Get user groups
- `POST /api/groups` - Create group
- And more...

## 🔄 Continuous Deployment

For automatic deployments, ensure:

1. Push to main branch triggers deployment
2. Environment variables are set in platform
3. Build command: `cd backend && npm install && npm run build`
4. Start command: `cd backend && npm start`

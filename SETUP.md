# Comment Clash - Setup Guide

This guide will help you set up Comment Clash for development and production.

## Prerequisites Installation

### 1. Node.js and npm
Download and install Node.js 18+ from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
```

### 2. Expo CLI
Install Expo CLI globally:
```bash
npm install -g expo-cli
```

### 3. Git
Download and install Git from [git-scm.com](https://git-scm.com/)

## Clone Repository

```bash
git clone https://github.com/JesterInvestor/Comment-Clash.git
cd Comment-Clash
```

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Firebase Setup (Optional for Development)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file

Extract these values from the JSON:
- `project_id` → FIREBASE_PROJECT_ID
- `private_key` → FIREBASE_PRIVATE_KEY
- `client_email` → FIREBASE_CLIENT_EMAIL

### 3. Redis Setup (Optional for Development)

**Option A: Local Redis**
- macOS: `brew install redis && brew services start redis`
- Ubuntu: `sudo apt-get install redis-server && sudo service redis-server start`
- Windows: Use [Redis for Windows](https://github.com/microsoftarchive/redis/releases)

**Option B: Cloud Redis**
- [Redis Cloud](https://redis.com/try-free/) - Free tier available
- [DigitalOcean Managed Redis](https://www.digitalocean.com/products/managed-databases-redis)

Get connection URL: `redis://user:password@host:port`

### 4. DigitalOcean Spaces Setup (Optional for Development)

1. Go to [DigitalOcean Spaces](https://cloud.digitalocean.com/spaces)
2. Create a new Space
3. Note the endpoint URL (e.g., `nyc3.digitaloceanspaces.com`)
4. Generate API key:
   - Go to API → Spaces Keys
   - Click "Generate New Key"
   - Save the Key and Secret

### 5. Configure Environment Variables

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=3000
NODE_ENV=development

# Firebase (leave empty to skip)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com

# Redis (leave empty to skip)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# DigitalOcean Spaces (leave empty to use placeholder videos)
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_KEY=your-spaces-key
DO_SPACES_SECRET=your-spaces-secret
DO_SPACES_BUCKET=comment-clash-videos
DO_SPACES_REGION=nyc3

# Game Configuration
ROUND_DURATION=45000
CARDS_PER_PLAYER=7
GAME_CYCLES=2
MIN_PLAYERS=3
MAX_PLAYERS=8
```

### 6. Start Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server should start on `http://localhost:3000`

Test health endpoint:
```bash
curl http://localhost:3000/health
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd ../frontend
npm install
```

### 2. Install Expo Go App

**On your mobile device:**
- iOS: Download [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from App Store
- Android: Download [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from Play Store

### 3. Configure API URL

For local development, find your computer's IP address:

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

Look for IPv4 address (e.g., `192.168.1.100`)

Edit `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.100:3000"
    }
  }
}
```

**Note:** Use your actual IP address, not localhost, so mobile device can connect.

### 4. Start Expo Development Server

```bash
npm start
```

This will open Expo DevTools in your browser.

### 5. Run on Device

**Method 1: QR Code (Recommended)**
1. Open Expo Go app on your device
2. Scan the QR code from terminal or browser
3. App will load on your device

**Method 2: Simulators/Emulators**
- iOS Simulator: Press `i` in terminal
- Android Emulator: Press `a` in terminal
- Web Browser: Press `w` in terminal

## Verify Setup

### 1. Test Backend
```bash
# In backend directory
npm start
```

Expected output:
```
Comment Clash server running on port 3000
Firebase initialized successfully (or warning if not configured)
Redis connected successfully (or warning if not configured)
DigitalOcean Spaces initialized successfully (or warning if not configured)
```

### 2. Test Frontend
1. Start backend first
2. Start frontend with `npm start`
3. Open app on device/simulator
4. Should see "Comment Clash" home screen
5. Try creating a room
6. Should generate room code and go to lobby

### 3. Test Full Flow
1. Open app on 2+ devices/simulators
2. Create room on device 1
3. Join room on device 2 using room code
4. Start game from device 1
5. Play a round

## Production Deployment

### Backend to DigitalOcean App Platform

1. **Prepare Repository**
   - Commit all changes
   - Push to GitHub

2. **Create App on DigitalOcean**
   - Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect GitHub repository
   - Select branch (main)

3. **Configure App**
   - Use `.do/app.yaml` configuration
   - Or manually set:
     - Source: `backend` directory
     - Dockerfile path: `backend/Dockerfile`
     - HTTP port: 8080

4. **Set Environment Variables**
   Go to Settings → Environment Variables:
   - Add all secrets from `.env`
   - Mark sensitive values as "Secret"

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Note the app URL (e.g., `https://app-xxxxx.ondigitalocean.app`)

### Frontend to App Stores

1. **Update API URL**
   Edit `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": "https://your-backend-url.ondigitalocean.app"
       }
     }
   }
   ```

2. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

3. **Configure EAS**
   ```bash
   cd frontend
   eas login
   eas build:configure
   ```

4. **Build for iOS**
   ```bash
   eas build --platform ios
   ```
   - Follow prompts for Apple Developer account
   - Download IPA when complete
   - Upload to App Store Connect

5. **Build for Android**
   ```bash
   eas build --platform android
   ```
   - Follow prompts for Play Console account
   - Download APK/AAB when complete
   - Upload to Google Play Console

## Troubleshooting

### Backend Issues

**Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Firebase authentication failed**
- Verify `FIREBASE_PRIVATE_KEY` includes `\n` characters
- Check project ID matches Firebase Console
- Ensure service account has correct permissions

**Redis connection failed**
- Check Redis is running: `redis-cli ping` (should return PONG)
- Verify REDIS_URL is correct
- Check firewall allows port 6379

### Frontend Issues

**Can't connect to backend**
- Verify backend is running
- Check API URL uses IP address, not localhost
- Ensure devices are on same WiFi network
- Check firewall allows port 3000

**Expo build failed**
- Clear cache: `expo start -c`
- Remove node_modules: `rm -rf node_modules && npm install`
- Update Expo: `npm install expo@latest`

**Socket.io not connecting**
- Verify backend WebSocket is working
- Check CORS configuration
- Ensure Socket.io versions match (client & server)

### Mobile Device Issues

**App crashes on launch**
- Check Expo version compatibility
- Clear Expo cache on device
- Reinstall Expo Go app

**Videos not playing**
- Check video URLs are accessible
- Verify Spaces configuration
- Check signed URL expiration

## Development Tips

### Hot Reload
- Backend: Use `npm run dev` with nodemon
- Frontend: Shake device or press Cmd+D (iOS) / Cmd+M (Android) for dev menu

### Debugging
- Backend: Add `console.log()` statements
- Frontend: Use React DevTools or Expo DevTools
- Socket.io: Use Socket.io admin UI (optional)

### Testing Changes
1. Make code changes
2. Backend auto-reloads with nodemon
3. Frontend auto-refreshes with Expo
4. Test on device immediately

### Environment Switching
Create multiple `.env` files:
- `.env.development`
- `.env.staging`
- `.env.production`

Use with: `NODE_ENV=staging npm start`

## Next Steps

- Read [TECHNICAL.md](TECHNICAL.md) for architecture details
- Review code in `backend/game/` for game logic
- Customize captions in `backend/game/captionGenerator.js`
- Upload videos to DigitalOcean Spaces
- Add monetization (ads/IAP)
- Submit to app stores

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/JesterInvestor/Comment-Clash/issues)
- Documentation: See README.md and TECHNICAL.md
- Community: Join discussions on GitHub

---

Happy coding! 🚀
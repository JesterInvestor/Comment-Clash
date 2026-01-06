# Comment Clash

Comment Clash is a real-time multiplayer mobile party game where 3-8 players compete by matching funny captions to short videos. Built with React Native and Socket.io, players join via lobby codes, select from 7 caption cards while a rotating judge picks the funniest submission each round. Winner takes the highest score after 2 full cycles.

## 🎮 Game Features

- **3-8 Players**: Perfect party game for small to medium groups
- **45-Second Rounds**: Fast-paced gameplay keeps everyone engaged
- **Anonymous Judging**: Submissions are anonymous to ensure fair judging
- **Rotating Judge**: Every player gets to be the judge across 2 cycles
- **7 Cards Per Player**: Strategic card selection adds depth
- **Real-time Multiplayer**: Powered by Socket.io for instant synchronization
- **Clean Content**: Family-friendly captions targeting 16-35 audience
- **Casual Social Gameplay**: Easy to learn, fun to play

## 🏗️ Architecture

### Frontend
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **Real-time**: Socket.io Client
- **Video Playback**: Expo AV

### Backend
- **Server**: Node.js + Express
- **Real-time**: Socket.io
- **Database**: Firebase Firestore
- **Caching**: Redis
- **Video Storage**: DigitalOcean Spaces

### Hosting
- **Backend**: DigitalOcean App Platform
- **Videos**: DigitalOcean Spaces (S3-compatible)

## 📁 Project Structure

```
Comment-Clash/
├── backend/
│   ├── game/
│   │   ├── gameManager.js       # Core game logic and state management
│   │   └── captionGenerator.js  # Caption library and generation
│   ├── services/
│   │   ├── firebase.js          # Firestore integration
│   │   ├── redis.js             # Redis caching
│   │   └── videoService.js      # DigitalOcean Spaces integration
│   ├── server.js                # Express + Socket.io server
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.js    # Create/Join room
│   │   │   ├── LobbyScreen.js   # Waiting room
│   │   │   ├── GameScreen.js    # Main gameplay
│   │   │   └── ResultsScreen.js # Final scores
│   │   ├── contexts/
│   │   │   └── GameContext.js   # Global game state
│   │   └── services/
│   │       └── SocketService.js # Socket.io client
│   ├── App.js
│   ├── package.json
│   └── app.json
└── .do/
    └── app.yaml                 # DigitalOcean deployment config
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (for mobile development)
- Redis instance (optional for development)
- Firebase project (optional for development)
- DigitalOcean Spaces (optional for development)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=3000
NODE_ENV=development

# Firebase (optional for development)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Redis (optional for development)
REDIS_URL=redis://localhost:6379

# DigitalOcean Spaces (optional for development)
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_KEY=your-spaces-key
DO_SPACES_SECRET=your-spaces-secret
DO_SPACES_BUCKET=comment-clash-videos
DO_SPACES_REGION=nyc3
```

5. Start the server:
```bash
npm start
```

Server will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update API URL in `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:3000"
    }
  }
}
```

4. Start Expo:
```bash
npm start
```

5. Run on device:
- Scan QR code with Expo Go app (iOS/Android)
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser

## 🎯 How to Play

1. **Create/Join Room**: Host creates a room and shares the 6-character code with friends
2. **Wait in Lobby**: Players join and wait for host to start (3-8 players required)
3. **Watch Video**: Each round starts with a short video
4. **Submit Caption**: Players (except judge) select their funniest caption card
5. **Judge Picks**: Judge sees all submissions anonymously and picks the winner
6. **Score Point**: Winner gets a point, used cards are discarded, new cards dealt
7. **Rotate Judge**: Next player becomes judge for the next round
8. **Complete 2 Cycles**: Game ends after everyone has been judge twice
9. **Winner Announced**: Player with most points wins!

## 🎨 Game Mechanics

### Round Timer
- Each round has 45 seconds for caption submission
- Timer is displayed prominently during gameplay
- Auto-submit disabled submissions when timer expires

### Judge Rotation
- Judge rotates clockwise after each round
- Current judge is indicated with ⚖️ emoji
- Judge cannot submit captions but picks winner

### Card Management
- Each player starts with 7 caption cards
- Cards are used when submitted
- New cards dealt after each round
- Strategic card saving encouraged

### Scoring
- 1 point awarded per round win
- Total rounds = Number of players × 2 cycles
- Highest score wins at the end

## 💰 Monetization (Framework Included)

### Advertising
- Interstitial ads between rounds (placeholder)
- Banner ads on results screen (placeholder)
- Rewarded ads for bonus cards (placeholder)

### Content Packs
- Premium video packs (framework in place)
- Themed caption packs (framework in place)
- In-app purchases via app stores

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Running Tests

The backend includes comprehensive tests that run without external dependencies (Firebase, Redis, S3).

```bash
cd backend
npm test              # Run all tests
npm test:watch        # Run tests in watch mode
npm test:coverage     # Run tests with coverage report
```

**Test Coverage:**
- Caption generation logic
- Game room management
- Player join/leave handling
- Game state transitions
- Round mechanics
- Score tracking

All tests are designed to run without non-essential services, making them perfect for CI/CD pipelines.

## 🚢 Deployment

### Vercel (Recommended)

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed Vercel deployment instructions.

**Quick Start:**
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with one click

The backend works without external dependencies for testing, but Firebase/Redis are recommended for production.

### DigitalOcean App Platform (Alternative)

1. Fork or clone this repository
2. Connect to DigitalOcean App Platform
3. Use `.do/app.yaml` for configuration
4. Set environment secrets in DigitalOcean dashboard
5. Deploy automatically on push to main branch

### Environment Variables to Configure
- `FIREBASE_PROJECT_ID` (optional)
- `FIREBASE_PRIVATE_KEY` (optional)
- `FIREBASE_CLIENT_EMAIL` (optional)
- `REDIS_URL` (optional)
- `DO_SPACES_KEY` (optional)
- `DO_SPACES_SECRET` (optional)
- `DO_SPACES_ENDPOINT` (optional)

### Frontend Deployment

Update `apiUrl` in `app.json` to production backend URL:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-backend-url.ondigitalocean.app"
    }
  }
}
```

Build for production:
```bash
cd frontend
eas build --platform ios  # iOS build
eas build --platform android  # Android build
```

## 📝 API Documentation

### Socket.io Events

#### Client → Server
- `createRoom` - Create new game room
- `joinRoom` - Join existing room
- `startGame` - Start game (host only)
- `submitCaption` - Submit caption selection
- `judgeCaption` - Judge selects winner

#### Server → Client
- `playerJoined` - New player joined room
- `gameStarted` - Game has started
- `captionSubmitted` - Player submitted caption
- `readyForJudging` - All players submitted
- `roundComplete` - Round winner announced
- `nextRound` - New round started
- `gameComplete` - Game finished
- `playerLeft` - Player disconnected

## 🔒 Security

- Anonymous judging prevents bias
- Room codes expire after 1 hour of inactivity
- Input validation on all user submissions
- Rate limiting on API endpoints (to be implemented)
- CORS configuration for production

## 📊 Analytics & Statistics

Game statistics are saved to Firestore for:
- Player retention analysis
- Popular caption tracking
- Video engagement metrics
- Monetization optimization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 👥 Target Audience

- Age: 16-35 years old
- Interest: Casual social gaming
- Platform: Mobile (iOS & Android)
- Group size: 3-8 players
- Session length: 10-15 minutes

## 🎯 Future Enhancements

- [ ] Custom video upload feature
- [ ] User accounts and profiles
- [ ] Leaderboards and rankings
- [ ] Tournament mode
- [ ] More caption packs
- [ ] Localization support
- [ ] Voice chat integration
- [ ] Replay sharing
- [ ] Achievement system
- [ ] Friend system

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for party game lovers everywhere!

# Comment Clash - Technical Documentation

## System Architecture

### Overview
Comment Clash uses a client-server architecture with real-time communication via WebSocket (Socket.io).

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Mobile    │ ◄──────────────────────► │   Node.js   │
│  React      │      Socket.io            │   Express   │
│  Native     │                           │   Server    │
└─────────────┘                           └─────────────┘
                                                │
                                                ├─► Redis (Cache)
                                                ├─► Firestore (DB)
                                                └─► DO Spaces (Videos)
```

## Game State Management

### Room States
1. **lobby** - Waiting for players to join
2. **playing** - Active gameplay
3. **complete** - Game finished
4. **ended** - Game terminated (not enough players)

### Round Flow
```
1. Video Displayed → 2. Players Submit Captions → 3. Judge Reviews → 
4. Winner Announced → 5. Cards Dealt → 6. Rotate Judge → Loop
```

### State Persistence
- **Memory**: Active game state in GameManager
- **Redis**: Cached room data (1 hour TTL)
- **Firestore**: Permanent game records and statistics

## Data Models

### Room Object
```javascript
{
  code: String,              // 6-character room code
  host: String,              // Socket ID of host
  players: [Player],         // Array of player objects
  state: String,             // Game state
  currentRound: Number,      // Current round number
  currentCycle: Number,      // Current cycle
  currentJudge: Number,      // Index of current judge
  currentVideo: Video,       // Current video object
  submissions: [Submission], // Current round submissions
  createdAt: Number          // Timestamp
}
```

### Player Object
```javascript
{
  id: String,      // Socket ID
  name: String,    // Player name
  score: Number,   // Current score
  cards: [Caption] // Player's caption cards
}
```

### Caption Object
```javascript
{
  id: String,   // Unique caption ID
  text: String  // Caption text
}
```

### Video Object
```javascript
{
  id: String,       // Video ID
  filename: String, // Filename in storage
  duration: Number, // Duration in seconds
  url: String       // Signed URL or CDN URL
}
```

## Socket.io Events

### Connection Events
```javascript
// Client connects
socket.on('connect')

// Client disconnects
socket.on('disconnect')
```

### Room Management
```javascript
// Create room
socket.emit('createRoom', { playerName }, callback)
// Returns: { success, room }

// Join room
socket.emit('joinRoom', { roomCode, playerName }, callback)
// Returns: { success, room, error }

// Player joined broadcast
socket.on('playerJoined', (room) => {})

// Player left broadcast
socket.on('playerLeft', (gameState) => {})
```

### Game Flow
```javascript
// Start game
socket.emit('startGame', { roomCode }, callback)
// Returns: { success, error }

// Game started broadcast
socket.on('gameStarted', (gameState) => {})

// Submit caption
socket.emit('submitCaption', { roomCode, captionId }, callback)
// Returns: { success, error }

// Caption submitted broadcast
socket.on('captionSubmitted', { playerId, allSubmitted })

// Ready for judging
socket.on('readyForJudging', (gameState) => {})

// Judge caption
socket.emit('judgeCaption', { roomCode, winnerId }, callback)
// Returns: { success, error }

// Round complete
socket.on('roundComplete', (result) => {})

// Next round
socket.on('nextRound', (gameState) => {})

// Game complete
socket.on('gameComplete', (result) => {})
```

## API Endpoints

### REST Endpoints
```
GET /health
Returns: { status: 'ok', timestamp: ISO8601 }
```

## Database Schema

### Firestore Collections

#### games
```javascript
{
  roomCode: String,
  players: Array,
  rounds: Array,
  winner: String,
  startedAt: Timestamp,
  completedAt: Timestamp,
  updatedAt: Timestamp
}
```

#### stats
```javascript
{
  gameId: String,
  playerCount: Number,
  roundCount: Number,
  duration: Number,
  mostPopularCaption: String,
  timestamp: Timestamp
}
```

## Redis Keys

```
room:{roomCode}          - Cached room state (1 hour TTL)
player:{socketId}        - Player to room mapping (1 hour TTL)
```

## DigitalOcean Spaces

### Video Storage Structure
```
comment-clash-videos/
├── free/
│   ├── video_001.mp4
│   ├── video_002.mp4
│   └── ...
└── premium/
    ├── pack_01/
    │   ├── video_001.mp4
    │   └── ...
    └── pack_02/
        └── ...
```

### URL Generation
- Pre-signed URLs with 1-hour expiration
- CDN distribution for global performance
- S3-compatible API via AWS SDK

## Performance Considerations

### Scalability
- Horizontal scaling via DigitalOcean App Platform
- Redis for distributed caching
- Firestore for scalable database
- Socket.io Redis adapter for multi-instance support (future)

### Optimization
- Video pre-loading on game start
- Caption pre-generation
- Connection pooling for external services
- Lazy loading of video packs

## Security Measures

### Input Validation
- Player name length: 1-20 characters
- Room code format: 6 uppercase alphanumeric
- Caption selection validation
- Judge authorization check

### Rate Limiting
- Connection rate limiting (to be implemented)
- Action rate limiting per player (to be implemented)
- DDoS protection via DigitalOcean (built-in)

### Data Protection
- Environment variables for secrets
- HTTPS for production
- WSS (WebSocket Secure) for production
- No sensitive data in logs

## Error Handling

### Client-Side
- Socket disconnection recovery
- Automatic reconnection
- User-friendly error messages
- Graceful degradation

### Server-Side
- Try-catch blocks for async operations
- Error logging
- Graceful error responses
- Connection cleanup on errors

## Monitoring & Logging

### Logs
- Connection events
- Game state changes
- Errors and exceptions
- Performance metrics

### Metrics to Track
- Active games
- Player count
- Average game duration
- Error rates
- API response times

## Development Workflow

### Local Development
1. Start Redis (optional): `redis-server`
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm start`
4. Test on device: Expo Go app

### Testing
- Unit tests for game logic
- Integration tests for Socket.io events
- End-to-end tests for complete game flow

### Deployment
1. Push to GitHub
2. DigitalOcean auto-deploys backend
3. Build mobile app with EAS
4. Submit to app stores

## Configuration Management

### Environment Variables
All sensitive configuration via environment variables:
- Service credentials (Firebase, Redis, Spaces)
- API keys
- Feature flags
- Game parameters

### Feature Flags (Future)
- Enable/disable monetization
- Enable/disable premium content
- A/B testing variants
- Maintenance mode

## API Rate Limits (Recommended)

```
POST /create-room:     10 requests/minute/IP
POST /join-room:       20 requests/minute/IP
POST /submit-caption:  1 request/second/player
POST /judge-caption:   1 request/5seconds/judge
```

## Backup & Recovery

### Data Backup
- Firestore automatic backups
- Redis persistence configuration
- Video storage redundancy

### Disaster Recovery
- Multi-region deployment (future)
- Database replication
- Automated failover

## Mobile App Configuration

### Expo Configuration
- Build profiles for dev/staging/prod
- Environment-specific API URLs
- OTA updates for quick fixes
- App store submission automation

### Platform-Specific
- iOS: Push notifications setup
- Android: Google Play services
- Both: Deep linking for room codes

## Future Technical Improvements

1. **Caching Strategy**
   - Client-side video caching
   - Caption prefetching
   - Asset optimization

2. **Real-time Improvements**
   - Socket.io Redis adapter for multi-server
   - WebRTC for video streaming
   - Voice chat integration

3. **Analytics**
   - Firebase Analytics integration
   - Custom event tracking
   - A/B testing framework

4. **Infrastructure**
   - CDN for static assets
   - Auto-scaling policies
   - Health check improvements

5. **Security Enhancements**
   - JWT authentication
   - Input sanitization
   - CAPTCHA for room creation
   - IP-based rate limiting

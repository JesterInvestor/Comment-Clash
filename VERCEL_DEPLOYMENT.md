# Vercel Deployment Guide

This guide explains how to deploy Comment Clash backend to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier available)
- GitHub repository access
- Vercel CLI (optional but recommended): `npm install -g vercel`

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended for first deployment)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `Comment-Clash` repository

2. **Configure Project**
   - Framework Preset: Other
   - Root Directory: `./` (leave as is)
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `npm install --prefix backend`

3. **Set Environment Variables**
   
   Click "Environment Variables" and add:
   
   **Required:**
   ```
   NODE_ENV=production
   PORT=3000
   ```
   
   **Optional (but recommended for full functionality):**
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   REDIS_URL=your-redis-url
   DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
   DO_SPACES_KEY=your-spaces-key
   DO_SPACES_SECRET=your-spaces-secret
   DO_SPACES_BUCKET=comment-clash-videos
   DO_SPACES_REGION=nyc3
   ```
   
   **Game Configuration (optional):**
   ```
   ROUND_DURATION=45000
   CARDS_PER_PLAYER=7
   GAME_CYCLES=2
   MIN_PLAYERS=3
   MAX_PLAYERS=8
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (usually 1-2 minutes)
   - Your backend will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project root**
   ```bash
   cd /path/to/Comment-Clash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy: Yes
   - Which scope: Select your account
   - Link to existing project: No (for first deployment)
   - Project name: comment-clash (or your preferred name)
   - In which directory is your code located: ./
   - Deploy: Yes

5. **Add environment variables**
   ```bash
   vercel env add NODE_ENV
   vercel env add FIREBASE_PROJECT_ID
   vercel env add FIREBASE_PRIVATE_KEY
   # ... add other variables as needed
   ```

6. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Configuration Details

### vercel.json

The `vercel.json` file in the project root configures the deployment:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/health",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "backend/server.js"
    }
  ]
}
```

This configuration:
- Uses Node.js serverless runtime
- Routes all traffic to the backend server
- Supports Socket.io connections

### .vercelignore

Files excluded from deployment:
- `node_modules/` (installed fresh during build)
- Frontend files (not needed for backend deployment)
- Documentation files
- Development configuration files

## Testing Your Deployment

1. **Health Check**
   ```bash
   curl https://your-project.vercel.app/health
   ```
   
   Expected response:
   ```json
   {"status":"ok","timestamp":"2026-01-04T..."}
   ```

2. **Socket.io Connection**
   
   Test with a Socket.io client or update your frontend's `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": "https://your-project.vercel.app"
       }
     }
   }
   ```

## Running Without External Services

The backend is designed to work without external dependencies:

- **Without Firebase**: Game state stored in memory only (resets on deployment)
- **Without Redis**: No caching layer (slight performance impact)
- **Without DigitalOcean Spaces**: Uses placeholder video URLs

For production, it's recommended to configure at least Firebase for persistent storage.

## Continuous Deployment

Once connected to GitHub, Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

## Monitoring and Logs

1. **View Logs**
   - Dashboard: Go to your project → Deployments → Select deployment → Logs
   - CLI: `vercel logs`

2. **Monitor Performance**
   - Go to your project dashboard
   - Check "Analytics" tab for request metrics
   - Check "Speed Insights" for performance data

## Troubleshooting

### Build Failures

1. **Check build logs** in Vercel dashboard
2. **Verify package.json** has all dependencies
3. **Check Node.js version** compatibility (requires Node 18+)

### Runtime Errors

1. **Check deployment logs** for errors
2. **Verify environment variables** are set correctly
3. **Test locally** with `vercel dev`

### Socket.io Connection Issues

1. **Verify CORS configuration** in server.js
2. **Check client Socket.io version** matches server
3. **Use WSS protocol** for HTTPS connections

### Environment Variable Issues

- Redeploy after changing environment variables
- Use double quotes for multiline values (like private keys)
- Escape special characters properly

## Local Development with Vercel

Test your Vercel deployment locally:

```bash
vercel dev
```

This simulates the Vercel environment on your local machine.

## Scaling Considerations

**Vercel Free Tier Limits:**
- 100 GB bandwidth/month
- 100 hours serverless function execution/month
- 12 serverless functions per deployment

**For Production:**
- Consider upgrading to Pro plan for higher limits
- Use Redis for session storage across serverless instances
- Implement rate limiting for API endpoints

## Migrating from DigitalOcean

If migrating from DigitalOcean App Platform:

1. **Keep both deployments** running initially
2. **Update frontend** to point to Vercel URL
3. **Test thoroughly** with real users
4. **Monitor logs** for any issues
5. **Shut down DigitalOcean** app once verified

## Cost Comparison

**Vercel Free Tier:**
- Generous free tier for hobby projects
- Automatic scaling
- Global CDN
- Zero configuration

**DigitalOcean:**
- More predictable pricing
- Better for long-running processes
- More control over infrastructure

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [GitHub Issues](https://github.com/JesterInvestor/Comment-Clash/issues)

## Next Steps

After successful deployment:

1. ✅ Update frontend `app.json` with Vercel URL
2. ✅ Test game flow end-to-end
3. ✅ Configure Firebase for persistence
4. ✅ Add Redis for better performance
5. ✅ Set up monitoring and alerts
6. ✅ Configure custom domain (optional)
7. ✅ Set up production environment variables
8. ✅ Enable Vercel Analytics

---

**Ready to deploy!** 🚀

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let s3Client = null;

function initializeSpaces() {
  if (process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET) {
    s3Client = new S3Client({
      endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`,
      region: process.env.DO_SPACES_REGION || 'nyc3',
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET
      }
    });
    console.log('DigitalOcean Spaces initialized successfully');
  } else {
    console.warn('DigitalOcean Spaces credentials not provided');
  }
}

// Sample video library - in production this would query actual videos from Spaces
const sampleVideos = [
  { id: 'video_1', filename: 'funny_cat.mp4', duration: 10 },
  { id: 'video_2', filename: 'epic_fail.mp4', duration: 8 },
  { id: 'video_3', filename: 'dance_move.mp4', duration: 12 },
  { id: 'video_4', filename: 'unexpected.mp4', duration: 9 },
  { id: 'video_5', filename: 'wholesome.mp4', duration: 11 },
  { id: 'video_6', filename: 'sports_fail.mp4', duration: 7 },
  { id: 'video_7', filename: 'animal_antics.mp4', duration: 10 },
  { id: 'video_8', filename: 'plot_twist.mp4', duration: 15 },
  { id: 'video_9', filename: 'life_hack.mp4', duration: 13 },
  { id: 'video_10', filename: 'reaction.mp4', duration: 6 }
];

async function getRandomVideo() {
  const video = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
  
  // In production, generate signed URL from DigitalOcean Spaces
  if (s3Client && process.env.DO_SPACES_BUCKET) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: video.filename
      });
      
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return {
        ...video,
        url
      };
    } catch (error) {
      console.error('Error generating signed URL:', error);
    }
  }
  
  // Fallback to placeholder URL
  return {
    ...video,
    url: `https://example.com/videos/${video.filename}`
  };
}

async function getVideosByPack(packId) {
  // Placeholder for premium content packs
  return sampleVideos.slice(0, 5);
}

module.exports = {
  initializeSpaces,
  getRandomVideo,
  getVideosByPack
};

// Initialize on module load
initializeSpaces();

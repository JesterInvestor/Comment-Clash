const redis = require('redis');

let client = null;

async function initializeRedis() {
  try {
    if (process.env.REDIS_URL) {
      client = redis.createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD || undefined
      });

      client.on('error', (err) => console.error('Redis Client Error:', err));
      client.on('connect', () => console.log('Redis connected successfully'));

      await client.connect();
    } else {
      console.warn('Redis URL not provided, running without caching');
    }
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
  }
}

function getRedisClient() {
  return client;
}

module.exports = {
  initializeRedis,
  getRedisClient
};

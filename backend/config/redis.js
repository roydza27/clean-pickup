const Redis = require('ioredis');
const logger = require('../shared/utils/logger');

let redisClient;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          return null; // stop retrying
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });
  }
  return redisClient;
}

module.exports = { getRedisClient };

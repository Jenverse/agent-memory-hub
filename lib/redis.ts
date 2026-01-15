// Redis client using ioredis for standard Redis compatibility
import Redis from 'ioredis';
import type { ServiceConfig } from './types';

let redis: RedisWrapper | null = null;

// Global Redis client for storing service configurations
export function getRedisClient(): RedisWrapper {
  if (!redis) {
    const url = process.env.REDIS_URL;

    if (!url) {
      throw new Error(
        'Missing Redis credentials. Please set REDIS_URL environment variable.'
      );
    }

    const client = new Redis(url);
    redis = new RedisWrapper(client);
  }

  return redis;
}

// Create a Redis client for a specific service using its configured credentials
// This is where ALL memory data (short-term + long-term) for that service is stored
export function getServiceRedisClient(serviceConfig: ServiceConfig): RedisWrapper {
  const url = serviceConfig.redisUrl;

  if (!url) {
    throw new Error(
      `Service ${serviceConfig.id} does not have Redis URL configured. Please set redisUrl in the service configuration.`
    );
  }

  const client = new Redis(url);
  return new RedisWrapper(client);
}

// Wrapper class to provide Upstash-like API with ioredis
export class RedisWrapper {
  constructor(private client: Redis) {}

  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set(key: string, value: any): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.set(key, serialized);
  }

  async rpush(key: string, ...values: any[]): Promise<number> {
    const serialized = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
    return await this.client.rpush(key, ...serialized);
  }

  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    const values = await this.client.lrange(key, start, stop);
    return values.map(v => {
      try {
        return JSON.parse(v) as T;
      } catch {
        return v as T;
      }
    });
  }

  async hset(key: string, data: Record<string, any>): Promise<void> {
    const serialized: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      serialized[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    await this.client.hset(key, serialized);
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    const data = await this.client.hgetall(key);
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      try {
        result[k] = JSON.parse(v);
      } catch {
        result[k] = v;
      }
    }
    return result;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return await this.client.sadd(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return await this.client.srem(key, ...members);
  }
}

// Redis key patterns
export const RedisKeys = {
  serviceConfig: (serviceId: string) => `service_config:${serviceId}`,
  sessionMessages: (sessionId: string) => `session:${sessionId}:messages`,
  sessionMetadata: (sessionId: string) => `session:${sessionId}:metadata`,
  userBucket: (userId: string, serviceId: string, bucketName: string) =>
    `user:${userId}:service:${serviceId}:bucket:${bucketName}`,
  allServices: () => 'services:all',
};


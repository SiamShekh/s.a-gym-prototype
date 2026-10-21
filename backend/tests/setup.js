import '../src/polyfills.js';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../src/db/connection.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'test-jwt-secret';
  await connectDb(mongoServer.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await disconnectDb();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

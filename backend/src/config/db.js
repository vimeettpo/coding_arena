const mongoose = require('mongoose');
const env = require('./env');
const dns = require('dns');

// Ensure public DNS servers (Google / Cloudflare) are configured to resolve MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_err) {
  // Fallback gracefully if setServers is unavailable
}


let connectionPromise = null;

async function seedDefaultProblems() {
  try {
    const Problem = require('../models/Problem');
    const TestCase = require('../models/TestCase');
    const count = await Problem.countDocuments();
    if (count > 0) return;

    console.log('Seeding default coding problems into MongoDB...');
    const p1 = await Problem.create({
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'EASY',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]',
      constraints: '2 <= nums.length <= 10^4',
      tags: ['Array', 'Hash Map'],
      hints: ['Check target - num for each number.'],
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      published: true,
      createdById: 'system',
    });

    await TestCase.create({
      problemId: p1._id,
      input: 'nums = [2,7,11,15], target = 9',
      expectedOutput: '[0,1]',
      hidden: false,
    });

    const p2 = await Problem.create({
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      difficulty: 'EASY',
      description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n\nExample:\nInput: s = "()[]{}"\nOutput: true',
      constraints: '1 <= s.length <= 10^4',
      tags: ['Stack', 'String'],
      hints: ['Use a stack data structure.'],
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      published: true,
      createdById: 'system',
    });

    await TestCase.create({
      problemId: p2._id,
      input: 's = "()[]{}"',
      expectedOutput: 'true',
      hidden: false,
    });

    const p3 = await Problem.create({
      title: 'Longest Substring Without Repeating Characters',
      slug: 'longest-substring',
      difficulty: 'MEDIUM',
      description: 'Given a string s, find the length of the longest substring without repeating characters.\n\nExample:\nInput: s = "abcabcbb"\nOutput: 3',
      constraints: '0 <= s.length <= 5 * 10^4',
      tags: ['String', 'Sliding Window'],
      hints: ['Use a sliding window approach.'],
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      published: true,
      createdById: 'system',
    });

    await TestCase.create({
      problemId: p3._id,
      input: 's = "abcabcbb"',
      expectedOutput: '3',
      hidden: false,
    });

    console.log('Seeded 3 default coding problems successfully!');
  } catch (err) {
    console.warn('Seeding problems skipped:', err.message);
  }
}

/**
 * Reuses a single connection across invocations — important on serverless
 * platforms (Vercel) where the module can be re-entered on a warm lambda
 * without a fresh cold start.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!connectionPromise) {
    if (!env.mongodbUri) {
      throw new Error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
    }
    mongoose.set('strictQuery', true);

    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    } catch (_e) {}

    connectionPromise = mongoose.connect(env.mongodbUri, {
      maxPoolSize: 10,
    }).catch(async (err) => {
      if (err.message && (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED'))) {
        try {
          dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
          return await mongoose.connect(env.mongodbUri, { maxPoolSize: 10 });
        } catch (retryErr) {
          throw retryErr;
        }
      }
      throw err;
    });
  }
  await connectionPromise;
  seedDefaultProblems().catch(() => {});
  return mongoose.connection;
}

module.exports = { connectDB };

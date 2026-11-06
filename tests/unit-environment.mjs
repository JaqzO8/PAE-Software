// Loaded before each Node test worker; production services never use this adapter.
import { randomBytes } from 'node:crypto';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= randomBytes(48).toString('hex');

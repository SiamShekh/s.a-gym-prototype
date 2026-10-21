/**
 * MongoDB driver 7 / Mongoose 9 call globalThis.crypto.getRandomValues.
 * That global exists on Node 19+, but some hosts still run Node 18.
 * Ensure Web Crypto is available before any DB connect.
 */
import { webcrypto } from 'node:crypto';

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
}

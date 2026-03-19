/**
 * Tests unitaires pour la logique d'authentification.
 * Exécution: node --test test/auth.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';

describe('JWT Auth', () => {
  const secret = 'test-secret-for-unit-tests-only-min-64-chars-required-here';
  it('crée et vérifie un token valide', () => {
    const token = jwt.sign({ userId: 'test123' }, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.userId, 'test123');
  });
  it('rejette un token avec un mauvais secret', () => {
    const token = jwt.sign({ userId: 'test123' }, secret, { expiresIn: '1h' });
    assert.throws(() => jwt.verify(token, 'wrong-secret'), /invalid signature/);
  });
});

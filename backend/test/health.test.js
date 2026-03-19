/**
 * Tests basiques pour les routes critiques.
 * Exécution: node --test test/health.test.js
 * Ou: npm test (si configuré)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';

// Test du health endpoint (nécessite le serveur démarré)
describe('API Health', () => {
  it('GET /api/health retourne 200', async () => {
    const base = process.env.TEST_BASE_URL || 'http://localhost:3001';
    const res = await fetch(`${base}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
  });
});

import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requestIdMiddleware } from '../src/middleware.js';

describe('requestIdMiddleware', () => {
  it('generates a request ID when X-Request-ID is missing', async () => {
    const app = express();
    app.use(requestIdMiddleware());
    app.get('/test', (req, res) => {
      res.json({ id: req.id });
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(typeof res.body.id).toBe('string');
    expect(res.body.id.length).toBeGreaterThan(5);
  });

  it('preserves existing X-Request-ID header', async () => {
    const app = express();
    app.use(requestIdMiddleware());
    app.get('/test', (req, res) => {
      res.json({ id: req.id });
    });

    const res = await request(app)
      .get('/test')
      .set('X-Request-ID', 'my-custom-id');

    expect(res.body.id).toBe('my-custom-id');
  });

  it('generates unique IDs for concurrent requests', async () => {
    const app = express();
    app.use(requestIdMiddleware());
    app.get('/test', (req, res) => {
      res.json({ id: req.id });
    });

    const ids = await Promise.all([
      request(app).get('/test').then((r) => r.body.id),
      request(app).get('/test').then((r) => r.body.id),
      request(app).get('/test').then((r) => r.body.id),
    ]);

    const unique = new Set(ids);
    expect(unique.size).toBe(3);
  });
});

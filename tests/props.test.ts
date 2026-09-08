import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { inertia, lazy, always, defer, merge, optional } from '../src/index.js';

describe('Inertia Props Resolution', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(inertia());
  });

  it('resolves async functions, promises, and simple values on standard load', async () => {
    app.get('/async-props', (req, res) => {
      res.inertia('TestComponent', {
        syncValue: 'hello',
        asyncValue: async () => 'world',
        promiseValue: Promise.resolve(42),
        closureWithReq: (r: any) => `Path: ${r.path}`,
      });
    });

    const res = await request(app)
      .get('/async-props')
      .set('X-Inertia', 'true');

    expect(res.body.props).toEqual({
      syncValue: 'hello',
      asyncValue: 'world',
      promiseValue: 42,
      closureWithReq: 'Path: /async-props',
    });
  });

  it('omits lazy props on first load and evaluates them only on partial reload', async () => {
    let heavyEvaluated = false;

    app.get('/lazy-props', (req, res) => {
      heavyEvaluated = false;
      res.inertia('Users/Index', {
        standardProp: 'always here',
        heavyProp: lazy(() => {
          heavyEvaluated = true;
          return { data: [1, 2, 3] };
        }),
      });
    });

    // 1. Initial Inertia Request -> heavyProp is omitted and NOT evaluated
    const fullRes = await request(app)
      .get('/lazy-props')
      .set('X-Inertia', 'true');

    expect(fullRes.body.props).toEqual({
      standardProp: 'always here',
    });
    expect(heavyEvaluated).toBe(false);

    // 2. Partial Reload -> requesting only 'heavyProp'
    const partialRes = await request(app)
      .get('/lazy-props')
      .set('X-Inertia', 'true')
      .set('X-Inertia-Partial-Component', 'Users/Index')
      .set('X-Inertia-Partial-Data', 'heavyProp');

    expect(partialRes.body.props).toEqual({
      heavyProp: { data: [1, 2, 3] },
    });
    expect(heavyEvaluated).toBe(true);
  });

  it('always includes always() props even during partial reloads', async () => {
    app.get('/always-props', (req, res) => {
      res.inertia('Dashboard', {
        normalA: 'valueA',
        normalB: 'valueB',
        user: always({ name: 'Admin' }),
      });
    });

    // Partial reload requesting only 'normalA' -> 'user' should still be included!
    const res = await request(app)
      .get('/always-props')
      .set('X-Inertia', 'true')
      .set('X-Inertia-Partial-Component', 'Dashboard')
      .set('X-Inertia-Partial-Data', 'normalA');

    expect(res.body.props).toEqual({
      normalA: 'valueA',
      user: { name: 'Admin' },
    });
  });

  it('collects deferred and merge props in page metadata', async () => {
    app.get('/v2-props', (req, res) => {
      res.inertia('Feed', {
        items: merge([1, 2, 3]),
        chartData: defer(() => ({ chart: [] }), { group: 'analytics' }),
      });
    });

    const res = await request(app)
      .get('/v2-props')
      .set('X-Inertia', 'true');

    expect(res.body.props.items).toEqual([1, 2, 3]);
    expect(res.body.mergeProps).toEqual(['items']);
    expect(res.body.deferredProps).toEqual({
      analytics: ['chartData'],
    });
  });

  it('includes optional props on first load', async () => {
    app.get('/optional-props', (req, res) => {
      res.inertia('Settings', {
        theme: 'dark',
        extraSetting: optional(() => 'custom'),
      });
    });

    const res = await request(app)
      .get('/optional-props')
      .set('X-Inertia', 'true');

    expect(res.body.props).toEqual({
      theme: 'dark',
      extraSetting: 'custom',
    });
  });
});

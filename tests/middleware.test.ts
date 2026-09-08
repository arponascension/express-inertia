import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { inertia } from '../src/index.js';
import { createInertiaEngine } from '../src/engine.js';
import path from 'path';
import fs from 'fs';

describe('express-inertia Middleware', () => {
  let app: express.Express;
  const tempPublicDir = path.join(__dirname, 'temp_vite_middleware');
  const tempHotFile = path.join(tempPublicDir, 'hot');

  beforeEach(() => {
    fs.mkdirSync(tempPublicDir, { recursive: true });
    fs.writeFileSync(tempHotFile, 'http://localhost:5173\n');

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Set up EJS engine with Blade directives
    app.engine(
      'ejs',
      createInertiaEngine({
        cache: false,
        vite: { publicDir: tempPublicDir, hotFile: tempHotFile, isDev: true },
      })
    );
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
  });

  afterAll(() => {
    fs.rmSync(tempPublicDir, { recursive: true, force: true });
  });

  it('renders initial full HTML page with @inertia and serialized data-page', async () => {
    app.use(
      inertia({
        rootView: 'app.ejs',
        version: '1.0.0',
        shared: {
          appName: 'My Express Inertia App',
        },
      })
    );

    app.get('/', (req, res) => {
      res.inertia('Home', { user: 'Alice' });
    });

    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('id="app"');
    expect(res.text).toContain('data-page="app"');
    expect(res.text).toContain('"component":"Home"');
    expect(res.text).toContain('"appName":"My Express Inertia App"');
    expect(res.text).toContain('"user":"Alice"');
  });

  it('returns JSON response for Inertia AJAX requests with X-Inertia header', async () => {
    app.use(
      inertia({
        version: '1.0.0',
        shared: (req) => ({ authUser: 'Bob' }),
      })
    );

    app.get('/users', (req, res) => {
      res.inertia('Users/Index', {
        users: [{ id: 1, name: 'Bob' }],
      });
    });

    const res = await request(app)
      .get('/users')
      .set('X-Inertia', 'true')
      .set('X-Inertia-Version', '1.0.0');

    expect(res.status).toBe(200);
    expect(res.headers['x-inertia']).toBe('true');
    expect(res.headers['vary']).toBe('Accept, X-Inertia');
    expect(res.body).toEqual({
      component: 'Users/Index',
      props: {
        authUser: 'Bob',
        users: [{ id: 1, name: 'Bob' }],
      },
      url: '/users',
      version: '1.0.0',
    });
  });

  it('responds with 409 Conflict when asset version mismatches on GET request', async () => {
    app.use(
      inertia({
        version: '2.0.0',
      })
    );

    app.get('/dashboard', (req, res) => {
      res.inertia('Dashboard');
    });

    const res = await request(app)
      .get('/dashboard')
      .set('X-Inertia', 'true')
      .set('X-Inertia-Version', '1.0.0');

    expect(res.status).toBe(409);
    expect(res.headers['x-inertia-location']).toBe('/dashboard');
  });

  it('automatically converts 301/302 redirects to 303 for PUT/PATCH/DELETE methods', async () => {
    app.use(inertia());

    app.put('/users/1', (req, res) => {
      res.redirect('/users');
    });

    app.delete('/users/1', (req, res) => {
      res.redirect(302, '/users');
    });

    const putRes = await request(app)
      .put('/users/1')
      .set('X-Inertia', 'true');
    expect(putRes.status).toBe(303);
    expect(putRes.headers.location).toBe('/users');

    const delRes = await request(app)
      .delete('/users/1')
      .set('X-Inertia', 'true');
    expect(delRes.status).toBe(303);
    expect(delRes.headers.location).toBe('/users');
  });

  it('supports res.inertia.location for external or full reloads', async () => {
    app.use(inertia());

    app.get('/external', (req, res) => {
      res.inertia.location('https://example.com/checkout');
    });

    // Inertia request -> 409 + X-Inertia-Location
    const inertiaRes = await request(app)
      .get('/external')
      .set('X-Inertia', 'true');
    expect(inertiaRes.status).toBe(409);
    expect(inertiaRes.headers['x-inertia-location']).toBe('https://example.com/checkout');

    // Standard browser request -> 302 redirect
    const normalRes = await request(app).get('/external');
    expect(normalRes.status).toBe(302);
    expect(normalRes.headers.location).toBe('https://example.com/checkout');
  });

  it('supports res.inertia.back() redirect with 303', async () => {
    app.use(inertia());

    app.post('/form', (req, res) => {
      res.inertia.back('/fallback');
    });

    const res = await request(app)
      .post('/form')
      .set('Referer', '/previous-page');
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe('/previous-page');
  });

  it('supports res.inertia.share() and getShared() on request level', async () => {
    app.use(
      inertia({
        shared: { globalKey: 'globalVal' },
      })
    );

    app.get('/shared-test', (req, res) => {
      res.inertia.share('requestKey', 'requestVal');
      res.inertia.share({ multiKey: 123 });
      expect(res.inertia.getShared('requestKey')).toBe('requestVal');
      expect(res.inertia.getShared('globalKey')).toBe('globalVal');
      res.inertia('TestComponent');
    });

    const res = await request(app)
      .get('/shared-test')
      .set('X-Inertia', 'true');

    expect(res.body.props).toEqual({
      globalKey: 'globalVal',
      requestKey: 'requestVal',
      multiKey: 123,
    });
  });

  it('handles Inertia v2 history encryption and clearHistory settings', async () => {
    app.use(inertia());

    app.get('/history-test', (req, res) => {
      res.inertia.encryptHistory(true);
      res.inertia.clearHistory(true);
      res.inertia('SecretPage');
    });

    const res = await request(app)
      .get('/history-test')
      .set('X-Inertia', 'true');

    expect(res.headers['x-inertia-encrypt-history']).toBe('true');
    expect(res.headers['x-inertia-clear-history']).toBe('true');
    expect(res.body.encryptHistory).toBe(true);
    expect(res.body.clearHistory).toBe(true);
  });

  it('rejects Inertia requests with malicious component names', async () => {
    app.use(
      inertia({
        security: { validateComponentNames: true },
      })
    );

    app.get('/evil', (req, res) => {
      res.inertia('../../../etc/passwd');
    });

    const res = await request(app)
      .get('/evil')
      .set('X-Inertia', 'true')
      .set('X-Inertia-Partial-Component', '../../../etc/passwd');

    expect(res.status).toBe(409);
    expect(res.headers['x-inertia-location']).toBe('/evil');
  });

  it('allows safe component names with slashes', async () => {
    app.use(
      inertia({
        security: { validateComponentNames: true },
      })
    );

    app.get('/safe', (req, res) => {
      res.inertia('Users/Profile-View');
    });

    const res = await request(app)
      .get('/safe')
      .set('X-Inertia', 'true');

    expect(res.status).toBe(200);
    expect(res.body.component).toBe('Users/Profile-View');
  });

  it('allows disabling component name validation', async () => {
    app.use(
      inertia({
        security: { validateComponentNames: false },
      })
    );

    app.get('/raw', (req, res) => {
      res.inertia('../../../etc/passwd');
    });

    const res = await request(app)
      .get('/raw')
      .set('X-Inertia', 'true');

    expect(res.status).toBe(200);
    expect(res.body.component).toBe('../../../etc/passwd');
  });
});

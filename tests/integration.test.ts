import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { inertia, createInertiaEngine, createViteHelper } from '../src/index.js';
import path from 'path';
import fs from 'fs';

describe('Integration Tests', () => {
  const testDir = path.join(__dirname, 'temp_integration');
  const publicDir = path.join(testDir, 'public');
  const buildDir = path.join(publicDir, 'build');
  const manifestDir = path.join(buildDir, '.vite');

  beforeEach(() => {
    fs.mkdirSync(manifestDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('Vite HMR Integration', () => {
    it('renders HMR client script when hot file exists', async () => {
      const hotFile = path.join(publicDir, 'hot');
      fs.writeFileSync(hotFile, 'http://localhost:5173\n');

      const app = express();
      app.engine(
        'ejs',
        createInertiaEngine({
          cache: false,
          vite: { publicDir, hotFile, isDev: true },
        })
      );
      app.set('view engine', 'ejs');
      app.set('views', path.join(__dirname, 'views'));
      app.use(inertia({ rootView: 'app.ejs' }));

      app.get('/', (req, res) => {
        res.inertia('Home', { title: 'Welcome' });
      });

      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('http://localhost:5173/@vite/client');
      expect(res.text).toContain('"component":"Home"');
    });

    it('renders production assets when hot file is absent', async () => {
      const manifestPath = path.join(manifestDir, 'manifest.json');
      const mockManifest = {
        'src/app.js': {
          file: 'assets/app.abc1234.js',
          src: 'src/app.js',
          css: ['assets/app.abc1234.css'],
        },
      };
      fs.writeFileSync(manifestPath, JSON.stringify(mockManifest));

      const app = express();
      app.engine(
        'ejs',
        createInertiaEngine({
          cache: false,
          vite: { publicDir, buildDir: 'build', base: '/build/' },
        })
      );
      app.set('view engine', 'ejs');
      app.set('views', path.join(__dirname, 'views'));
      app.use(inertia({ rootView: 'app.ejs' }));

      app.get('/', (req, res) => {
        res.inertia('Home', { title: 'Welcome' });
      });

      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('src="/build/assets/app.abc1234.js"');
      expect(res.text).toContain('href="/build/assets/app.abc1234.css"');
    });
  });

  describe('Circular Reference Handling', () => {
    it('serializes circular props without crashing', async () => {
      const app = express();
      app.use(inertia());

      const circular: any = { name: 'Alice' };
      circular.self = circular;

      app.get('/circular', (req, res) => {
        res.inertia('Profile', { user: circular });
      });

      const res = await request(app)
        .get('/circular')
        .set('X-Inertia', 'true');

      expect(res.status).toBe(200);
      expect(res.body.props.user.name).toBe('Alice');
      expect(res.body.props.user.self).toBeNull();
    });

    it('handles nested circular references in shared props', async () => {
      const app = express();
      app.use(
        inertia({
          shared: {
            app: {} as any,
          },
        })
      );

      const circular: any = { name: 'App' };
      circular.config = circular;

      app.get('/nested-circular', (req, res) => {
        res.inertia('Dashboard', { data: circular });
      });

      const res = await request(app)
        .get('/nested-circular')
        .set('X-Inertia', 'true');

      expect(res.status).toBe(200);
      expect(res.body.props.data.name).toBe('App');
      expect(res.body.props.data.config).toBeNull();
    });
  });

  describe('High Concurrency', () => {
    it('handles 100 concurrent Inertia requests without crashing', async () => {
      const app = express();
      app.use(inertia());

      app.get('/concurrent', (req, res) => {
        res.inertia('Home', { timestamp: Date.now() });
      });

      const requests = Array.from({ length: 100 }, () =>
        request(app).get('/concurrent').set('X-Inertia', 'true')
      );

      const responses = await Promise.all(requests);

      expect(responses.length).toBe(100);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.component).toBe('Home');
        expect(res.body.props.timestamp).toBeDefined();
      }
    });
  });
});

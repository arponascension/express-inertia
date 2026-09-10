import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createViteHelper, inertiaVitePlugin } from '../src/vite.js';
import fs from 'fs';
import path from 'path';

describe('Vite Integration Helper', () => {
  const testDir = path.join(__dirname, 'temp_vite');
  const publicDir = path.join(testDir, 'public');
  const buildDir = path.join(publicDir, 'build');
  const manifestDir = path.join(buildDir, '.vite');

  beforeEach(() => {
    fs.mkdirSync(manifestDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('renders development tags when hot file exists', () => {
    const hotFile = path.join(publicDir, 'hot');
    fs.writeFileSync(hotFile, 'http://localhost:5173\n');

    const helper = createViteHelper({
      publicDir,
      hotFile,
      devServerUrl: 'http://localhost:5173',
    });

    expect(helper.isDev()).toBe(true);

    const tags = helper.renderTags('src/main.ts');
    expect(tags).toContain('<script type="module" src="http://localhost:5173/@vite/client"></script>');
    expect(tags).toContain('<script type="module" src="http://localhost:5173/src/main.ts"></script>');

    const refresh = helper.renderReactRefresh();
    expect(refresh).toContain('import RefreshRuntime from "http://localhost:5173/@react-refresh";');
  });

  it('renders production tags from manifest.json without NODE_ENV', () => {
    const manifestPath = path.join(manifestDir, 'manifest.json');
    const mockManifest = {
      'src/main.ts': {
        file: 'assets/main.abc1234.js',
        src: 'src/main.ts',
        isEntry: true,
        css: ['assets/main.abc1234.css'],
        imports: ['_vendor.def5678.js'],
      },
      '_vendor.def5678.js': {
        file: 'assets/_vendor.def5678.js',
      },
    };

    fs.writeFileSync(manifestPath, JSON.stringify(mockManifest));

    const helper = createViteHelper({
      publicDir,
      manifestPath,
      base: '/build/',
    });

    expect(helper.isDev()).toBe(false);

    const tags = helper.renderTags('src/main.ts');
    expect(tags).toContain('<link rel="stylesheet" href="/build/assets/main.abc1234.css">');
    expect(tags).toContain('<script type="module" src="/build/assets/main.abc1234.js"></script>');
    expect(tags).toContain('<link rel="modulepreload" href="/build/assets/_vendor.def5678.js">');

    // React refresh should return empty in production
    const refresh = helper.renderReactRefresh();
    expect(refresh).toBe('');
  });

  it('auto-detects manifestPath and base from an absolute publicDir and buildDir', () => {
    const manifestPath = path.join(manifestDir, 'manifest.json');
    const mockManifest = {
      'src/main.ts': {
        file: 'assets/main.abc1234.js',
        src: 'src/main.ts',
        isEntry: true,
        css: ['assets/main.abc1234.css'],
      },
    };
    fs.writeFileSync(manifestPath, JSON.stringify(mockManifest));

    const helper = createViteHelper({
      publicDir,
      buildDir: 'build',
    });

    expect(helper.isDev()).toBe(false);

    const tags = helper.renderTags('src/main.ts');
    expect(tags).toContain('<link rel="stylesheet" href="/build/assets/main.abc1234.css">');
    expect(tags).toContain('<script type="module" src="/build/assets/main.abc1234.js"></script>');
  });

  it('detects the dev hot file inside an absolute publicDir', () => {
    fs.writeFileSync(path.join(publicDir, 'hot'), 'http://localhost:5173\n');

    const helper = createViteHelper({
      publicDir,
      buildDir: 'build',
    });

    expect(helper.isDev()).toBe(true);
  });

  it('prefers dev mode when hot file exists even if a manifest is present', () => {
    const manifestPath = path.join(manifestDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify({ 'src/main.ts': { file: 'assets/main.js' } }));

    const hotFile = path.join(publicDir, 'hot');
    fs.writeFileSync(hotFile, 'http://localhost:5173\n');

    const helper = createViteHelper({
      publicDir,
      hotFile,
      manifestPath,
      base: '/build/',
    });

    expect(helper.isDev()).toBe(true);

    const tags = helper.renderTags('src/main.ts');
    expect(tags).toContain('<script type="module" src="http://localhost:5173/src/main.ts"></script>');
    expect(tags).not.toContain('/build/assets/main.js');
  });

  it('honours an explicit isDev flag over an existing hot file', () => {
    fs.writeFileSync(path.join(publicDir, 'hot'), 'http://localhost:5173\n');

    const helper = createViteHelper({
      publicDir,
      isDev: false,
    });

    expect(helper.isDev()).toBe(false);
  });
});

describe('inertiaVitePlugin', () => {
  const testDir = path.join(__dirname, 'temp_plugin');
  const hotFile = path.join(testDir, 'public', 'hot');
  const root = testDir;

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('writes the hot file in dev mode with the resolved dev server URL', () => {
    const plugin = inertiaVitePlugin({ hotFile: 'public/hot' });

    plugin.configResolved?.({
      command: 'serve',
      root,
      server: { port: 5173, host: 'localhost', https: false },
    });

    expect(fs.existsSync(hotFile)).toBe(true);
    expect(fs.readFileSync(hotFile, 'utf-8')).toBe('http://localhost:5173');
  });

  it('writes a custom devServerUrl override', () => {
    const plugin = inertiaVitePlugin({ hotFile: 'public/hot', devServerUrl: 'https://dev.example.com/' });

    plugin.configResolved?.({
      command: 'serve',
      root,
      server: { port: 5173, host: 'localhost', https: false },
    });

    expect(fs.readFileSync(hotFile, 'utf-8')).toBe('https://dev.example.com');
  });

  it('removes a stale hot file when running a build', () => {
    fs.mkdirSync(path.dirname(hotFile), { recursive: true });
    fs.writeFileSync(hotFile, 'http://localhost:5173');

    const plugin = inertiaVitePlugin({ hotFile: 'public/hot' });
    plugin.configResolved?.({ command: 'build', root, server: {} });

    expect(fs.existsSync(hotFile)).toBe(false);
  });

  it('configureServer writes the hot file and reacts to listening/close events', () => {
    let listeningCb: () => void = () => {};
    let closeCb: () => void = () => {};
    const httpServer = {
      once: (_event: string, cb: () => void) => {
        listeningCb = cb;
      },
      on: (event: string, cb: () => void) => {
        if (event === 'close') closeCb = cb;
      },
    };

    const server = {
      config: { root, server: { port: 3000, host: 'localhost', https: false } },
      resolvedUrls: { local: ['http://127.0.0.1:3000'] },
      httpServer,
    };

    const plugin = inertiaVitePlugin({ hotFile: 'public/hot' });
    plugin.configureServer?.(server as any);

    expect(fs.existsSync(hotFile)).toBe(true);
    expect(fs.readFileSync(hotFile, 'utf-8')).toBe('http://127.0.0.1:3000');

    // Simulate the dev server actually listening (rewrites the hot file).
    listeningCb();
    expect(fs.readFileSync(hotFile, 'utf-8')).toBe('http://127.0.0.1:3000');

    // Simulate the dev server shutting down (removes the hot file).
    closeCb();
    expect(fs.existsSync(hotFile)).toBe(false);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPrefetchHelper, PrefetchHelper } from '../src/prefetch.js';
import { createViteHelper } from '../src/vite.js';
import fs from 'fs';
import path from 'path';

describe('Prefetch Helper', () => {
  const testDir = path.join(__dirname, 'temp_prefetch');
  const publicDir = path.join(testDir, 'public');
  const buildDir = path.join(publicDir, 'build');
  const manifestDir = path.join(buildDir, '.vite');

  beforeEach(() => {
    fs.mkdirSync(manifestDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  function createHelper(manifest: Record<string, any>, isDev = false) {
    const helper = createPrefetchHelper(
      createViteHelper({
        publicDir,
        buildDir: 'build',
        hotFile: isDev ? path.join(publicDir, 'hot') : undefined,
        isDev,
        manifest: isDev ? undefined : manifest,
      })
    );

    if (isDev) {
      fs.writeFileSync(path.join(publicDir, 'hot'), 'http://localhost:5173\n');
    }

    return helper;
  }

  it('generates prefetch tags in dev mode', () => {
    const helper = createHelper({}, true);
    const tags = helper.prefetch('src/main.ts');

    expect(tags).toContain('rel="prefetch"');
    expect(tags).toContain('href="http://localhost:5173/src/main.ts"');
  });

  it('generates preload tags when mode is preload', () => {
    const helper = createHelper({}, true);
    const tags = helper.prefetch('src/main.ts', { mode: 'preload' });

    expect(tags).toContain('rel="preload"');
  });

  it('resolves manifest entries in production', () => {
    const manifest = {
      'src/main.ts': {
        file: 'assets/main.abc1234.js',
        src: 'src/main.ts',
        css: ['assets/main.abc1234.css'],
        imports: ['_vendor.def5678.js'],
      },
      '_vendor.def5678.js': {
        file: 'assets/_vendor.def5678.js',
      },
    };

    const helper = createHelper(manifest);
    const tags = helper.prefetch('src/main.ts');

    expect(tags).toContain('rel="prefetch"');
    expect(tags).toContain('href="/build/assets/main.abc1234.js"');
    expect(tags).toContain('href="/build/assets/main.abc1234.css"');
    expect(tags).toContain('href="/build/assets/_vendor.def5678.js"');
  });

  it('deduplicates assets', () => {
    const manifest = {
      'src/main.ts': {
        file: 'assets/main.abc1234.js',
        css: ['assets/main.abc1234.css'],
      },
    };

    const helper = createHelper(manifest);
    const tags = helper.prefetch(['src/main.ts', 'src/main.ts']);

    const matches = tags.match(/href="\/build\/assets\/main\.abc1234\.js"/g) || [];
    expect(matches.length).toBe(1);
  });

  it('adds crossorigin when requested', () => {
    const helper = createHelper({}, true);
    const tags = helper.prefetch('src/main.ts', { crossorigin: true });

    expect(tags).toContain('crossorigin');
  });

  it('handles array entrypoints', () => {
    const helper = createHelper({}, true);
    const tags = helper.prefetch(['src/main.ts', 'src/style.css']);

    expect(tags).toContain('href="http://localhost:5173/src/main.ts"');
    expect(tags).toContain('href="http://localhost:5173/src/style.css"');
  });
});

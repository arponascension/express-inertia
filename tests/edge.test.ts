import { describe, it, expect } from 'vitest';
import path from 'path';
import { createViteHelper } from '../src/vite.js';

describe('Edge-compatible ViteHelper', () => {
  it('uses injected manifest without fs access', () => {
    const manifest = {
      'src/main.ts': {
        file: 'assets/main.abc1234.js',
        src: 'src/main.ts',
        css: ['assets/main.abc1234.css'],
      },
    };

    const helper = createViteHelper({
      manifest,
      base: '/build/',
      isDev: false,
    });

    expect(helper.isDev()).toBe(false);
    expect(helper.manifestExists()).toBe(true);
    const tags = helper.renderTags('src/main.ts');
    expect(tags).toContain('src="/build/assets/main.abc1234.js"');
    expect(tags).toContain('href="/build/assets/main.abc1234.css"');
  });

  it('uses injected isDev flag without hot file', () => {
    const helper = createViteHelper({
      isDev: true,
      devServerUrlOverride: 'https://dev.example.com',
    });

    expect(helper.isDev()).toBe(true);
    expect(helper.getDevServerUrl()).toBe('https://dev.example.com');
    const tags = helper.renderTags('src/main.ts');
    expect(tags).toContain('src="https://dev.example.com/src/main.ts"');
  });

  it('falls back to fs when manifest not injected', () => {
    const helper = createViteHelper({
      publicDir: path.join(__dirname, 'temp_edge_empty'),
      buildDir: 'build',
      isDev: false,
    });

    expect(helper.manifestExists()).toBe(false);
  });
});

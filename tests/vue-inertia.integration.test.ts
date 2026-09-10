import { beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { always, createInertiaEngine, inertia, lazy } from '../src/index.js';

const run = promisify(execFile);
const fixture = path.resolve('tests/temp_vue_inertia_client');
const publicDir = path.join(fixture, 'public');
const buildDir = path.join(publicDir, 'build');
const manifestPath = path.join(buildDir, '.vite', 'manifest.json');

function fixtureBuildIsCurrent(): boolean {
  if (!fs.existsSync(manifestPath)) {
    return false;
  }
  const manifestMtime = fs.statSync(manifestPath).mtimeMs;
  const inputs = [
    path.join(fixture, 'src', 'main.ts'),
    path.join(fixture, 'src', 'Pages', 'Home.vue'),
    path.join(fixture, 'views', 'app.ejs'),
    path.join(fixture, 'vite.config.mjs'),
    path.resolve('node_modules/vite/package.json'),
    path.resolve('node_modules/@vitejs/plugin-vue/package.json'),
    path.resolve('node_modules/vue/package.json'),
  ];
  return inputs.every((file) => fs.existsSync(file) && fs.statSync(file).mtimeMs <= manifestMtime);
}

describe('Vue Inertia client protocol integration', () => {
  beforeAll(async () => {
    // Compile a real Vue + @inertiajs/vue3 entrypoint in a temporary fixture.
    fs.mkdirSync(path.join(fixture, 'src', 'Pages'), { recursive: true });
    fs.mkdirSync(path.join(fixture, 'views'), { recursive: true });
    if (!fixtureBuildIsCurrent()) {
      fs.writeFileSync(path.join(fixture, 'src', 'main.ts'), `
        import { createApp, h } from 'vue'; import { createInertiaApp } from '@inertiajs/vue3';
        createInertiaApp({ resolve: (name) => import('./Pages/' + name + '.vue'),
          setup: ({ el, App, props, plugin }) => createApp({ render: () => h(App, props) }).use(plugin).mount(el) });`);
      fs.writeFileSync(path.join(fixture, 'src', 'Pages', 'Home.vue'), '<template><main>{{ message }}</main></template><script setup lang="ts">defineProps<{ message: string }>()</script>');
      fs.writeFileSync(path.join(fixture, 'views', 'app.ejs'), '<!doctype html><html><head>@vite(\'src/main.ts\')</head><body>@inertia</body></html>');
      fs.writeFileSync(path.join(fixture, 'vite.config.mjs'), `
        import { defineConfig } from 'vite'; import vue from '@vitejs/plugin-vue';
        export default defineConfig({ plugins: [vue()], base: '/build/', publicDir: false,
          build: { manifest: true, outDir: 'public/build', emptyOutDir: true, rollupOptions: { input: 'src/main.ts' } } });`);
      await run(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), 'build', '--config', path.join(fixture, 'vite.config.mjs'), '--logLevel', 'silent'], { cwd: fixture });
    }
  }, 30_000);

  function createApp() {
    const app = express();
    app.engine('ejs', createInertiaEngine({ cache: false, vite: { publicDir, buildDir: 'build', base: '/build/' } }));
    app.set('view engine', 'ejs'); app.set('views', path.join(fixture, 'views'));
    app.use(inertia({ rootView: 'app.ejs', version: 'asset-v1' }));
    app.get('/dashboard', (_req, res) => res.inertia('Home', { message: 'Rendered by Vue', visits: 3, requestedOnly: lazy(() => 'loaded on partial visit'), persistent: always('included on every visit') }));
    app.put('/dashboard', (_req, res) => res.redirect('/dashboard'));
    app.patch('/dashboard', (_req, res) => res.redirect(302, '/dashboard'));
    app.delete('/dashboard', (_req, res) => res.redirect(301, '/dashboard'));
    return app;
  }

  it('builds a Vue Inertia client and uses its production manifest for the HTML visit', async () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(buildDir, '.vite', 'manifest.json'), 'utf8')) as Record<string, { file: string }>;
    const entry = manifest['src/main.ts'];
    expect(entry).toBeDefined(); expect(fs.existsSync(path.join(buildDir, entry.file))).toBe(true);
    const response = await request(createApp()).get('/dashboard');
    expect(response.status).toBe(200); expect(response.text).toContain('<div id="app"></div>');
    expect(response.text).toContain('data-page="app"'); expect(response.text).toContain('"component":"Home"');
    expect(response.text).toContain(`/build/${entry.file}`);
  });

  it('serves JSON, partial reload, and asset-version requests emitted by an Inertia Vue client', async () => {
    const app = createApp(); const headers = { 'X-Inertia': 'true', 'X-Inertia-Version': 'asset-v1' };
    const visit = await request(app).get('/dashboard').set(headers);
    expect(visit.status).toBe(200); expect(visit.headers['x-inertia']).toBe('true');
    expect(visit.body.props).toEqual({ message: 'Rendered by Vue', visits: 3, persistent: 'included on every visit' });
    const partial = await request(app).get('/dashboard').set(headers).set('X-Inertia-Partial-Component', 'Home').set('X-Inertia-Partial-Data', 'requestedOnly');
    expect(partial.body.props).toEqual({ requestedOnly: 'loaded on partial visit', persistent: 'included on every visit' });
    const stale = await request(app).get('/dashboard').set('X-Inertia', 'true').set('X-Inertia-Version', 'stale-asset');
    expect(stale.status).toBe(409); expect(stale.headers['x-inertia-location']).toBe('/dashboard');
  });

  it.each(['put', 'patch', 'delete'] as const)('uses 303 redirects for an Inertia %s visit', async (method) => {
    const response = await request(createApp())[method]('/dashboard').set('X-Inertia', 'true').redirects(0);
    expect(response.status).toBe(303); expect(response.headers.location).toBe('/dashboard');
  });
});

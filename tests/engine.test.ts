import { describe, it, expect, vi, afterAll, beforeEach, afterEach } from 'vitest';
import { compileBladeDirectives, registerDirective } from '../src/directives.js';
import { createInertiaEngine, clearEngineCache } from '../src/engine.js';
import type { BladeEngineOptions, Page } from '../src/types.js';
import path from 'path';
import fs from 'fs';

const tempPublicDir = path.join(__dirname, 'temp_vite_engine');
const tempHotFile = path.join(tempPublicDir, 'hot');

function createTestEngine(options: BladeEngineOptions = {}) {
  fs.mkdirSync(tempPublicDir, { recursive: true });
  fs.writeFileSync(tempHotFile, 'http://localhost:5173\n');
  return createInertiaEngine({
    cache: false,
    vite: { publicDir: tempPublicDir, hotFile: tempHotFile, isDev: true },
    ...options,
  });
}

afterAll(() => {
  fs.rmSync(tempPublicDir, { recursive: true, force: true });
});

describe('Blade Directives & Component Compiler', () => {
  it('compiles Blade directives to EJS tags', () => {
    const bladeTemplate = `
      <head>
        @inertiaHead
        @viteReactRefresh
        @vite('src/main.ts')
        @vite(['src/main.ts', 'src/style.css'])
      </head>
      <body>
        @csrf
        @inertia
        @inertia('custom-app')
        @routes
        @json(user)
      </body>
    `;

    const compiled = compileBladeDirectives(bladeTemplate);

    expect(compiled).toContain('<%- inertiaHead() %>');
    expect(compiled).toContain('<%- viteReactRefresh() %>');
    expect(compiled).toContain("<%- vite('src/main.ts') %>");
    expect(compiled).toContain("<%- vite(['src/main.ts', 'src/style.css']) %>");
    expect(compiled).toContain('<%- csrf() %>');
    expect(compiled).toContain('<%- inertia() %>');
    expect(compiled).toContain("<%- inertia('custom-app') %>");
    expect(compiled).toContain('<%- routes() %>');
    expect(compiled).toContain('<%- json(user) %>');
  });

  it('compiles Blade component syntax (<x-... />) to EJS tags', () => {
    const componentTemplate = `
      <head>
        <x-inertia-head />
        <x-vite-react-refresh />
        <x-vite src="src/app.tsx" />
      </head>
      <body>
        <x-csrf />
        <x-inertia />
        <x-inertia id="root" />
        <x-routes />
      </body>
    `;

    const compiled = compileBladeDirectives(componentTemplate);

    expect(compiled).toContain('<%- inertiaHead() %>');
    expect(compiled).toContain('<%- viteReactRefresh() %>');
    expect(compiled).toContain("<%- vite('src/app.tsx') %>");
    expect(compiled).toContain('<%- csrf() %>');
    expect(compiled).toContain('<%- inertia() %>');
    expect(compiled).toContain("<%- inertia('root') %>");
    expect(compiled).toContain('<%- routes() %>');
  });

  it('supports custom registered Blade directives', () => {
    registerDirective('uppercase', (args) => `<%= (${args}).toUpperCase() %>`);

    const template = '<h1>@uppercase(title)</h1>';
    const compiled = compileBladeDirectives(template);

    expect(compiled).toBe('<h1><%= (title).toUpperCase() %></h1>');
  });

  it('renders EJS template with createInertiaEngine', async () => {
    const engine = createTestEngine();
    const templatePath = path.join(__dirname, 'views', 'app.ejs');

    const options = {
      page: {
        component: 'Home',
        props: { title: 'Welcome' },
        url: '/',
        version: '1.0',
      },
      _csrf: 'test-csrf-token',
    };

    const html = await new Promise<string>((resolve, reject) => {
      engine(templatePath, options, (err, res) => {
        if (err) return reject(err);
        resolve(res || '');
      });
    });

    expect(html).toContain('id="app"');
    expect(html).toContain('"component":"Home"');
    expect(html).toContain('"title":"Welcome"');
  });

  it('renders Inertia v1 data-page attribute when inertiaVersion is 1', async () => {
    const engine = createTestEngine({ inertiaVersion: 1 });
    const templatePath = path.join(__dirname, 'views', 'app.ejs');

    const options = {
      page: {
        component: 'Home',
        props: { title: 'Welcome' },
        url: '/',
        version: '1.0',
      },
    };

    const html = await new Promise<string>((resolve, reject) => {
      engine(templatePath, options, (err, res) => {
        if (err) return reject(err);
        resolve(res || '');
      });
    });

    expect(html).toContain('data-page="');
    expect(html).toContain('&quot;component&quot;:&quot;Home&quot;');
    expect(html).not.toContain('<script data-page=');
  });

  it('renders only the JSON script tag without root div when rootElement is false', async () => {
    const engine = createTestEngine({ rootElement: false });
    const templatePath = path.join(__dirname, 'views', 'app.ejs');

    const options = {
      page: {
        component: 'Home',
        props: { title: 'Welcome' },
        url: '/',
        version: '1.0',
      },
    };

    const html = await new Promise<string>((resolve, reject) => {
      engine(templatePath, options, (err, res) => {
        if (err) return reject(err);
        resolve(res || '');
      });
    });

    expect(html).toContain('<script data-page="app" type="application/json">');
    expect(html).toContain('"component":"Home"');
    expect(html).not.toContain('<div id="app">');
  });

  it('passes through the official full-body SSR payload (script + data-server-rendered div) without double-wrapping', async () => {
    const engine = createTestEngine();
    const templatePath = path.join(__dirname, 'views', 'app.ejs');

    const page = {
      component: 'Home',
      props: { title: 'Welcome' },
      url: '/',
      version: '1.0',
    };

    const ssrBody = `<script data-page="app" type="application/json">${JSON.stringify(page)}<\/script><div data-server-rendered="true" id="app"><h1>Welcome</h1></div>`;

    const options = {
      page,
      ssr: { head: ['<title inertia>SSR</title>'], body: ssrBody },
    };

    const html = await new Promise<string>((resolve, reject) => {
      engine(templatePath, options, (err, res) => {
        if (err) return reject(err);
        resolve(res || '');
      });
    });

    expect(html).toContain('<title inertia>SSR</title>');
    expect(html).toContain('data-server-rendered="true" id="app"><h1>Welcome</h1>');
    expect(html).toContain('<h1>Welcome</h1>');
    expect((html.match(/data-page="app"/g) || []).length).toBe(1);
    expect(html).not.toContain('<div id="app"><script data-page=');
  });
});

describe('Engine caching and edge runtime', () => {
  const cacheDir = path.join(__dirname, 'temp_engine_cache');
  const viewPath = path.join(cacheDir, 'view.ejs');

  beforeEach(() => {
    fs.mkdirSync(cacheDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(cacheDir, { recursive: true, force: true });
  });

  function renderWith(
    engine: (file: string, opts: Record<string, any>, cb: (e: Error | null, html?: string) => void) => void,
    options: Record<string, any> = {}
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      engine(viewPath, options, (err, html) => {
        if (err) return reject(err);
        resolve(html || '');
      });
    });
  }

  function mockPage(): Page {
    return {
      component: 'Home',
      props: { title: 'Welcome' },
      url: '/',
      version: '1.0',
    };
  }

  it('uses templateSource without touching the filesystem (edge runtimes)', async () => {
    const engine = createInertiaEngine({
      cache: false,
      templateSource: '<div>EDGE<%- inertia() %></div>',
    });

    const html = await new Promise<string>((resolve, reject) => {
      engine('/nonexistent/path.ejs', { page: mockPage() }, (err, res) => {
        if (err) return reject(err);
        resolve(res || '');
      });
    });

    expect(html).toContain('EDGE');
    expect(html).toContain('<div id="app">');
  });

  it('caches compiled templates when cache is enabled', async () => {
    fs.writeFileSync(viewPath, '<h1>version-one</h1>');
    const engine = createInertiaEngine({ cache: true });

    expect(await renderWith(engine)).toContain('version-one');

    // Template file changes, but the cached engine keeps returning the old content.
    fs.writeFileSync(viewPath, '<h1>version-two</h1>');
    expect(await renderWith(engine)).toContain('version-one');
  });

  it('does not cache templates when cache is disabled', async () => {
    fs.writeFileSync(viewPath, '<h1>version-one</h1>');
    const engine = createInertiaEngine({ cache: false });

    expect(await renderWith(engine)).toContain('version-one');

    fs.writeFileSync(viewPath, '<h1>version-two</h1>');
    expect(await renderWith(engine)).toContain('version-two');
  });

  it('clearEngineCache() forces cached templates to be re-read', async () => {
    fs.writeFileSync(viewPath, '<h1>version-one</h1>');
    const engine = createInertiaEngine({ cache: true });

    expect(await renderWith(engine)).toContain('version-one');

    fs.writeFileSync(viewPath, '<h1>version-two</h1>');
    clearEngineCache();
    expect(await renderWith(engine)).toContain('version-two');
  });

  it('reads and compiles a cached template only once', async () => {
    fs.writeFileSync(viewPath, '<h1>once</h1>');
    const engine = createInertiaEngine({ cache: true });

    const readSpy = vi.spyOn(fs, 'readFileSync');
    try {
      expect(await renderWith(engine)).toContain('once');
      expect(await renderWith(engine)).toContain('once');
      expect(readSpy).toHaveBeenCalledTimes(1);
    } finally {
      readSpy.mockRestore();
    }
  });

  it('reuses the compiled template in dev mode without re-reading unchanged files', async () => {
    fs.writeFileSync(viewPath, '<h1>stable-content</h1>');
    const engine = createInertiaEngine({ cache: false });

    const readSpy = vi.spyOn(fs, 'readFileSync');
    try {
      expect(await renderWith(engine)).toContain('stable-content');
      expect(await renderWith(engine)).toContain('stable-content');
      expect(readSpy).toHaveBeenCalledTimes(1);
    } finally {
      readSpy.mockRestore();
    }
  });
});

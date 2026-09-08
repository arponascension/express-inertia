import { describe, it, expect, afterAll } from 'vitest';
import { compileBladeDirectives, registerDirective } from '../src/directives.js';
import { createInertiaEngine } from '../src/engine.js';
import type { BladeEngineOptions } from '../src/types.js';
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
      ssr: { head: ['<title>SSR</title>'], body: ssrBody },
    };

    const html = await new Promise<string>((resolve, reject) => {
      engine(templatePath, options, (err, res) => {
        if (err) return reject(err);
        resolve(res || '');
      });
    });

    expect(html).toContain('<title>SSR</title>');
    expect(html).toContain('data-server-rendered="true" id="app"><h1>Welcome</h1>');
    expect(html).toContain('<h1>Welcome</h1>');
    expect((html.match(/data-page="app"/g) || []).length).toBe(1);
    expect(html).not.toContain('<div id="app"><script data-page=');
  });
});

import fs from 'fs';
import path from 'path';
import type { ViteConfig } from './types.js';
import { createLogger } from './logger.js';
import { generateSriHash } from './utils.js';

/**
 * Options for the auto dev/build Vite plugin.
 */
export interface InertiaVitePluginOptions {
  /**
   * Path to the hot file. Relative paths are resolved against Vite's project root.
   * @default 'public/hot'
   */
  hotFile?: string;
  /**
   * Override the dev server URL written to the hot file.
   * Defaults to the resolved Vite dev server URL.
   */
  devServerUrl?: string;
}

/**
 * Structural subset of Vite's `Plugin` type so the core package does not need
 * a hard runtime dependency on Vite.
 */
export interface InertiaVitePlugin {
  name: string;
  configResolved?: (config: any) => void;
  configureServer?: (server: any) => void;
  buildStart?: () => void;
}

/**
 * Derive the dev server URL from Vite's resolved config, mirroring Laravel's
 * vite-plugin logic (honours `server.origin`, then https/host/port).
 */
function resolveDevServerUrl(config: any, override?: string): string {
  if (override) return override.replace(/\/$/, '');
  const server = config?.server || {};
  if (typeof server.origin === 'string' && server.origin) {
    return server.origin.replace(/\/$/, '');
  }
  const scheme = server.https ? 'https' : 'http';
  let host = server.host;
  if (!host || host === '0.0.0.0' || host === '::' || host === '::0' || host === true) {
    host = 'localhost';
  }
  if (host.includes(':') && !host.startsWith('[')) {
    host = `[${host}]`;
  }
  const port = server.port ?? 5173;
  return `${scheme}://${host}:${port}`;
}

/**
 * Vite plugin that automatically toggles Express between dev and build mode.
 *
 * - `vite dev` writes a `hot` file (signalling dev mode) and removes it on shutdown.
 * - `vite build` removes any stale `hot` file, so Express falls back to the built manifest.
 *
 * Use it in your `vite.config.ts`:
 * ```ts
 * import { inertiaVitePlugin } from 'express-inertia/vite';
 * export default defineConfig({
 *   plugins: [react(), inertiaVitePlugin()],
 * });
 * ```
 */
export function inertiaVitePlugin(options: InertiaVitePluginOptions = {}): InertiaVitePlugin {
  const logger = createLogger({ prefix: 'express-inertia:vite' });
  const write = (config: any, server?: any) => {
    try {
      const hotFile = path.resolve(config.root, options.hotFile || 'public/hot');
      const actual = server?.resolvedUrls?.local?.[0];
      const url = actual || resolveDevServerUrl(config, options.devServerUrl);
      fs.mkdirSync(path.dirname(hotFile), { recursive: true });
      fs.writeFileSync(hotFile, url.replace(/\/$/, ''));
    } catch (err) {
      logger.warn('Failed to write Vite hot file', { error: (err as Error).message });
    }
  };

  const remove = (config: any) => {
    try {
      const hotFile = path.resolve(config.root, options.hotFile || 'public/hot');
      fs.rmSync(hotFile, { force: true });
    } catch {
      // ignore
    }
  };

  return {
    name: 'express-inertia-hot-file',

    configResolved(config) {
      if (config.command === 'build') {
        remove(config);
      } else {
        write(config);
      }
    },

    configureServer(server) {
      write(server.config, server);
      server.httpServer?.once('listening', () => write(server.config, server));
      server.httpServer?.on('close', () => remove(server.config));
      process.once('exit', () => remove(server.config));
    },

    buildStart() {
      // noop guard: build-time cleanup happens in configResolved
    },
  };
}

export interface ViteManifestChunk {
  src?: string;
  file: string;
  css?: string[];
  assets?: string[];
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
}

export type ViteManifest = Record<string, ViteManifestChunk>;

export interface ResolvedViteConfig {
  publicDir: string;
  buildDir: string;
  devServerUrl: string;
  hotFile: string;
  manifestPath: string;
  base: string;
  manifest: ViteManifest | null;
  isDev: boolean;
  devServerUrlOverride: string | null;
}

export class ViteHelper {
  private config: ResolvedViteConfig;
  private manifestCache: ViteManifest | null = null;
  private logger = createLogger({ prefix: 'express-inertia:vite' });

  constructor(config?: ViteConfig) {
    const publicDir = config?.publicDir ? path.resolve(config.publicDir) : path.resolve('public');
    const buildDir = config?.buildDir || 'build';

    this.config = {
      publicDir,
      buildDir,
      devServerUrl: config?.devServerUrl || 'http://localhost:5173',
      hotFile: path.resolve(config?.hotFile || path.join(publicDir, 'hot')),
      manifestPath: path.resolve(
        config?.manifestPath || path.join(publicDir, buildDir, '.vite', 'manifest.json')
      ),
      base: config?.base || `/${buildDir}/`,
      manifest: config?.manifest || null,
      isDev: config?.isDev ?? false,
      devServerUrlOverride: config?.devServerUrlOverride || null,
    };
  }

  /**
   * Detect whether the Vite dev server is running.
   *
   * Mirrors Laravel: the presence of the `hot` file is the sole signal. Vite's
   * dev server writes a `hot` file on startup and removes it on shutdown, so no
   * NODE_ENV switch is required to toggle between dev and build assets.
   */
  public isDev(): boolean {
    if (this.config.isDev === true) {
      return true;
    }

    const candidatePaths = [
      this.config.hotFile,
      path.resolve('hot'),
      path.join(this.config.publicDir, 'hot'),
    ];

    return candidatePaths.some((p) => fs.existsSync(p));
  }

  /**
   * Get development server URL from hot file or config.
   */
  public getDevServerUrl(): string {
    if (this.config.devServerUrlOverride) {
      return this.config.devServerUrlOverride.replace(/\/$/, '');
    }

    const candidatePaths = [
      this.config.hotFile,
      path.resolve('hot'),
      path.join(this.config.publicDir, 'hot'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf-8').trim();
          if (content.startsWith('http://') || content.startsWith('https://')) {
            return content;
          }
        } catch {
          // ignore
        }
      }
    }

    return this.config.devServerUrl;
  }

  /**
   * Check if manifest file exists.
   */
  public manifestExists(): boolean {
    if (this.config.manifest) {
      return true;
    }
    const candidatePaths = this.getManifestCandidatePaths();
    return candidatePaths.some((p) => fs.existsSync(p));
  }

  private getManifestCandidatePaths(): string[] {
    const { publicDir, buildDir } = this.config;
    return [
      this.config.manifestPath,
      path.resolve(publicDir, buildDir, '.vite', 'manifest.json'),
      path.resolve(publicDir, buildDir, 'manifest.json'),
      path.resolve(buildDir, '.vite', 'manifest.json'),
      path.resolve(buildDir, 'manifest.json'),
    ];
  }

  /**
   * Load and cache the production manifest.
   */
  public getManifest(): ViteManifest {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    if (this.config.manifest) {
      this.manifestCache = this.config.manifest;
      return this.config.manifest;
    }

    const candidatePaths = this.getManifestCandidatePaths();
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw);
          this.manifestCache = parsed;
          return parsed;
        } catch (err: any) {
          throw new Error(`[express-inertia] Failed to parse Vite manifest at ${p}: ${err.message}`);
        }
      }
    }

    throw new Error(
      `[express-inertia] Vite manifest not found. Looked in:\n${candidatePaths.join('\n')}\nRun your build step (e.g. vite build) to generate it.`
    );
  }

  /**
   * Generate HTML script & link tags for the given entrypoint(s).
   * @param entrypoints Single entry string or array of entry paths (e.g. 'src/main.ts' or ['src/main.ts', 'src/style.css'])
   */
  public renderTags(entrypoints: string | string[]): string {
    const entries = Array.isArray(entrypoints) ? entrypoints : [entrypoints];
    const tags: string[] = [];

    if (this.isDev()) {
      const devUrl = this.getDevServerUrl().replace(/\/$/, '');
      tags.push(`<script type="module" src="${devUrl}/@vite/client"></script>`);

      for (const entry of entries) {
        const cleanEntry = entry.replace(/^\//, '');
        if (cleanEntry.endsWith('.css') || cleanEntry.endsWith('.scss') || cleanEntry.endsWith('.less')) {
          tags.push(`<link rel="stylesheet" href="${devUrl}/${cleanEntry}">`);
        } else {
          tags.push(`<script type="module" src="${devUrl}/${cleanEntry}"></script>`);
        }
      }

      return tags.join('\n');
    }

    // Production mode
    const manifest = this.getManifest();
    const basePath = this.config.base.endsWith('/') ? this.config.base : `${this.config.base}/`;
    const renderedCss = new Set<string>();
    const renderedPreload = new Set<string>();

    for (const entry of entries) {
      const cleanEntry = entry.replace(/^\//, '');
      const chunk =
        manifest[cleanEntry] ||
        Object.values(manifest).find(
          (c) =>
            c.src === cleanEntry ||
            c.file === cleanEntry ||
            (c.src && (c.src.endsWith(cleanEntry) || c.src.endsWith(`/${cleanEntry}`))) ||
            (c.file && (c.file.endsWith(cleanEntry) || c.file.endsWith(`/${cleanEntry}`)))
        );

        if (!chunk) {
          if (!/\.(css|scss|sass|less)$/.test(cleanEntry)) {
            this.logger.warn('Entry not found in Vite manifest', { entry, manifestPath: this.config.manifestPath });
          }
          continue;
        }

      // Add CSS files
      if (chunk.css) {
        for (const cssFile of chunk.css) {
          if (!renderedCss.has(cssFile)) {
            renderedCss.add(cssFile);
            tags.push(`<link rel="stylesheet" href="${basePath}${cssFile}">`);
          }
        }
      }

      // If entry itself is a CSS file
      if (chunk.file.endsWith('.css')) {
        if (!renderedCss.has(chunk.file)) {
          renderedCss.add(chunk.file);
          tags.push(`<link rel="stylesheet" href="${basePath}${chunk.file}">`);
        }
      } else {
        // JS entry file
        tags.push(`<script type="module" src="${basePath}${chunk.file}"></script>`);
      }

      // Add module preloads
      if (chunk.imports) {
        for (const imp of chunk.imports) {
          const impChunk = manifest[imp];
          if (impChunk && !renderedPreload.has(impChunk.file)) {
            renderedPreload.add(impChunk.file);
            tags.push(`<link rel="modulepreload" href="${basePath}${impChunk.file}">`);
          }
        }
      }
    }

    return tags.join('\n');
  }

  /**
   * Generates the React Fast Refresh preamble for development.
   */
  public renderReactRefresh(): string {
    if (!this.isDev()) {
      return '';
    }

    const devUrl = this.getDevServerUrl().replace(/\/$/, '');
    return `<script type="module">
  import RefreshRuntime from "${devUrl}/@react-refresh";
  RefreshRuntime.injectIntoGlobalHook(window);
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
  window.__vite_plugin_react_preamble_installed__ = true;
</script>`;
  }

  /**
   * Generates an SRI hash for the given asset file content.
   * Useful for adding integrity attributes to script/link tags.
   */
  public async generateSriHashForAsset(assetPath: string): Promise<string> {
    const fullPath = path.resolve(this.config.publicDir, assetPath);
    const content = fs.readFileSync(fullPath);
    return generateSriHash(content);
  }
}

/**
 * Creates a configured ViteHelper instance.
 */
export function createViteHelper(config?: ViteConfig): ViteHelper {
  return new ViteHelper(config);
}

/**
 * Default singleton instance.
 */
export const defaultViteHelper = new ViteHelper();

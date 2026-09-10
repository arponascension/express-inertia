import type { ViteHelper } from './vite.js';

export interface PrefetchOptions {
  /**
   * Whether to include crossorigin attribute.
   * @default false
   */
  crossorigin?: boolean;
  /**
   * Whether to include integrity attribute (requires async SRI calculation).
   * @default false
   */
  integrity?: boolean;
  /**
   * Prefetch mode: 'prefetch' (default) or 'preload'.
   */
  mode?: 'prefetch' | 'preload';
}

export interface PrefetchEntry {
  entrypoints: string[];
  assets?: string[];
}

export class PrefetchHelper {
  constructor(private viteHelper: ViteHelper) {}

  /**
   * Generates prefetch tags for the given entrypoints.
   * Uses the Vite manifest to resolve actual asset paths in production.
   */
  prefetch(entries: string | string[], options: PrefetchOptions = {}): string {
    const entrypoints = Array.isArray(entries) ? entries : [entries];
    const mode = options.mode || 'prefetch';
    const tags: string[] = [];

    if (this.viteHelper.isDev()) {
      const devUrl = this.viteHelper.getDevServerUrl().replace(/\/$/, '');
      for (const entry of entrypoints) {
        const cleanEntry = entry.replace(/^\//, '');
        const attrs = [`rel="${mode}"`, `href="${devUrl}/${cleanEntry}"`];
        if (options.crossorigin) {
          attrs.push('crossorigin');
        }
        tags.push(`<link ${attrs.join(' ')}>`);
      }
      return tags.join('\n');
    }

    const manifest = this.viteHelper.getManifest();
    const basePath = this.viteHelper.getBasePath();

    const rendered = new Set<string>();

    for (const entry of entrypoints) {
      const cleanEntry = entry.replace(/^\//, '');
      const chunk = this.resolveChunk(manifest, cleanEntry);
      if (!chunk) continue;

      const files = [chunk.file, ...(chunk.css || []), ...(chunk.assets || [])].filter(Boolean) as string[];
      for (const file of files) {
        if (rendered.has(file)) continue;
        rendered.add(file);

        const attrs = [`rel="${mode}"`, `href="${basePath}${file}"`];
        if (options.crossorigin) {
          attrs.push('crossorigin');
        }
        tags.push(`<link ${attrs.join(' ')}>`);
      }

      if (chunk.imports) {
        for (const imp of chunk.imports) {
          const impChunk = manifest[imp];
          if (impChunk?.file && !rendered.has(impChunk.file)) {
            rendered.add(impChunk.file);
            const attrs = [`rel="${mode}"`, `href="${basePath}${impChunk.file}"`];
            if (options.crossorigin) {
              attrs.push('crossorigin');
            }
            tags.push(`<link ${attrs.join(' ')}>`);
          }
        }
      }
    }

    return tags.join('\n');
  }

  /**
   * Generates preload tags for critical assets.
   */
  preload(entries: string | string[], options: Omit<PrefetchOptions, 'mode'> = {}): string {
    return this.prefetch(entries, { ...options, mode: 'preload' });
  }

  private resolveChunk(manifest: Record<string, { file?: string; src?: string; css?: string[]; imports?: string[]; assets?: string[] }>, entry: string) {
    return (
      manifest[entry] ||
      Object.values(manifest).find(
        (c) =>
          c.src === entry ||
          c.file === entry ||
          (c.src && (c.src.endsWith(entry) || c.src.endsWith(`/${entry}`))) ||
          (c.file && (c.file.endsWith(entry) || c.file.endsWith(`/${entry}`)))
      )
    );
  }
}

export function createPrefetchHelper(viteHelper: ViteHelper): PrefetchHelper {
  return new PrefetchHelper(viteHelper);
}

import { describe, it, expect } from 'vitest';
import { renderSSR } from '../src/ssr.js';
import type { Page } from '../src/types.js';

describe('Inertia SSR Handler', () => {
  const mockPage: Page = {
    component: 'Home',
    props: { title: 'SSR Page' },
    url: '/',
    version: '1.0',
  };

  it('returns null if ssr is disabled or not configured', async () => {
    const result1 = await renderSSR(mockPage, undefined);
    expect(result1).toBeNull();

    const result2 = await renderSSR(mockPage, false);
    expect(result2).toBeNull();

    const result3 = await renderSSR(mockPage, { enabled: false });
    expect(result3).toBeNull();
  });

  it('uses custom render function when provided', async () => {
    const customRender = async (page: Page) => {
      return {
        head: ['<title inertia>Custom SSR Title</title>', '<meta name="description" content="Test">'],
        body: `<div class="ssr-rendered">Rendered ${page.component}</div>`,
      };
    };

    const result = await renderSSR(mockPage, {
      enabled: true,
      render: customRender,
    });

    expect(result).not.toBeNull();
    expect(result?.head).toEqual([
      '<title inertia>Custom SSR Title</title>',
      '<meta name="description" content="Test">',
    ]);
    expect(result?.body).toBe('<div class="ssr-rendered">Rendered Home</div>');
  });

  it('falls back gracefully to null on custom render error when fallback is true', async () => {
    const failingRender = async () => {
      throw new Error('Render crash');
    };

    const result = await renderSSR(mockPage, {
      enabled: true,
      render: failingRender,
      fallback: true,
    });

    expect(result).toBeNull();
  });
});

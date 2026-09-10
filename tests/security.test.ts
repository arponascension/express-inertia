import { describe, it, expect } from 'vitest';
import type { Page } from '../src/types.js';
import {
  validateComponentName,
  sanitizeViewData,
  generateSriHash,
  escapeHtmlAttr,
  serializePage,
} from '../src/utils.js';

describe('Security Utilities', () => {
  describe('validateComponentName', () => {
    it('allows safe component names', () => {
      expect(() => validateComponentName('Home')).not.toThrow();
      expect(() => validateComponentName('Users-Index')).not.toThrow();
      expect(() => validateComponentName('Admin_Panel')).not.toThrow();
      expect(() => validateComponentName('Dashboard2')).not.toThrow();
      expect(() => validateComponentName('Users/Index')).not.toThrow();
      expect(() => validateComponentName('Admin/Users/Show')).not.toThrow();
    });

    it('rejects path traversal attempts', () => {
      expect(() => validateComponentName('../../../etc/passwd')).toThrow(TypeError);
      expect(() => validateComponentName('..\\..\\windows\\system32')).toThrow(TypeError);
      expect(() => validateComponentName('/etc/passwd')).toThrow(TypeError);
      expect(() => validateComponentName('Users/../../../etc/passwd')).toThrow(TypeError);
      expect(() => validateComponentName('/Users/Index')).toThrow(TypeError);
      expect(() => validateComponentName('Users//Index')).toThrow(TypeError);
    });

    it('rejects special characters', () => {
      expect(() => validateComponentName('Home;alert(1)')).toThrow(TypeError);
      expect(() => validateComponentName('Home<script>')).toThrow(TypeError);
      expect(() => validateComponentName('Home&cmd')).toThrow(TypeError);
    });

    it('accepts custom pattern', () => {
      const customPattern = /^[A-Z][a-z]+$/;
      expect(() => validateComponentName('Home', customPattern)).not.toThrow();
      expect(() => validateComponentName('home', customPattern)).toThrow(TypeError);
    });
  });

  describe('sanitizeViewData', () => {
    it('strips functions from viewData', () => {
      const input = {
        title: 'Safe',
        helper: () => 'dangerous',
        nested: {
          fn: () => 'also dangerous',
          value: 'safe',
        },
      };

      const result = sanitizeViewData(input);
      expect(result.title).toBe('Safe');
      expect(result.helper).toBeUndefined();
      expect(result.nested.fn).toBeUndefined();
      expect(result.nested.value).toBe('safe');
    });

    it('strips undefined values', () => {
      const input = {
        a: 'value',
        b: undefined,
        c: null,
      };

      const result = sanitizeViewData(input);
      expect(result.a).toBe('value');
      expect(result.b).toBeUndefined();
      expect(result.c).toBeNull();
    });

    it('handles arrays', () => {
      const input = {
        items: [1, () => 'evil', 3],
      };

      const result = sanitizeViewData(input);
      expect(result.items).toEqual([1, undefined, 3]);
    });

    it('handles circular references gracefully', () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      const result = sanitizeViewData(circular);
      expect(result.a).toBe(1);
      expect(result.self).toBeUndefined();
    });
  });

  describe('escapeHtmlAttr', () => {
    it('escapes HTML attribute-significant characters', () => {
      expect(escapeHtmlAttr('a&b"c\'d<e>f')).toBe('a&amp;b&quot;c&#39;d&lt;e&gt;f');
    });

    it('leaves safe strings untouched', () => {
      expect(escapeHtmlAttr('simple-safe-value')).toBe('simple-safe-value');
    });
  });

  describe('serializePage', () => {
    it('produces attribute-safe JSON for the data-page attribute', () => {
      const page: Page = {
        component: 'Home',
        props: { title: 'Hi <script>' },
        url: '/',
        version: '1.0',
      };

      const out = serializePage(page);

      expect(out).toContain('&quot;component&quot;');
      expect(out).toContain('&lt;script&gt;');
      expect(out).not.toContain('<');
      expect(out).not.toContain('"component"');
    });

    it('replaces circular references with null', () => {
      const circular: any = {};
      circular.self = circular;
      const page: any = {
        component: 'Home',
        props: circular,
        url: '/',
        version: null,
      };

      const out = serializePage(page);

      expect(out).toContain('null');
      expect(out).toContain('&quot;component&quot;');
    });
  });

  describe('generateSriHash', () => {
    it('generates a valid SHA-384 SRI hash', async () => {
      const hash = await generateSriHash('hello world');
      expect(hash).toMatch(/^sha384-[A-Za-z0-9+/=]+$/);
    });

    it('produces deterministic hashes for the same input', async () => {
      const hash1 = await generateSriHash('test content');
      const hash2 = await generateSriHash('test content');
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', async () => {
      const hash1 = await generateSriHash('content A');
      const hash2 = await generateSriHash('content B');
      expect(hash1).not.toBe(hash2);
    });

    it('accepts Buffer input', async () => {
      const hash = await generateSriHash(Buffer.from('buffer input'));
      expect(hash).toMatch(/^sha384-[A-Za-z0-9+/=]+$/);
    });
  });
});

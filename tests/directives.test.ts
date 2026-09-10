import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { compileBladeDirectives, registerDirective, clearCustomDirectives } from '../src/directives.js';

describe('custom Blade directives', () => {
  beforeEach(() => {
    clearCustomDirectives();
  });

  afterEach(() => {
    clearCustomDirectives();
  });

  it('expands a globally registered directive', () => {
    registerDirective('shout', (args) => `toUpperCase(${args || "'hi'"})`);

    const compiled = compileBladeDirectives('@shout("foo")');
    expect(compiled).toContain('toUpperCase("foo")');
  });

  it('lets local directives take precedence over global ones', () => {
    registerDirective('shout', () => 'GLOBAL');

    const compiled = compileBladeDirectives('<%- shoutValue %> @shout()', {
      shout: () => 'LOCAL',
    });

    expect(compiled).not.toContain('GLOBAL');
    expect(compiled).toContain('LOCAL');
  });

  it('clearCustomDirectives() removes all globally registered directives', () => {
    registerDirective('one', () => 'ONE');
    registerDirective('two', () => 'TWO');
    clearCustomDirectives();

    const compiled = compileBladeDirectives('@one() @two()');
    expect(compiled).not.toContain('ONE');
    expect(compiled).not.toContain('TWO');
    expect(compiled).toContain('@one() @two()');
  });
});
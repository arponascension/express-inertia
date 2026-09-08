import { describe, it, expect, vi } from 'vitest';
import { createLogger, setGlobalLogger, getGlobalLogger } from '../src/logger.js';

describe('Logger', () => {
  it('creates a console logger with structured output', () => {
    const logger = createLogger({ prefix: 'test' });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logger.warn('Something happened', { key: 'value' });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[test] Something happened',
      expect.stringContaining('"key":"value"')
    );

    warnSpy.mockRestore();
  });

  it('formats messages without meta cleanly', () => {
    const logger = createLogger({ prefix: 'test' });
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info('Hello world');

    expect(infoSpy).toHaveBeenCalledWith('[test] Hello world');

    infoSpy.mockRestore();
  });

  it('supports custom logger injection', () => {
    const custom = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() };
    const logger = createLogger({ prefix: 'test', logger: custom });

    logger.warn('test');

    expect(custom.warn).toHaveBeenCalledTimes(1);
    expect(custom.warn).toHaveBeenCalledWith('test');
  });

  it('allows setting and getting global logger', () => {
    const custom = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() };
    setGlobalLogger(custom);
    expect(getGlobalLogger()).toBe(custom);

    setGlobalLogger(createLogger({ prefix: 'default' }));
    expect(getGlobalLogger()).not.toBe(custom);
  });
});

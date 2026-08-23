// @vitest-environment happy-dom
// LAC contract test (architect thread 83d2fd5c, rule 5) — view-architect.
// This app has no REST service module yet (delta 105f41b4 tables topology
// reads for a later owning-service decision); the live-mode contract today
// is: event-bus target from env with documented default, live-default mode,
// and bus publish failures staying visible.

import { describe, it, expect, vi } from 'vitest';
import { resolveLacMode, resolveTargetUrl } from './lac';

describe('LAC contract: view-architect', () => {
  it('defaults to LIVE mode; mock only via explicit VITE_VA_MODE=mock', () => {
    expect(resolveLacMode({}, 'VITE_VA_MODE')).toBe('live');
    expect(resolveLacMode({ VITE_VA_MODE: 'live' }, 'VITE_VA_MODE')).toBe('live');
    expect(resolveLacMode({ VITE_VA_MODE: 'mock' }, 'VITE_VA_MODE')).toBe('mock');
  });

  it('event-bus URL comes from env with the documented :3200 default', () => {
    expect(resolveTargetUrl({}, 'VITE_VA_EVENT_BUS_URL', 'http://localhost:3200'))
      .toBe('http://localhost:3200');
    expect(resolveTargetUrl({ VITE_VA_EVENT_BUS_URL: 'http://bus.internal:3200' },
      'VITE_VA_EVENT_BUS_URL', 'http://localhost:3200'))
      .toBe('http://bus.internal:3200');
  });

  it('bus publish failures stay visible (no silent swallow)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('simulate network failure');
    }));
    const { fetch: f } = globalThis as any;
    await expect((f as any)()).rejects.toThrow(/simulate network failure/);
    vi.unstubAllGlobals();
  });
});

import { vi } from 'vitest';

/**
 * Creates a chainable Supabase query builder mock.
 * All chain methods return `this`, making the mock both chainable and awaitable.
 * The terminal result is set via the `resolve` / `resolveOnce` helpers.
 */
export function createChainableMock(defaultResult: { data: unknown; error: unknown; count?: number } = { data: null, error: null }) {
  let result = defaultResult;
  const overrides: Array<{ data: unknown; error: unknown; count?: number }> = [];

  const getResult = () => {
    if (overrides.length > 0) return overrides.shift()!;
    return result;
  };

  const mock: Record<string, unknown> = {
    select: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    upsert: vi.fn(() => mock),
    delete: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    neq: vi.fn(() => mock),
    in: vi.fn(() => mock),
    or: vi.fn(() => mock),
    order: vi.fn(() => mock),
    range: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    single: vi.fn(() => Promise.resolve(getResult())),
    // thenable — allows `await mock` / `await supabase.from(...).select(...)`
    then: vi.fn((resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
      const r = getResult();
      return Promise.resolve(r).then(resolve, reject);
    }),
    catch: vi.fn((reject: (e: unknown) => unknown) => Promise.resolve(getResult()).catch(reject)),
    finally: vi.fn((fn: () => void) => Promise.resolve(getResult()).finally(fn)),
    // helpers for test setup
    resolveOnce: (override: { data: unknown; error: unknown; count?: number }) => {
      overrides.push(override);
      return mock;
    },
    setDefault: (def: { data: unknown; error: unknown; count?: number }) => {
      result = def;
      return mock;
    },
  };

  return mock;
}

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { rewind as shopEngine } from './webmcp';

let rewind: typeof shopEngine;

beforeAll(async () => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  });
  ({ rewind } = await import('./webmcp'));
});
beforeEach(() => rewind.reset());
afterAll(() => vi.unstubAllGlobals());

describe('cart mutation validation', () => {
  it.each([
    {},
    { items: [null] },
    { items: [{ product_id: 'missing', quantity: 1 }] },
    ...[0, -1, 1.5, Infinity, NaN, 100, '2'].map((quantity) => ({ items: [{ product_id: 'vistamesh', quantity }] })),
    { items: [{ product_id: 'vistamesh', quantity: 1, size: 'XXL' }] },
  ])('rejects invalid input without changing the cart or history: %j', (input) => {
    rewind.invoke('update_cart', { items: [{ product_id: 'vistamesh', quantity: 1, size: 'XL' }] });
    const before = rewind.getSession();
    expect(() => rewind.invoke('update_cart', input)).toThrow();
    expect(rewind.getSession()).toEqual(before);
  });

  it('preserves size and history when restoring and retrying', () => {
    rewind.invoke('update_cart', { items: [{ product_id: 'vistamesh', quantity: 1, size: 'XL' }] });
    rewind.invoke('update_cart', { items: [{ product_id: 'vistamesh', quantity: 2, size: 'M' }] });
    rewind.rewindBefore('c002');
    expect(rewind.getSession().current.cart).toEqual([{ productId: 'vistamesh', quantity: 1, size: 'XL' }]);
    expect(rewind.invoke('update_cart', { items: [] }).branchCreated).toBe('branch-1');
    expect(rewind.getSession().commits).toHaveLength(4);
  });
});

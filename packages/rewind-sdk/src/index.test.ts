import { describe, expect, it } from 'vitest';
import { createRewindEngine } from './index';

type Catalog = { products: Array<{ id: string; label: string }> };

function makeEngine() {
  const engine = createRewindEngine<Catalog>({
    initialState: { products: [{ id: 'p1', label: 'New' }, { id: 'p2', label: 'Core' }] },
    now: () => 1,
  });
  engine.registerMutation({
    name: 'bulk_set_label',
    description: 'Set a label on products',
    inputSchema: { type: 'object', properties: { label: { type: 'string' } } },
    mutate: (state, input) => {
      const label = String(input.label);
      return {
        state: { products: state.products.map((product) => ({ ...product, label })) },
        summary: `Labeled ${state.products.length} products as ${label}`,
        effects: [{ label: 'Product label', count: state.products.length, before: 'Mixed', after: label }],
      };
    },
  });
  return engine;
}

describe('@rewind/webmcp background engine', () => {
  it('automatically commits every mutating tool call', () => {
    const engine = makeEngine();
    const result = engine.invoke('bulk_set_label', { label: 'Summer sale' });
    const session = engine.getSession();

    expect(result.commitId).toBe('c001');
    expect(session.commits).toHaveLength(2);
    expect(session.current.products.every((product) => product.label === 'Summer sale')).toBe(true);
    expect(session.commits[1].beforeHash).not.toBe(session.commits[1].afterHash);
  });

  it('rewinds a bad action without deleting it from history', () => {
    const engine = makeEngine();
    engine.invoke('bulk_set_label', { label: 'Wrong label' });
    engine.rewindBefore('c001');

    const session = engine.getSession();
    expect(session.current.products.map((product) => product.label)).toEqual(['New', 'Core']);
    expect(session.commits).toHaveLength(2);
    expect(session.head).toBe('c000');
    expect(session.detached).toBe(true);
  });

  it('creates a branch when the agent continues after rewind', () => {
    const engine = makeEngine();
    engine.invoke('bulk_set_label', { label: 'Wrong label' });
    engine.rewindBefore('c001');
    const retry = engine.invoke('bulk_set_label', { label: 'Summer 2026' });

    expect(retry.branchCreated).toBe('branch-1');
    expect(engine.getSession().commits).toHaveLength(3);
    expect(engine.getSession().current.products[0].label).toBe('Summer 2026');
  });

  it('discovers every WebMCP tool and reports logging coverage honestly', async () => {
    const engine = makeEngine();
    const tools = await engine.discoverTools({
      registerTool: async () => undefined,
      getTools: async () => [
        {
          name: 'bulk_set_label',
          description: 'Tracked mutation',
          inputSchema: { type: 'object' },
          origin: 'https://shop.example',
          annotations: { readOnlyHint: false },
        },
        {
          name: 'third_party_search',
          description: 'Tool registered outside Rewind',
          inputSchema: { type: 'object' },
          origin: 'https://shop.example',
          annotations: { readOnlyHint: true },
        },
      ],
    });

    expect(tools).toHaveLength(2);
    expect(tools[0].coverage).toBe('tracked');
    expect(tools[1].coverage).toBe('discovered');
    expect(tools[1].readOnly).toBe(true);
  });
});

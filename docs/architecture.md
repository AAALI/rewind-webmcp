# Architecture and maintenance guide

Rewind is split into a reusable SDK and a demonstration host. The SDK knows how to record and restore application state; the host owns domain rules, rendering, and any real-world side effects.

## Runtime flow

1. A host creates a `RewindEngine` with its initial state and optional persistence.
2. The host registers read tools and mutation tools.
3. `connectWebMCP()` exposes those tools, plus `rewind_history` and `rewind_restore`, through `document.modelContext` when the browser supports WebMCP.
4. A mutation clones the current state, validates and applies the host mutation, and records a commit containing the before/after snapshots, hashes, effects, and parent/branch identifiers.
5. Restoring moves the active state to an earlier snapshot without deleting the original commits. The next mutation from a restored point creates a retry branch.
6. Subscribers render the current host state and the optional history panel. `localStoragePersistence()` can retain the session across reloads.

The core types and engine live in `packages/rewind-sdk/src/index.ts`. The optional UI is in `packages/rewind-sdk/src/panel.ts`.

## State ownership

The host remains the source of truth for domain behavior. A mutation receives a cloned state and input, then returns:

```ts
{
  state: nextState,
  summary: 'Human-readable description',
  effects: [
    { label: 'Cart total', kind: 'changed', before: '$57', after: '$114' },
  ],
}
```

State hashes are deterministic checksums for comparison and display, not cryptographic proof. Persistence is browser-local by default and is not a tamper-resistant audit system.

For an external system such as Shopify, restoring a client snapshot is insufficient. Integrate at the authoritative mutation boundary and implement a compensating action that recreates the earlier external state. The [Vercel Shop integration note](../integrations/vercel-shop.md) describes that boundary.

## Demo application

`examples/catalog/webmcp.ts` defines the storefront tools and wires them to one `RewindEngine`. `examples/catalog/main.ts` renders the shop, subscribes to state changes, mounts the history panel, and offers contextual Undo after an agent mutation.

The built-in assistant is optional:

- `examples/catalog/copilot.ts` sends the prompt and discovered tool context to `/api/copilot`.
- `api/copilot.mjs` asks the configured OpenAI model for tool calls.
- The browser executes those calls through the page's WebMCP context.
- `scripts/dev-full.mjs` mounts the same handler into Vite for local full-stack testing.

Provider credentials stay server-side. Do not use a `VITE_` prefix for secrets.

## Build outputs

`npm run build` performs four stages:

1. Compile the SDK package to `packages/rewind-sdk/dist/`.
2. Build browser-ready ESM SDK bundles into `sdk-dist/`.
3. Type-check the applications.
4. Build the website and copy the hosted SDK bundles into `dist/sdk/`.

All generated directories are ignored. Recreate them from source rather than committing them.

## Compatibility contracts

- Persisted sessions currently use `version: 1`. A schema change needs an explicit migration or a new persistence key.
- Tool names must contain only WebMCP-safe letters, numbers, `_`, `.`, or `-`, with a maximum length of 128 characters.
- Read tools do not create commits; mutation tools do.
- Failed validation must leave state and history unchanged.
- Restoring history must retain abandoned commits so later work can form a branch.
- Real irreversible side effects must not be described as reversible snapshot changes.

## Verification

Run `npm test` for engine, search, and cart-validation coverage. Run `npm run build` to verify SDK compilation, declarations, hosted bundles, TypeScript, and both web entry points.

For manual verification, use the storefront in a WebMCP-capable browser:

1. Add a product through `update_cart`.
2. Confirm the cart offers **Undo agent changes**.
3. Restore the previous state and confirm the action remains in history.
4. Make another change and confirm it appears on a retry branch.
5. Reload and confirm persisted state is restored.

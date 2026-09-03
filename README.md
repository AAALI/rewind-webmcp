# Rewind

Git-style recovery for WebMCP products. Rewind is a small TypeScript SDK that silently turns every agent mutation into a restorable commit. The host UI stays unchanged until a person opens the action history or needs to undo a mistake.

## Demo

The live prototype uses the products and visual language of the hackathon's official [Vercel Shop](https://github.com/vercel/shop) example, which is backed by Shopify and Hydrogen. Ask the shop copilot to find products, choose a size, and update your cart. If the agent does something you didn’t ask for, the normal cart surfaces an **Undo agent changes** action that restores the previous state in one click. The reverted action remains in the audit history.

This local prototype uses the official example's public product data with an in-browser cart so judges can test the recovery loop without credentials. A production fork needs Shopify storefront credentials and should record/compensate at Vercel Shop's cart mutation boundary; see [the integration note](./integrations/vercel-shop.md).

```bash
npm install
npm run dev
```

- Landing page: `http://127.0.0.1:5173/`
- Shopify cart demo: `http://127.0.0.1:5173/examples/catalog/`

Do not open the example as a `file://` page; Vite must serve its TypeScript modules.

## SDK

```ts
import { createRewindEngine, mountRewindPanel } from '@rewind/webmcp';

const rewind = createRewindEngine({ initialState });

rewind.registerMutation({
  name: 'bulk_set_product_label',
  description: 'Set a label on matching products',
  inputSchema: { type: 'object', properties: { label: { type: 'string' } } },
  mutate: (state, input) => ({
    state: updateLabels(state, input.label),
    summary: `Updated product labels`,
  }),
});

mountRewindPanel(rewind, document.querySelector('#rewind'));
await rewind.connectWebMCP();
```

The SDK provides automatic commits, deterministic state hashes, local persistence, restore, branch-on-retry, an on-demand history drawer, and built-in `rewind_history` and `rewind_restore` WebMCP tools.

## SDK hosting

The SDK is published as **`@rewind/webmcp`** and is also available as a single-file ESM bundle from the deployed site.

| Source | URL / command |
|--------|---------------|
| npm package | `npm install @rewind/webmcp` |
| ESM bundle | `https://rewind-webmcp.netlify.app/sdk/rewind-sdk.mjs` |
| Panel bundle | `https://rewind-webmcp.netlify.app/sdk/rewind-sdk-panel.mjs` |

The ESM bundle is generated during `npm run build` and copied into `dist/sdk/`, so Netlify serves it alongside the website.

## Deploy

The site is configured for **Netlify**. Connect the repo and set the build command:

```bash
npm run build
```

Publish directory: `dist`.

Set these environment variables in the Netlify UI:

- `OPENAI_API_KEY` — server key used by `/.netlify/functions/copilot` to plan agent tool calls.
- `OPENAI_MODEL` — optional, defaults to `gpt-4o-mini`.

The catalog demo is a client-side app, so `netlify.toml` rewrites `/examples/catalog/*` to `/examples/catalog/index.html` and falls back to `/index.html` for the landing page. Existing files (such as `/sdk/*.mjs`) are served first.

## Publish the SDK to npm

Releases are published automatically by `.github/workflows/publish-sdk.yml` when you publish a GitHub Release. Add an `NPM_TOKEN` secret to the repository first.

To publish manually:

```bash
npm run build:sdk
npm publish --workspace packages/rewind-sdk --access public
```

## Verify

```bash
npm test
npm run build
```

## License

MIT

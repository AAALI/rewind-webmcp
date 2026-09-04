# Rewind

Git-style recovery for WebMCP products. Rewind is a small TypeScript SDK that silently turns every agent mutation into a restorable commit. The host UI stays unchanged until a person opens the action history or needs to undo a mistake.

## Demo

- Live demo: https://rewind-webmcp.vercel.app/examples/catalog/
- Landing page: https://rewind-webmcp.vercel.app/
- Public source: https://github.com/AAALI/rewind-webmcp

The live prototype uses the products and visual language of the hackathon's official [Vercel Shop](https://github.com/vercel/shop) example, which is backed by Shopify and Hydrogen. Ask the shop copilot to find products, choose a size, and update your cart. If the agent does something you didn’t ask for, the normal cart surfaces an **Undo agent changes** action that restores the previous state in one click. The reverted action remains in the audit history.

This local prototype uses the official example's public product data with an in-browser cart so judges can test the recovery loop without credentials. A production fork needs Shopify storefront credentials and should record/compensate at Vercel Shop's cart mutation boundary; see [the integration note](./integrations/vercel-shop.md).

```bash
npm install
npm run dev
```

- Landing page: `http://127.0.0.1:5173/`
- Shopify cart demo: `http://127.0.0.1:5173/examples/catalog/`

For the complete local app, put `OPENAI_API_KEY` in an ignored `.env` file and run `npm run dev:full`. It serves the storefront and the same copilot handler used in production at `http://127.0.0.1:5174`. Credentials stay on the server. `npm run dev` serves only the storefront and external WebMCP tools; it does not run the AI endpoint.

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

The SDK source lives in the **`@rewind/webmcp`** workspace and is available as a single-file ESM bundle from the deployed site. It is not currently published on npm.

| Source | URL / command |
|--------|---------------|
| Local workspace | `npm install` at the repository root |
| ESM bundle | `https://rewind-webmcp.vercel.app/sdk/rewind-sdk.mjs` |
| Panel bundle | `https://rewind-webmcp.vercel.app/sdk/rewind-sdk-panel.mjs` |

The ESM bundle is generated during `npm run build` and copied into `dist/sdk/`, so Vercel serves it alongside the website.

## Deploy

The site is configured for **Vercel**. Connect the repo and set the build command:

```bash
npm run build
```

Output directory: `dist`.

Set these environment variables in the Vercel project dashboard:

- `OPENAI_API_KEY` — server key used by `/api/copilot` to plan agent tool calls.
- `OPENAI_MODEL` — optional, defaults to `gpt-4o-mini`.

The catalog demo is a client-side app, so `vercel.json` rewrites `/examples/catalog/*` to `/examples/catalog/index.html` and falls back to `/index.html` for the landing page. Existing files (such as `/sdk/*.mjs`) are served first.

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

### Judge walkthrough

Open the live demo in a WebMCP-capable browser. The event recommends Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled, or a compatible in-app browser. No shop login is needed.

1. Ask an agent to call `search_catalog` with `{"query":"black","max_price":80}`.
2. Call `update_cart` with `{"items":[{"product_id":"vistamesh","quantity":1,"size":"XL"}]}`.
3. Open **Bag**: the cart contains one XL VistaMesh Tee for $57. Click **Undo agent changes** to restore the prior cart.
4. Open **Action log** to inspect the retained action and its before/after effects.
5. Make another cart change. `rewind_history` shows a retry branch; `rewind_restore` accepts a commit ID from that history. Reload to verify browser-local persistence.

Only registered mutations are recorded. The demo restores local state, uses non-cryptographic state checksums, and does not place or reverse real orders or payments. The checkout and order-history screens are illustrative. Product images are served from the upstream Shopify CDN.

## License

MIT

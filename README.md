# Rewind

Git-style recovery for WebMCP products. Rewind is a small TypeScript SDK that silently turns every agent mutation into a restorable commit. The host UI stays unchanged until a person opens the action history or needs to undo a mistake.

## Demo

The live prototype uses the products and visual language of the hackathon's official [Vercel Shop](https://github.com/vercel/shop) example, which is backed by Shopify and Hydrogen. Ask the agent for a running outfit under $200: it mistakenly adds eight products totaling $789, the normal cart opens at the point of impact, and one contextual **Undo agent changes** action restores the cart. The reverted action remains in history.

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

## Verify

```bash
npm test
npm run build
```

## License

MIT

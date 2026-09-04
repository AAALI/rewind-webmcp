# Rewind

Local preparation document. A curated project description, title, tagline, technologies, and links have now been saved to https://devpost.com/software/rewind-01wez3 and verified by readback. Final submission is still pending.

## One-line Summary

Undo for the agentic web: a TypeScript SDK that records WebMCP cart changes, restores earlier state, and preserves the history when an agent retries.

## Problem

A shopping agent can change a cart faster than a shopper can inspect it. When the result is wrong, asking the agent to fix itself is another uncertain operation. People need a direct way to return to the state they understood.

## Solution

Rewind wraps application mutations with before-and-after snapshots. The demo exposes a storefront through WebMCP: agents can search products, inspect variants, replace a cart, and read its contents. Each registered cart mutation creates a commit. The shopper can click **Undo agent changes** inside the cart, then inspect the retained action in the history drawer. A new mutation after a restore creates a retry branch instead of erasing the earlier attempt.

## Why This Matters

WebMCP gives the application an explicit boundary for an agent's actions. Rewind uses that boundary to record exactly which tool changed application state. The agent handles discovery and cart changes; the person keeps an immediate, deterministic recovery control in the same interface. This is useful for developers adding agent actions to existing products, and for shoppers who want help without losing control of their cart.

The contribution is the recovery SDK and its integration into the cart experience. The storefront uses product data and visual references from Vercel Shop; it is a standalone prototype with a browser-local cart, not a live Shopify store.

## How We Used AI

The optional built-in shop copilot sends the shopper's prompt, current product/cart context, and discovered tool schemas to a server-side OpenAI Responses API endpoint. It returns proposed tool calls, executes those calls through the page's WebMCP API, and sends results back for the next step. The configured default model in the source is `gpt-4o-mini`; deployments may override it. An external browser agent can also call the WebMCP tools directly, without using the built-in planner.

## How We Used Codex

For this submission review, Codex inspected the SDK, storefront, and deployment configuration; tested real WebMCP calls in the Codex in-app browser; reproduced and fixed a retry/Undo bug; added cart-validation regression tests; and prepared the judge instructions and this draft. Earlier build-process details should be added by the author if desired; they have not been inferred from commit messages.

## Key Features

- Ten store tools plus `rewind_history` and `rewind_restore`.
- Automatic snapshots for mutations registered through Rewind.
- Contextual Undo in the cart, before/after effects, and an on-demand history drawer.
- Retry branches that preserve earlier attempts.
- Browser-local persistence across reloads.
- TypeScript source workspace and downloadable ESM bundles.

## Architecture

The landing page uses React and Vite. The demo storefront uses TypeScript. `examples/catalog/webmcp.ts` defines store tools; `packages/rewind-sdk/src/index.ts` registers them with `document.modelContext.registerTool`, records mutation commits, and implements restoration. `panel.ts` renders the history interface. The live site is hosted on Vercel; `api/copilot.mjs` implements the optional AI planner. Shopify CDN images are external assets.

Built with: TypeScript, JavaScript, React, Vite, WebMCP, OpenAI API, Vercel, Vitest, CSS.

## Testing Instructions

No login is required. Open https://rewind-webmcp.vercel.app/examples/catalog/ in a WebMCP-capable in-app browser or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled and the browser restarted.

1. Ask the page agent to call `search_catalog` with `{"query":"black","max_price":80}`. It returns the VistaMesh Tee at $57. The built-in assistant also accepts “Find black products under $80”.
2. Call `get_cart` and note its current lines. Then call `update_cart` with `{"items":[{"product_id":"vistamesh","quantity":1,"size":"XL"}]}`. This replaces the demo cart; it does not place an order.
3. Open **Bag**. Verify one VistaMesh Tee, size XL, total $57, and **Undo agent changes**.
4. Click **Undo agent changes**. Verify the prior cart is restored. Open **Action log** to see that the reverted action still exists.
5. Call `update_cart` again with `{"items":[{"product_id":"vistamesh","quantity":2,"size":"M"}]}`. Verify a new retry branch through `rewind_history`, and verify Undo remains available. This last UI behavior requires the reviewed fixes to be deployed.
6. Call `rewind_restore` with an earlier ID from `rewind_history`. Verify `get_cart` reflects that snapshot. Reload to check persistence.

For source verification: Node 22, `npm ci`, `npm test`, and `npm run build`. `npm run dev` serves the storefront and external WebMCP tools. It does not serve the AI endpoint; use the live demo or `npm run dev:full` with a server-side `OPENAI_API_KEY` for the built-in copilot.

## Public Demo Link

https://rewind-webmcp.vercel.app/examples/catalog/

Landing page: https://rewind-webmcp.vercel.app/

## Public Repository Link

https://github.com/AAALI/rewind-webmcp

Public access and GitHub's MIT license detection were verified on September 4, 2026.

## Demo Video

TODO: Add a public YouTube URL. Required: less than three minutes, with spoken audio explaining the working demo and WebMCP implementation. See `docs/demo-video-script.md`.

## Screenshot Shot List

Assets still to capture or choose; no screenshot or thumbnail has been uploaded.

1. Agent-created cart with size XL and contextual Undo visible.
2. Restored cart and retained action history.
3. Retry branch with before/after effects in the history drawer.

## Submission Readiness Notes

The registered account's only WebMCP project was an empty pre-draft with no title, description, video, or recorded submission timestamp at review time. Code fixes are local and still need publishing. The project description, title, tagline, technologies, and links have since been saved to Devpost; the video and personal submission answers remain outstanding. The author subsequently logged in, and the specific management URL confirmed the Rewind project and preview link. Judge instructions, live URL, repository URL, tested clients, and AI-tools answers were also saved and read back in the Additional info form.

## Known Limitations

- Recovery restores the state owned by this local demo; it does not reverse payments, orders, or external Shopify mutations. Checkout and order history are illustrative screens.
- State hashes are deterministic FNV-style checksums, not cryptographic evidence. Local history is not tamper-proof.
- Only mutations registered through Rewind are recorded. Read-tool calls are discoverable but do not create commits.
- The SDK is not published to npm. Use the source workspace or hosted ESM bundles.
- The built-in copilot depends on the server API key and provider availability. Its public endpoint has no application-level rate limiting. Direct external WebMCP calls do not depend on that endpoint.
- Browser API support differs; direct calls were verified with Codex's in-app browser, not separately with Chrome or the ChatGPT desktop app.
- Product images are loaded from the upstream Shopify CDN. The author should confirm permission for third-party assets and branding in the final video.

## TODO Official Form Fields

The live Devpost schema was read for The WebMCP Challenge. Use these answers after author review; do not invent the personal responses.

| Field ID | Field | Draft answer / action |
| --- | --- | --- |
| 28249 | Submitter Type | Author to choose Individual, Team of Individuals, or Organization. |
| 28250 | Country of residence | Author to supply residence for all members; timezone is not evidence of residence. |
| 28251 | Organization name | Only if applicable. |
| 28252 | App Status | Proposed New: earliest repository commit is September 3, 2026. Author to confirm no earlier project existed. |
| 28253 | Existing-project changes | If Existing, document prior work and dated WebMCP additions. |
| 28254 | Live URL | https://rewind-webmcp.vercel.app/examples/catalog/ |
| 28255 | Testing instructions | Use the Testing Instructions above after deployment. No credentials required. |
| 28256 | Public code repository | https://github.com/AAALI/rewind-webmcp |
| 28257 | Agents / clients tested | Codex in-app browser: direct WebMCP search, cart update/read, history, restore, and retry calls. Built-in OpenAI shop copilot: live search. |
| 28258 | AI tools used | OpenAI API in the shop copilot; Codex for review, fixes, browser verification, tests, and submission preparation. Author to add other tools used earlier. |
| 28259 | Level of learning | Author to choose None, Moderate, or Significant. |
| 28260 | AI career value | Author to choose Yes or No. |

Rules/eligibility acknowledgment must come from the author. No agreement has been recorded by this review. Final submission requires explicit confirmation.

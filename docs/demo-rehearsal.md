# Rewind functional rehearsal — September 4, 2026

## Result

The corrected local application completed the intended video flow using its real built-in OpenAI copilot and browser WebMCP execution. The production site still runs the earlier build and needs deployment before final recording.

## Verified sequence

| Step | Input or action | Observed result |
| --- | --- | --- |
| Find and add | “Find the black VistaMesh Tee, show it in XL, and put exactly one in my cart.” | Product page opens with XL selected; cart contains 1 XL tee; total $57. Assistant reports search_catalog → show_variant → update_cart. |
| Deliberate change | “Replace my cart with exactly three VistaMesh Tees in size M.” | Product page selects M; cart becomes 3 M tees; total $171. |
| Inspect | View action | Current commit selected; before/after shows 1 → 3 and $57 → $171. |
| Undo | Undo agent changes | Cart restored to 1 XL tee and $57. The three-item attempt remains in history. |
| Retry | “Replace my cart with exactly two VistaMesh Tees in size XL.” | Cart becomes 2 XL tees and $114; new retry branch; Undo remains available. |
| Inspect retry | View action | Current retry commit selected; retained prior attempts visible; effects show 1 → 2 and $57 → $114. |

Client: Codex in-app browser. Backend: scripts/dev-full.mjs serving the same api/copilot.mjs handler used by Vercel. API credentials loaded server-side from the ignored local environment. No simulated model or tool responses were used.

The prior review separately verified direct WebMCP restore/read/history and local persistence across reloads.

## Issues found and resolved during this rehearsal

- Production search failed for “black VistaMesh Tee” because the implementation matched one ordered substring. Search now matches all query words independently, so color/name order and repeated spaces work in both WebMCP and the visible catalog search. Added regression coverage.
- The recommended Vercel development command was broken by catch-all rewrites intercepting Vite module requests. Added `npm run dev:full` to serve the real copilot handler alongside Vite without those deployment rewrites, and updated README instructions.
- View action opened the initially selected commit even after a newer mutation. Opening history now selects the current head; explicitly selecting older commits still works.
- Read-only tools were labeled “logged” although only mutation tools create commits. The ledger now distinguishes recorded mutations, read-only tools, and restore.

## Validation

- 21 unit tests pass across SDK, cart validation, and product search.
- TypeScript, SDK bundles, and production Vite build pass.
- The cart and history drawer were visually inspected at 1280×720.
- The rehearsal sequence above was exercised in the browser against real model responses.

## Record next

Use docs/demo-video-script.md for exact prompts, timings, narration, and crop instructions. Start with clean browser-local state, and record the corrected deployment once it is published. Focus on the cart, restoration, and retained retry history. Do not present illustrative checkout/order screens as completed commerce features.

# Rewind recording plan — 2 minutes 15 seconds

The story: **an agent changes the cart; a person restores it; the agent retries without erasing history.**

Use the corrected app. The full rehearsal runs with `npm run dev:full` at http://127.0.0.1:5174/examples/catalog/. Set `OPENAI_API_KEY` in the ignored `.env` file first. The public site still needs these fixes deployed before the final recording/submission.

Use a fresh browser session so the cart and action log start empty. A new tab alone does not clear localStorage. Record a desktop viewport around 1280×720 or larger. Leave browser zoom at 100%; crop into the cart/history for the important numbers. Keep the actual agent calls visible, cut waiting time, and never imply the deliberate test change was a spontaneous AI mistake.

## Exact prompts to paste

1. `Find the black VistaMesh Tee, show it in XL, and put exactly one in my cart.`
2. `Replace my cart with exactly three VistaMesh Tees in size M.`
3. After Undo: `Replace my cart with exactly two VistaMesh Tees in size XL.`

Between prompts, close the cart. If a result card is showing, dismiss it, then open **Ask Vercel Shop**. The `/` shortcut also opens smart search when focus is outside a text field.

## Shot list and narration

| Time | Show and do | Narration |
| --- | --- | --- |
| 0:00–0:15 | Paste prompt 1. Cut the wait. Show the agent opening the tee with XL selected and the cart at **1 item / XL / $57**. | “This agent just found a product, selected my size, and changed my cart through WebMCP. Rewind gives me a way back from that action.” |
| 0:15–0:35 | Close the cart to reveal the assistant result and tool names. Paste prompt 2 and cut to **3 items / M / $171**. | “I'll deliberately request the wrong quantity and size to demonstrate recovery. The agent makes a real cart change, and Rewind records its before and after state.” |
| 0:35–0:55 | Click **View action**. Show **1 → 3** and **$57 → $171**. Close history. | “The change is inspectable: which tool ran, what changed, and which state came before it.” |
| 0:55–1:10 | Click **Undo agent changes** in the cart. Hold on **Cart restored**, **1 item / XL / $57**. | “One click restores the previous cart—including the original size and quantity. I don't have to ask the model to reconstruct it.” |
| 1:10–1:35 | Paste prompt 3. Show **2 items / XL / $114**. Open **View action**. Point to the new retry branch and the retained three-item attempt. | “Now the agent tries again. Rewind creates a retry branch. The earlier attempt is still in the history, and this new change can be undone too.” |
| 1:35–1:55 | Show the history drawer's live tool inventory, then a brief source view of `connectWebMCP` in `packages/rewind-sdk/src/index.ts`. | “The SDK wraps mutations registered with document.modelContext.registerTool. Ten store tools and two recovery tools are exposed to the browser. Registered mutations create commits; read tools don't.” |
| 1:55–2:15 | Return to the working cart; finish on the landing page/repository link. | “This demo restores browser-local state. It doesn't reverse real Shopify orders or payments. Rewind is an MIT-licensed TypeScript SDK for a simple idea: agents can act, and people keep a way back.” |

On a fresh session, expect c001 for the first cart, c002 for the deliberate change, and c003 on retry-1 after Undo. IDs differ if the session already contains history; narrate the relationship, not hard-coded IDs.

## What stays out of the video

- Checkout/payment and order-management screens: they are illustrative, not completed commerce flows.
- Claims of real Shopify rollback, cryptographic audit proof, recording every read call, or an npm release.
- Browser setup, environment files, Devpost forms, long loading screens, and a tour of every product.
- Any claim the AI accidentally made the demonstrated mistake; we deliberately requested it.

## Before exporting

Verify the footage shows the state transitions above. Keep spoken narration audible, total length below 3:00, and publish on YouTube with Public visibility. Confirm permission for third-party branding/assets. Check the video while signed out, then add its URL to Devpost. Record the final deployed build so the video and judge-facing URL match.

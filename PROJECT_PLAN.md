# Rewind — hackathon plan

## One-sentence product

A drop-in SDK that gives every WebMCP product a Git-style action history, so people can inspect or rewind an agent mistake without asking the agent to fix its own work.

## MVP

1. Automatically commit every mutating WebMCP tool with before/after snapshots, effects and hashes.
2. Keep recording entirely in the background.
3. Expose a small history drawer only when a person asks for it.
4. Restore the state immediately before any selected action.
5. Keep the reverted action in the audit trail and create a branch when the agent continues.
6. Demonstrate the SDK at the point of impact inside the official Vercel Shop + Shopify commerce example.

## Demo video (60–75 seconds)

1. **Hook:** “Add this product in XL to my cart.”
2. Show the official Vercel Shop + Shopify example and the user request.
3. Let the agent call `show_variant` and `update_cart`; the cart opens with the requested product and size.
4. The shopper notices the agent picked the wrong size; the contextual message offers **Undo agent changes**.
5. Click **Undo agent changes** once; the cart returns to its previous state immediately.
6. Open action history to prove the reverted `update_cart` commit remains in the audit trail.
7. Close on the SDK integration: “Record silently. Recover where the damage appears.”

## Definition of done

- SDK compiles as its own package.
- Mutation, rewind, and branch behavior are covered by tests.
- Home and catalog routes build for production.
- The Shopify cart demo can surface, explain and undo an incorrect agent action in one recovery click.
- Real WebMCP registration is attempted when `document.modelContext` is available.

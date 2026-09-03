# Vercel Shop integration

The WebMCP Challenge lists [Vercel Shop](https://github.com/vercel/shop) as its open-source storefront example. It is a real Next.js/Hydrogen storefront backed by Shopify. Shopify's WebMCP tools are shopper-facing: catalog search, navigation, cart updates, checkout and order navigation. They do not expose merchant product-label mutations.

## Production integration boundary

Vercel Shop ultimately routes cart writes through its cart action and `/api/cart` path. That is the reliable recovery boundary:

1. Read the current Shopify cart before a mutation.
2. Execute the cart mutation.
3. Read the resulting cart and record the before/after states as a Rewind commit.
4. Surface contextual Undo in the existing cart drawer.
5. Undo by issuing a compensating Shopify cart mutation that recreates the prior line quantities.
6. Keep the original action and the compensating action in the audit history.

The local demo implements this contract with an in-browser cart because the upstream template requires a Shopify store domain and Storefront API token. To turn it into the real hosted integration, fork Vercel Shop, enable `webmcp.isEnabled`, provide those credentials, and wrap its cart mutation boundary with the Rewind recorder. Do not claim that restoring a client snapshot alone reverses an external Shopify write.

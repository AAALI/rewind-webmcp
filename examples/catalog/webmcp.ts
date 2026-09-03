import { createRewindEngine, localStoragePersistence } from '@rewind/webmcp';
import { countFor, initialState, productFor, products, totalFor, type ShopState } from './store';

export type ShopDestination =
  | { page: 'home' }
  | { page: 'catalog'; collection?: string; query?: string; maxPrice?: number }
  | { page: 'product'; productId: string; size?: string }
  | { page: 'checkout' }
  | { page: 'orders' };

let navigateShop: (destination: ShopDestination) => void = () => undefined;

export const rewind = createRewindEngine<ShopState>({
  initialState,
  persistence: localStoragePersistence('rewind-vercel-shop-demo-v6'),
});

rewind.registerReadTool({
  name: 'search_catalog',
  description: 'Search the Shopify catalog by product name or color, optionally with a maximum per-item price.',
  inputSchema: { type: 'object', properties: { query: { type: 'string' }, max_price: { type: 'number' }, navigate: { type: 'boolean' } } },
  read: (_state, input) => {
    const query = String(input.query ?? '').toLowerCase();
    const maximum = Number(input.max_price ?? Number.POSITIVE_INFINITY);
    const matches = products.filter((product) => `${product.name} ${product.color} ${product.category}`.toLowerCase().includes(query) && product.price <= maximum);
    if (input.navigate === true) navigateShop({ page: 'catalog', query, maxPrice: Number.isFinite(maximum) ? maximum : undefined });
    return matches;
  },
});

rewind.registerReadTool({
  name: 'browse_store',
  description: 'List the store collections or browse products in a collection, and optionally show that collection to the shopper.',
  inputSchema: { type: 'object', properties: { collection: { type: 'string' }, navigate: { type: 'boolean' } } },
  read: (_state, input) => {
    const collection = String(input.collection ?? 'All');
    const matches = collection.toLowerCase() === 'all' ? products : products.filter((product) => product.category.toLowerCase() === collection.toLowerCase());
    if (input.navigate === true) navigateShop({ page: 'catalog', collection });
    return { collections: ['All', 'Outerwear', 'Sweats', 'Tops'], products: matches };
  },
});

rewind.registerReadTool({
  name: 'get_product',
  description: 'Get full product details and optionally open the product page for the shopper.',
  inputSchema: { type: 'object', properties: { product_id: { type: 'string' }, navigate: { type: 'boolean' } }, required: ['product_id'] },
  read: (_state, input) => {
    const product = productFor(String(input.product_id));
    if (input.navigate === true && product) navigateShop({ page: 'product', productId: product.id });
    return product ? { ...product, variants: ['XS', 'S', 'M', 'L', 'XL'], available: true } : null;
  },
});

rewind.registerReadTool({
  name: 'show_variant',
  description: 'Open a product page with a requested available size selected.',
  inputSchema: { type: 'object', properties: { product_id: { type: 'string' }, size: { type: 'string' } }, required: ['product_id'] },
  read: (_state, input) => {
    const product = productFor(String(input.product_id));
    if (product) navigateShop({ page: 'product', productId: product.id, size: String(input.size ?? 'M') });
    return product ? { product, selected_size: String(input.size ?? 'M'), available: true } : null;
  },
});

rewind.registerReadTool({
  name: 'get_cart',
  description: 'Read the shopper cart with product details, quantities, and total.',
  inputSchema: { type: 'object', properties: {} },
  read: (state) => ({
    lines: state.cart.map((line) => ({ ...line, size: line.size ?? 'M', product: productFor(line.productId) })),
    item_count: countFor(state.cart),
    total: totalFor(state.cart),
  }),
});

rewind.registerMutation({
  name: 'update_cart',
  description: 'Replace the shopper cart with requested product quantities. This action is logged and reversible.',
  inputSchema: {
    type: 'object',
    properties: { items: { type: 'array', items: { type: 'object', properties: { product_id: { type: 'string' }, quantity: { type: 'number' }, size: { type: 'string', enum: ['XS', 'S', 'M', 'L', 'XL'] } }, required: ['product_id', 'quantity'] } } },
    required: ['items'],
  },
  risk: 'medium',
  mutate: (state, input) => {
    const raw = Array.isArray(input.items) ? input.items : [];
    const cart = raw.map((item) => {
      const value = item as Record<string, unknown>;
      return { productId: String(value.product_id), quantity: Math.max(1, Number(value.quantity ?? 1)), size: String(value.size ?? 'M') };
    }).filter((line) => products.some((product) => product.id === line.productId));
    return {
      state: { ...state, cart, lastChangedBy: input.source === 'shopper' ? 'shopper' : 'agent' },
      summary: `Agent changed cart from ${countFor(state.cart)} to ${countFor(cart)} items`,
      effects: [
        { label: 'Cart items', kind: 'changed', before: countFor(state.cart), after: countFor(cart), count: cart.length },
        { label: 'Cart total', kind: 'changed', before: `$${totalFor(state.cart)}`, after: `$${totalFor(cart)}` },
      ],
    };
  },
});

rewind.registerMutation({
  name: 'cancel_cart',
  description: 'Remove every line from the shopper cart. This action is logged and reversible.',
  inputSchema: { type: 'object', properties: {} },
  risk: 'medium',
  mutate: (state, input) => ({
    state: { ...state, cart: [], lastChangedBy: input.source === 'shopper' ? 'shopper' : 'agent' },
    summary: `Agent cleared ${countFor(state.cart)} cart items`,
    effects: [{ label: 'Cart items', kind: 'removed', before: countFor(state.cart), after: 0, count: state.cart.length }],
  }),
});

rewind.registerReadTool({
  name: 'proceed_to_checkout',
  description: 'Take the shopper to checkout after verifying that the cart is not empty.',
  inputSchema: { type: 'object', properties: {} },
  read: (state) => {
    if (!state.cart.length) return { ok: false, reason: 'Cart is empty' };
    navigateShop({ page: 'checkout' });
    return { ok: true, item_count: countFor(state.cart), total: totalFor(state.cart) };
  },
});

rewind.registerReadTool({
  name: 'manage_orders',
  description: 'Take the shopper to their order history and tracking page.',
  inputSchema: { type: 'object', properties: {} },
  read: () => {
    navigateShop({ page: 'orders' });
    return { ok: true, order_count: 1 };
  },
});

rewind.registerReadTool({
  name: 'search_shop_policies_and_faqs',
  description: 'Answer questions about returns, shipping, exchanges, and store services.',
  inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  read: (_state, input) => {
    const query = String(input.query ?? '').toLowerCase();
    if (query.includes('return') || query.includes('exchange')) return { answer: 'Returns and exchanges are accepted within 30 days when items are unworn and tagged.' };
    if (query.includes('ship') || query.includes('delivery')) return { answer: 'Standard delivery is free over $100 and normally arrives in 3–5 business days.' };
    return { answer: 'Support is available Monday–Friday. Ask about shipping, returns, or exchanges.' };
  },
});

export async function connectShopTools(navigate: (destination: ShopDestination) => void) {
  navigateShop = navigate;
  return rewind.connectWebMCP();
}

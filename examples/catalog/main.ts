import { mountRewindPanel } from '@rewind/webmcp';
import { runCopilot, type CopilotStep } from './copilot';
import { collections, countFor, money, productFor, products, totalFor, type Product, type ShopState } from './store';
import { connectShopTools, rewind, type ShopDestination } from './webmcp';
import './styles.css';
import './experience.css';
import './copilot.css';

const app = document.querySelector<HTMLElement>('#app')!;
let view: ShopDestination = { page: 'home' };
let cartOpen = false;
let copilotOpen = true;
let copilotBusy = false;
let recovered = false;
let toolCount = 0;
let steps: CopilotStep[] = [{ role: 'agent', text: 'I can use this shop’s WebMCP tools. What would you like me to do?' }];

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function navigate(destination: ShopDestination) {
  view = destination;
  cartOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function undoLastAgentAction() {
  const last = [...rewind.getSession().commits].reverse().find((commit) => commit.actor === 'agent' && commit.toolName !== 'session_init');
  if (!last) return;
  rewind.rewindBefore(last.id);
  recovered = true;
  cartOpen = true;
  render();
}

function setCart(productId: string, quantity: number) {
  const state = rewind.getSession().current;
  const next = state.cart.filter((line) => line.productId !== productId);
  if (quantity > 0) next.push({ productId, quantity });
  rewind.invoke('update_cart', { items: next.map((line) => ({ product_id: line.productId, quantity: line.quantity })), source: 'shopper' });
  cartOpen = true;
}

async function submitPrompt(prompt: string) {
  const clean = prompt.trim();
  if (!clean || copilotBusy) return;
  steps = [...steps, { role: 'user', text: clean }];
  copilotBusy = true;
  recovered = false;
  render();
  try {
    const response = await runCopilot(clean);
    steps = [...steps, response];
    if (response.tools?.includes('update_cart') || response.tools?.includes('cancel_cart')) cartOpen = true;
  } catch (error) {
    steps = [...steps, { role: 'agent', text: error instanceof Error ? error.message : 'The tool call failed.' }];
  }
  copilotBusy = false;
  render();
}

function productGrid(items: Product[]) {
  return `<div class="product-grid">${items.map((product) => `<article data-product="${product.id}" tabindex="0"><div class="product-image"><img src="${product.image}" alt="${escapeHtml(product.name)} in ${escapeHtml(product.color)}"></div><div><strong>${escapeHtml(product.name)}</strong><span>${money(product.price)}</span></div><small>${escapeHtml(product.color)} · ${escapeHtml(product.category)}</small></article>`).join('')}</div>`;
}

function homeMarkup() {
  return `<main class="shop-main"><section class="hero"><div><span class="eyebrow">SPRING / SUMMER 2026</span><h1>Agentic Infrastructure<br>for Commerce</h1><p>Technical sportswear engineered for motion, recovery, and everything between.</p><button data-collection="All">Shop the collection <span>→</span></button></div></section><section class="collection-strip">${collections.slice(1).map((collection) => `<button data-collection="${collection}"><span>${collection}</span><b>Explore ${collection.toLowerCase()} →</b></button>`).join('')}</section><section class="products"><div class="section-head"><div><small>NEW ARRIVALS</small><h2>Built to keep moving.</h2></div><button data-collection="All">View all</button></div>${productGrid(products)}</section></main>`;
}

function catalogMarkup() {
  const collection = view.page === 'catalog' ? view.collection ?? 'All' : 'All';
  const query = view.page === 'catalog' ? view.query?.toLowerCase() ?? '' : '';
  const matches = products.filter((product) => (collection === 'All' || product.category === collection) && `${product.name} ${product.color} ${product.category}`.toLowerCase().includes(query));
  return `<main class="listing-page"><header><small>SHOP / ${escapeHtml(query ? 'SEARCH' : collection.toUpperCase())}</small><h1>${query ? `Results for “${escapeHtml(query)}”` : escapeHtml(collection)}</h1><p>${matches.length} products</p></header><nav class="collection-nav">${collections.map((item) => `<button class="${item === collection && !query ? 'active' : ''}" data-collection="${item}">${item}</button>`).join('')}</nav>${matches.length ? productGrid(matches) : '<div class="no-results"><strong>No products found</strong><p>Try a color, product type, or a broader search.</p></div>'}</main>`;
}

function productMarkup() {
  const id = view.page === 'product' ? view.productId : products[0].id;
  const product = productFor(id);
  return `<main class="product-page"><button class="breadcrumb" data-collection="${product.category}">← ${escapeHtml(product.category)}</button><section><div class="product-gallery"><img src="${product.image}" alt="${escapeHtml(product.name)}"></div><div class="product-info"><small>${escapeHtml(product.category)}</small><h1>${escapeHtml(product.name)}</h1><p class="product-price">${money(product.price)}</p><p class="product-description">${escapeHtml(product.description)}</p><div class="option"><div><strong>Color</strong><span>${escapeHtml(product.color)}</span></div><button class="swatch" aria-label="${escapeHtml(product.color)}"></button></div><div class="option sizes"><div><strong>Size</strong><a>Size guide</a></div><div>${['XS', 'S', 'M', 'L', 'XL'].map((size) => `<button class="${size === 'M' ? 'selected' : ''}">${size}</button>`).join('')}</div></div><button class="add-to-cart" data-add="${product.id}">Add to cart — ${money(product.price)}</button><details><summary>Product details</summary><p>Designed in California. Made from recycled performance fibers. Machine wash cold.</p></details><details><summary>Shipping & returns</summary><p>Free standard shipping over $100. Returns accepted within 30 days.</p></details></div></section></main>`;
}

function checkoutMarkup(state: ShopState) {
  if (!state.cart.length) return `<main class="empty-page"><small>CHECKOUT</small><h1>Your cart is empty.</h1><button data-collection="All">Continue shopping</button></main>`;
  return `<main class="checkout-page"><section><button class="checkout-logo" data-home>Vercel Shop</button><div class="checkout-steps"><b>Information</b><span>›</span><span>Shipping</span><span>›</span><span>Payment</span></div><form><h2>Contact</h2><input placeholder="Email or mobile phone number"><label><input type="checkbox"> Email me with news and offers</label><h2>Delivery</h2><select><option>United Arab Emirates</option></select><div><input placeholder="First name"><input placeholder="Last name"></div><input placeholder="Address"><div><input placeholder="City"><input placeholder="Postal code"></div><button type="button">Continue to shipping</button></form></section><aside>${state.cart.map((line) => { const product = productFor(line.productId); return `<article><div><img src="${product.image}" alt=""><i>${line.quantity}</i></div><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.color)} / M</small></span><b>${money(product.price * line.quantity)}</b></article>`; }).join('')}<div class="checkout-total"><p><span>Subtotal</span><b>${money(totalFor(state.cart))}</b></p><p><span>Shipping</span><b>Calculated next</b></p><p><strong>Total</strong><strong>${money(totalFor(state.cart))}</strong></p></div></aside></main>`;
}

function ordersMarkup() {
  return `<main class="account-page"><header><small>YOUR ACCOUNT</small><h1>Orders</h1><button>Sign out</button></header><article><div><small>ORDER #VS-1048</small><strong>Delivered August 22</strong></div><div class="order-product"><img src="${products[4].image}" alt=""><span><strong>${products[4].name}</strong><small>${products[4].color} · M</small></span><b>${money(products[4].price)}</b></div><footer><span>1 item · ${money(products[4].price)}</span><button>View order</button></footer></article></main>`;
}

function pageMarkup(state: ShopState) {
  if (view.page === 'catalog') return catalogMarkup();
  if (view.page === 'product') return productMarkup();
  if (view.page === 'checkout') return checkoutMarkup(state);
  if (view.page === 'orders') return ordersMarkup();
  return homeMarkup();
}

function cartMarkup(state: ShopState) {
  const total = totalFor(state.cart);
  const overBudget = Math.max(0, total - state.budget);
  const agentChanged = state.lastChangedBy === 'agent' && !recovered;
  return `<div class="cart-backdrop ${cartOpen ? 'visible' : ''}" data-close-cart></div><aside class="cart-drawer ${cartOpen ? 'open' : ''}" aria-label="Cart"><header><div><strong>Your cart</strong><small>${countFor(state.cart)} ${countFor(state.cart) === 1 ? 'item' : 'items'}</small></div><button data-close-cart aria-label="Close cart">×</button></header>${agentChanged ? `<section class="impact-alert ${overBudget ? '' : 'neutral'}"><div class="impact-title"><span>${overBudget ? '!' : '✓'}</span><div><strong>${overBudget ? 'This doesn’t match your request' : 'Agent changed your cart'}</strong><small>${countFor(state.cart)} items · ${money(total)}</small></div></div><p>${overBudget ? `Your budget was ${money(state.budget)}. This cart is <b>${money(overBudget)} over budget</b>.` : 'You can undo the complete agent action without sending another prompt.'}</p><div class="recovery-actions"><button class="undo" data-undo>Undo agent changes</button><button data-review>View action</button></div></section>` : ''}${recovered ? `<section class="restored"><span>✓</span><div><strong>Cart restored</strong><small>The action remains in the WebMCP log.</small></div><button data-review>View</button></section>` : ''}<section class="cart-lines">${state.cart.length ? state.cart.map((line) => { const product = productFor(line.productId); return `<article><img src="${product.image}" alt=""><div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.color)} · Qty ${line.quantity}</small><button data-remove="${product.id}">Remove</button></div><b>${money(product.price * line.quantity)}</b></article>`; }).join('') : `<div class="empty-cart"><span>□</span><strong>Your cart is empty</strong><p>Items you add will appear here.</p></div>`}</section><footer><div><span>Subtotal</span><strong>${money(total)}</strong></div><p>Taxes and shipping calculated at checkout</p><button data-checkout ${state.cart.length ? '' : 'disabled'}>Checkout</button></footer></aside>`;
}

function copilotMarkup() {
  return `<section class="copilot ${copilotOpen ? 'open' : ''}" aria-label="Shop copilot"><button class="copilot-launcher" data-copilot-open><span>✦</span> Shop copilot</button><div class="copilot-panel"><header><div><strong>Shop copilot</strong><small><i></i>${toolCount} site tools discovered</small></div><button data-copilot-close aria-label="Minimize copilot">—</button></header><div class="messages">${steps.map((step) => `<article class="${step.role}"><span>${step.role === 'agent' ? '✦' : 'You'}</span><div><p>${escapeHtml(step.text)}</p>${step.tools?.length ? `<small>${step.tools.map((tool) => `<code>${escapeHtml(tool)}</code>`).join(' → ')}</small>` : ''}</div></article>`).join('')}${copilotBusy ? '<article class="agent"><span>✦</span><div><p class="thinking"><i></i><i></i><i></i></p><small>discovering and calling tools</small></div></article>' : ''}</div><div class="suggestions"><button data-suggestion="Build me a lightweight running outfit under $200">Running outfit under $200</button><button data-suggestion="Find black products under $80">Find black products</button><button data-suggestion="What is your returns policy?">Returns policy</button></div><form><input aria-label="Message shop copilot" placeholder="Ask the shop agent…" autocomplete="off"><button aria-label="Send message">↑</button></form></div></section>`;
}

function attachEvents() {
  app.querySelectorAll<HTMLElement>('[data-home]').forEach((element) => element.addEventListener('click', () => navigate({ page: 'home' })));
  app.querySelectorAll<HTMLElement>('[data-collection]').forEach((element) => element.addEventListener('click', () => navigate({ page: 'catalog', collection: element.dataset.collection ?? 'All' })));
  app.querySelectorAll<HTMLElement>('[data-product]').forEach((element) => element.addEventListener('click', () => navigate({ page: 'product', productId: element.dataset.product! })));
  app.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((element) => element.addEventListener('click', () => setCart(element.dataset.add!, 1)));
  app.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((element) => element.addEventListener('click', () => setCart(element.dataset.remove!, 0)));
  app.querySelector<HTMLButtonElement>('[data-cart]')?.addEventListener('click', () => { cartOpen = true; render(); });
  app.querySelectorAll<HTMLElement>('[data-close-cart]').forEach((element) => element.addEventListener('click', () => { cartOpen = false; render(); }));
  app.querySelector<HTMLButtonElement>('[data-checkout]')?.addEventListener('click', () => navigate({ page: 'checkout' }));
  app.querySelectorAll<HTMLButtonElement>('[data-orders]').forEach((element) => element.addEventListener('click', () => navigate({ page: 'orders' })));
  app.querySelector<HTMLButtonElement>('[data-undo]')?.addEventListener('click', undoLastAgentAction);
  app.querySelectorAll<HTMLButtonElement>('[data-review]').forEach((button) => button.addEventListener('click', () => document.querySelector<HTMLButtonElement>('#rewind-root [data-rw-open]')?.click()));
  app.querySelector<HTMLFormElement>('.nav-search')?.addEventListener('submit', (event) => { event.preventDefault(); const input = app.querySelector<HTMLInputElement>('.nav-search input'); navigate({ page: 'catalog', query: input?.value.trim() ?? '' }); });
  app.querySelector<HTMLButtonElement>('[data-copilot-open]')?.addEventListener('click', () => { copilotOpen = true; render(); });
  app.querySelector<HTMLButtonElement>('[data-copilot-close]')?.addEventListener('click', () => { copilotOpen = false; render(); });
  app.querySelectorAll<HTMLButtonElement>('[data-suggestion]').forEach((button) => button.addEventListener('click', () => { void submitPrompt(button.dataset.suggestion ?? ''); }));
  app.querySelector<HTMLFormElement>('.copilot form')?.addEventListener('submit', (event) => { event.preventDefault(); const input = app.querySelector<HTMLInputElement>('.copilot input'); void submitPrompt(input?.value ?? ''); });
  const messages = app.querySelector<HTMLElement>('.messages');
  if (messages) messages.scrollTop = messages.scrollHeight;
}

function render() {
  const state = rewind.getSession().current;
  app.innerHTML = `<div class="shop"><div class="announcement">Free worldwide delivery on orders over $100</div><header class="nav"><button class="wordmark" data-home>Vercel Shop</button><nav><button data-collection="All">Shop</button><button data-collection="Outerwear">Outerwear</button><button data-collection="Tops">Tops</button></nav><form class="nav-search"><input aria-label="Search products" placeholder="Search products" value="${view.page === 'catalog' ? escapeHtml(view.query ?? '') : ''}"><button aria-label="Submit search">⌕</button></form><div class="webmcp-status"><i></i>WebMCP · ${toolCount}</div><div class="nav-actions"><button data-orders aria-label="Orders">Account</button><button class="cart-button" data-cart aria-label="Cart">Bag ${countFor(state.cart) ? `<i>${countFor(state.cart)}</i>` : ''}</button></div></header>${pageMarkup(state)}<footer class="site-foot"><div><strong>Vercel Shop</strong><span>High-performance commerce for the agentic web.</span></div><nav><button data-collection="All">Shop</button><button data-orders>Orders</button><a href="https://github.com/vercel/shop" target="_blank" rel="noreferrer">Official Vercel Shop ↗</a></nav></footer>${cartMarkup(state)}${copilotMarkup()}</div>`;
  attachEvents();
}

rewind.subscribe(render);
rewind.subscribeTools((tools) => { toolCount = tools.filter((tool) => !tool.name.startsWith('rewind_')).length; render(); });
mountRewindPanel(rewind, document.querySelector<HTMLElement>('#rewind-root')!, { title: 'WebMCP ledger' });
void connectShopTools(navigate);

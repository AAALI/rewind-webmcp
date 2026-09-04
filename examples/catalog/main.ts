import { mountRewindPanel } from '@rewind/webmcp';
import { runCopilot, type CopilotStep } from './copilot';
import { collections, countFor, matchesProductQuery, money, productFor, products, totalFor, type Product, type ShopState } from './store';
import { connectShopTools, rewind, type ShopDestination } from './webmcp';
import './styles.css';
import './experience.css';
import './copilot.css';

const app = document.querySelector<HTMLElement>('#app')!;
let view: ShopDestination = { page: 'home' };
let selectedSize = 'M';
let cartOpen = false;
let assistantMode: 'search' | 'chat' = 'search';
let smartOpen = true;
let copilotOpen = false;
let copilotBusy = false;
let recoveredHead: string | null = null;
let toolCount = 0;
let latestOutcome: CopilotStep | null = null;
let steps: CopilotStep[] = [{ role: 'agent', text: 'I can use this shop’s WebMCP tools. What would you like me to do?' }];
let copilotResponseId: string | undefined;

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function navigate(destination: ShopDestination) {
  view = destination;
  if (destination.page === 'product') selectedSize = destination.size ?? 'M';
  cartOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function undoLastAgentAction() {
  const session = rewind.getSession();
  const last = session.commits.find((commit) => commit.id === session.head);
  if (!last?.parentId || session.current.lastChangedBy !== 'agent') return;
  rewind.rewindBefore(last.id);
  recoveredHead = rewind.getSession().head;
  cartOpen = true;
  render();
}

function setCart(productId: string, quantity: number, size = selectedSize) {
  const state = rewind.getSession().current;
  const next = state.cart.filter((line) => line.productId !== productId);
  if (quantity > 0) next.push({ productId, quantity, size });
  rewind.invoke('update_cart', { items: next.map((line) => ({ product_id: line.productId, quantity: line.quantity, size: line.size ?? 'M' })), source: 'shopper' });
  cartOpen = true;
}

async function submitPrompt(prompt: string) {
  const clean = prompt.trim();
  if (!clean || copilotBusy) return;
  steps = [...steps, { role: 'user', text: clean }];
  copilotBusy = true;
  recoveredHead = null;
  render();
  try {
    const state = rewind.getSession().current;
    const currentProduct = view.page === 'product' ? productFor(view.productId) : null;
    const response = await runCopilot(clean, {
      page: view.page,
      currentProduct: currentProduct ? { id: currentProduct.id, name: currentProduct.name, color: currentProduct.color, price: currentProduct.price } : null,
      selectedSize: currentProduct ? selectedSize : null,
      cart: state.cart,
      cartTotal: totalFor(state.cart),
    }, copilotResponseId);
    copilotResponseId = response.responseId ?? copilotResponseId;
    steps = [...steps, { role: response.role, text: response.text, tools: response.tools }];
    latestOutcome = { role: response.role, text: response.text, tools: response.tools };
    if (assistantMode === 'search') smartOpen = false;
    if (response.tools?.includes('update_cart') || response.tools?.includes('cancel_cart')) cartOpen = true;
  } catch (error) {
    const failure: CopilotStep = { role: 'agent', text: error instanceof Error ? error.message : 'The tool call failed.' };
    steps = [...steps, failure];
    latestOutcome = failure;
    if (assistantMode === 'search') smartOpen = false;
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
  const maxPrice = view.page === 'catalog' ? view.maxPrice : undefined;
  const matches = products.filter((product) => (collection === 'All' || product.category === collection) && matchesProductQuery(product, query) && (maxPrice === undefined || product.price <= maxPrice));
  const resultTitle = query ? `Results for “${escapeHtml(query)}”` : maxPrice !== undefined ? `Products under ${money(maxPrice).replace('.00', '')}` : escapeHtml(collection);
  return `<main class="listing-page"><header><small>SHOP / ${escapeHtml(query || maxPrice !== undefined ? 'AI RESULTS' : collection.toUpperCase())}</small><h1>${resultTitle}</h1><p>${matches.length} ${matches.length === 1 ? 'product' : 'products'}</p></header><nav class="collection-nav">${collections.map((item) => `<button class="${item === collection && !query && maxPrice === undefined ? 'active' : ''}" data-collection="${item}">${item}</button>`).join('')}</nav>${matches.length ? productGrid(matches) : '<div class="no-results"><strong>No products found</strong><p>Try a color, product type, or a broader search.</p></div>'}</main>`;
}

function productMarkup() {
  const id = view.page === 'product' ? view.productId : products[0].id;
  const product = productFor(id);
  return `<main class="product-page"><button class="breadcrumb" data-collection="${product.category}">← ${escapeHtml(product.category)}</button><section><div class="product-gallery"><img src="${product.image}" alt="${escapeHtml(product.name)}"></div><div class="product-info"><small>${escapeHtml(product.category)}</small><h1>${escapeHtml(product.name)}</h1><p class="product-price">${money(product.price)}</p><p class="product-description">${escapeHtml(product.description)}</p><div class="option"><div><strong>Color</strong><span>${escapeHtml(product.color)}</span></div><button class="swatch" aria-label="${escapeHtml(product.color)}"></button></div><div class="option sizes"><div><strong>Size</strong><a>Size guide</a></div><div>${['XS', 'S', 'M', 'L', 'XL'].map((size) => `<button class="${size === selectedSize ? 'selected' : ''}" data-size="${size}">${size}</button>`).join('')}</div></div><button class="add-to-cart" data-add="${product.id}">Add size ${selectedSize} to cart — ${money(product.price)}</button><details><summary>Product details</summary><p>Designed in California. Made from recycled performance fibers. Machine wash cold.</p></details><details><summary>Shipping & returns</summary><p>Free standard shipping over $100. Returns accepted within 30 days.</p></details></div></section></main>`;
}

function checkoutMarkup(state: ShopState) {
  if (!state.cart.length) return `<main class="empty-page"><small>CHECKOUT</small><h1>Your cart is empty.</h1><button data-collection="All">Continue shopping</button></main>`;
  return `<main class="checkout-page"><section><button class="checkout-logo" data-home>Vercel Shop</button><div class="checkout-steps"><b>Information</b><span>›</span><span>Shipping</span><span>›</span><span>Payment</span></div><form><p>Demo checkout only. No payment or order will be placed. Do not enter personal details.</p><h2>Contact</h2><input placeholder="Email or mobile phone number"><label><input type="checkbox"> Email me with news and offers</label><h2>Delivery</h2><select><option>United Arab Emirates</option></select><div><input placeholder="First name"><input placeholder="Last name"></div><input placeholder="Address"><div><input placeholder="City"><input placeholder="Postal code"></div><button type="button">Continue to shipping</button></form></section><aside>${state.cart.map((line) => { const product = productFor(line.productId); return `<article><div><img src="${product.image}" alt=""><i>${line.quantity}</i></div><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.color)} / ${escapeHtml(line.size ?? 'M')}</small></span><b>${money(product.price * line.quantity)}</b></article>`; }).join('')}<div class="checkout-total"><p><span>Subtotal</span><b>${money(totalFor(state.cart))}</b></p><p><span>Shipping</span><b>Calculated next</b></p><p><strong>Total</strong><strong>${money(totalFor(state.cart))}</strong></p></div></aside></main>`;
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
  const recovered = rewind.getSession().head === recoveredHead;
  const agentChanged = state.lastChangedBy === 'agent' && !recovered;
  return `<div class="cart-backdrop ${cartOpen ? 'visible' : ''}" data-close-cart></div><aside class="cart-drawer ${cartOpen ? 'open' : ''}" aria-label="Cart"><header><div><strong>Your cart</strong><small>${countFor(state.cart)} ${countFor(state.cart) === 1 ? 'item' : 'items'}</small></div><button data-close-cart aria-label="Close cart">×</button></header>${agentChanged ? `<section class="impact-alert neutral"><div class="impact-title"><span>✓</span><div><strong>Agent changed your cart</strong><small>${countFor(state.cart)} items · ${money(total)}</small></div></div><p>You can undo the latest agent action without sending another prompt.</p><div class="recovery-actions"><button class="undo" data-undo>Undo agent changes</button><button data-review>View action</button></div></section>` : ''}${recovered ? `<section class="restored"><span>✓</span><div><strong>Cart restored</strong><small>The action remains in the WebMCP log.</small></div><button data-review>View</button></section>` : ''}<section class="cart-lines">${state.cart.length ? state.cart.map((line) => { const product = productFor(line.productId); return `<article><img src="${product.image}" alt=""><div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.color)} · ${escapeHtml(line.size ?? 'M')} · Qty ${line.quantity}</small><button data-remove="${product.id}">Remove</button></div><b>${money(product.price * line.quantity)}</b></article>`; }).join('') : `<div class="empty-cart"><span>□</span><strong>Your cart is empty</strong><p>Items you add will appear here.</p></div>`}</section><footer><div><span>Subtotal</span><strong>${money(total)}</strong></div><p>Taxes and shipping calculated at checkout</p><button data-checkout ${state.cart.length ? '' : 'disabled'}>Checkout</button></footer></aside>`;
}

function modeSwitchMarkup() {
  return `<div class="experience-switch" aria-label="Compare assistant experiences"><span>AI experience</span><button class="${assistantMode === 'search' ? 'active' : ''}" data-assistant-mode="search">Smart search</button><button class="${assistantMode === 'chat' ? 'active' : ''}" data-assistant-mode="chat">Chat</button></div>`;
}

function searchAssistantMarkup() {
  const outcome = latestOutcome && !smartOpen && !cartOpen ? `<aside class="assistant-outcome"><span>✦</span><div><strong>${escapeHtml(latestOutcome.text)}</strong>${latestOutcome.tools?.length ? `<small>${latestOutcome.tools.map((tool) => `<code>${escapeHtml(tool)}</code>`).join(' → ')}</small>` : ''}</div><button data-outcome-close aria-label="Dismiss result">×</button></aside>` : '';
  const launcher = outcome ? '' : '<button class="smart-launcher" data-smart-open><span>✦</span><strong>Ask Vercel Shop</strong><kbd>/</kbd></button>';
  return `<section class="smart-assistant ${smartOpen ? 'open' : ''} ${copilotBusy ? 'busy' : ''}" aria-label="AI smart search">${launcher}${smartOpen ? `<div class="smart-backdrop" data-smart-close><div class="smart-dialog" role="dialog" aria-modal="true" aria-label="Ask Vercel Shop"><header><span>✦</span><div><strong>${copilotBusy ? 'Working across the shop…' : 'What are you looking for?'}</strong><small>${toolCount} live store tools ready</small></div><button data-smart-close aria-label="Close smart search">×</button></header><form class="smart-form"><input aria-label="Ask Vercel Shop" placeholder="Try “find a black training top under $80”" autocomplete="off" ${copilotBusy ? 'disabled' : ''}><button aria-label="Search and act" ${copilotBusy ? 'disabled' : ''}>${copilotBusy ? '<i></i>' : '→'}</button></form><div class="smart-suggestions"><span>Try</span><button data-suggestion="Add this product in XL to my cart">Add this product in XL</button><button data-suggestion="Find black products under $80">Black products under $80</button><button data-suggestion="What is your returns policy?">Returns policy</button></div><footer><span>Results appear directly in the shop</span><code>WebMCP</code></footer></div></div>` : ''}${outcome}</section>`;
}

function chatAssistantMarkup() {
  return `<section class="copilot ${copilotOpen ? 'open' : ''}" aria-label="Shop copilot"><button class="copilot-launcher" data-copilot-open><span>✦</span> Shop copilot</button><div class="copilot-panel"><header><div><strong>Shop copilot</strong><small><i></i>${toolCount} site tools discovered</small></div><button data-copilot-close aria-label="Minimize copilot">—</button></header><div class="messages">${steps.map((step) => `<article class="${step.role}"><span>${step.role === 'agent' ? '✦' : 'You'}</span><div><p>${escapeHtml(step.text)}</p>${step.tools?.length ? `<small>${step.tools.map((tool) => `<code>${escapeHtml(tool)}</code>`).join(' → ')}</small>` : ''}</div></article>`).join('')}${copilotBusy ? '<article class="agent"><span>✦</span><div><p class="thinking"><i></i><i></i><i></i></p><small>discovering and calling tools</small></div></article>' : ''}</div><div class="suggestions"><button data-suggestion="Add this product in XL to my cart">Add this product in XL</button><button data-suggestion="Find black products under $80">Find black products</button><button data-suggestion="What is your returns policy?">Returns policy</button></div><form><input aria-label="Message shop copilot" placeholder="Ask the shop agent…" autocomplete="off"><button aria-label="Send message">↑</button></form></div></section>`;
}

function assistantMarkup() {
  return `${modeSwitchMarkup()}${assistantMode === 'search' ? searchAssistantMarkup() : chatAssistantMarkup()}`;
}

function attachEvents() {
  app.querySelectorAll<HTMLElement>('[data-home]').forEach((element) => element.addEventListener('click', () => navigate({ page: 'home' })));
  app.querySelectorAll<HTMLElement>('[data-collection]').forEach((element) => element.addEventListener('click', () => navigate({ page: 'catalog', collection: element.dataset.collection ?? 'All' })));
  app.querySelectorAll<HTMLElement>('[data-product]').forEach((element) => element.addEventListener('click', () => navigate({ page: 'product', productId: element.dataset.product! })));
  app.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((element) => element.addEventListener('click', () => setCart(element.dataset.add!, 1)));
  app.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((element) => element.addEventListener('click', () => { selectedSize = element.dataset.size ?? 'M'; render(); }));
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
  app.querySelector<HTMLButtonElement>('[data-smart-open]')?.addEventListener('click', () => { smartOpen = true; render(); });
  app.querySelectorAll<HTMLButtonElement>('[data-smart-close]').forEach((button) => button.addEventListener('click', (event) => { if (event.currentTarget === event.target) { smartOpen = false; render(); } }));
  app.querySelector<HTMLButtonElement>('[data-outcome-close]')?.addEventListener('click', () => { latestOutcome = null; render(); });
  app.querySelectorAll<HTMLButtonElement>('[data-assistant-mode]').forEach((button) => button.addEventListener('click', () => { assistantMode = button.dataset.assistantMode === 'chat' ? 'chat' : 'search'; copilotOpen = assistantMode === 'chat'; smartOpen = assistantMode === 'search'; latestOutcome = null; render(); }));
  app.querySelectorAll<HTMLButtonElement>('[data-suggestion]').forEach((button) => button.addEventListener('click', () => { void submitPrompt(button.dataset.suggestion ?? ''); }));
  app.querySelector<HTMLFormElement>('.smart-form')?.addEventListener('submit', (event) => { event.preventDefault(); const input = app.querySelector<HTMLInputElement>('.smart-form input'); void submitPrompt(input?.value ?? ''); });
  app.querySelector<HTMLFormElement>('.copilot form')?.addEventListener('submit', (event) => { event.preventDefault(); const input = app.querySelector<HTMLInputElement>('.copilot input'); void submitPrompt(input?.value ?? ''); });
  const messages = app.querySelector<HTMLElement>('.messages');
  if (messages) messages.scrollTop = messages.scrollHeight;
  if (assistantMode === 'search' && smartOpen && !copilotBusy) queueMicrotask(() => app.querySelector<HTMLInputElement>('.smart-form input')?.focus());
}

function render() {
  const state = rewind.getSession().current;
  app.innerHTML = `<div class="shop"><aside class="webmcp-notice"><strong>Run this demo in a WebMCP-enabled browser.</strong><span>Chrome 149+: open <code>chrome://flags/#enable-webmcp-testing</code>, choose Enabled, then relaunch Chrome.</span></aside><div class="announcement">Free worldwide delivery on orders over $100</div><header class="nav"><button class="wordmark" data-home>Vercel Shop</button><nav><button data-collection="All">Shop</button><button data-collection="Outerwear">Outerwear</button><button data-collection="Tops">Tops</button></nav><form class="nav-search"><input aria-label="Search products" placeholder="Search products" value="${view.page === 'catalog' ? escapeHtml(view.query ?? '') : ''}"><button aria-label="Submit search">⌕</button></form><div class="webmcp-status"><i></i>WebMCP · ${toolCount}</div><div class="nav-actions"><button data-orders aria-label="Orders">Account</button><button class="cart-button" data-cart aria-label="Cart">Bag ${countFor(state.cart) ? `<i>${countFor(state.cart)}</i>` : ''}</button></div></header>${pageMarkup(state)}<footer class="site-foot"><div><strong>Vercel Shop</strong><span>High-performance commerce for the agentic web.</span></div><nav><button data-collection="All">Shop</button><button data-orders>Orders</button><a href="https://github.com/vercel/shop" target="_blank" rel="noreferrer">Official Vercel Shop ↗</a></nav></footer>${cartMarkup(state)}${assistantMarkup()}</div>`;
  attachEvents();
}

rewind.subscribe(render);
rewind.subscribeTools((tools) => { toolCount = tools.filter((tool) => !tool.name.startsWith('rewind_')).length; render(); });
mountRewindPanel(rewind, document.querySelector<HTMLElement>('#rewind-root')!, { title: 'WebMCP ledger' });
void connectShopTools(navigate);

document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  if (event.key === '/' && assistantMode === 'search' && !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
    event.preventDefault();
    smartOpen = true;
    latestOutcome = null;
    render();
  }
  if (event.key === 'Escape' && assistantMode === 'search' && smartOpen) {
    smartOpen = false;
    render();
  }
});

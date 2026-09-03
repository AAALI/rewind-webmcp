import { ArrowRight } from 'lucide-react';
import './styles.css';

const LedgerMark = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
    <path d="M5 4.5h6M5 10h10M5 15.5h6" />
    <circle cx="3" cy="4.5" r="1.2" fill="#fff" stroke="none" />
    <circle cx="17" cy="15.5" r="1.2" fill="#fff" stroke="none" />
  </svg>
);

function App() {
  return (
    <div className="site">
      <nav>
        <a className="brand" href="/">
          <span><LedgerMark /></span>
          Rewind
        </a>
        <div>
          <a href="#webmcp">WebMCP</a>
          <a href="#why">Why</a>
          <a href="#sdk">SDK</a>
          <a className="button button--small" href="/examples/catalog/">
            Shopify demo <ArrowRight size={13} />
          </a>
        </div>
      </nav>

      <main>
        <section className="hero">
          <h1>Undo for the agentic web.</h1>
          <p className="hero-lead">
            WebMCP gives websites typed tools that browser agents can call directly. Rewind records every agent mutation so people can rewind a mistake at the exact place it appears — no new prompt required.
          </p>
          <div className="hero-actions">
            <a className="button" href="/examples/catalog/">
              See the Shopify cart demo <ArrowRight size={14} />
            </a>
            <a href="#webmcp">Read about WebMCP</a>
          </div>
          <p className="hero-note">
            Use a WebMCP-enabled browser. In Chrome 146+, enable <code>chrome://flags/#enable-webmcp-testing</code> and relaunch.
          </p>

          <div className="recovery-preview">
            <div className="preview-head">
              <strong>Your cart</strong>
              <span>8 items</span>
            </div>
            <div className="problem">
              <span>!</span>
              <div>
                <strong>This doesn’t match your request</strong>
                <small>Agent added 8 items · $789.00</small>
              </div>
              <p>
                Your $200 budget was exceeded by <b>$589.00</b>.
              </p>
              <button>Undo agent changes</button>
            </div>
            <div className="line">
              <img src="https://cdn.shopify.com/s/files/1/0748/3002/0662/files/briskrun-jacket-unisex-88b464-main-grey.png?v=1787661204" alt="BriskRun Jacket" />
              <div>
                <strong>BriskRun Jacket</strong>
                <small>Grey · Qty 1</small>
              </div>
              <b>$157.00</b>
            </div>
            <div className="line">
              <img src="https://cdn.shopify.com/s/files/1/0748/3002/0662/files/orbitproof-sweatshirt-youth-2226d1-main-white.png?v=1787411729" alt="OrbitProof Sweatshirt" />
              <div>
                <strong>OrbitProof Sweatshirt</strong>
                <small>White · Qty 1</small>
              </div>
              <b>$101.00</b>
            </div>
          </div>
        </section>

        <section className="section section--narrow" id="webmcp">
          <p className="section-label">What is WebMCP?</p>
          <h2>A new open standard for agent-ready websites.</h2>
          <p>
            WebMCP lets a web page register structured tools — names, natural-language descriptions, and JSON input schemas — so browser agents can discover and call them reliably instead of guessing through buttons and forms.
          </p>
          <p>
            The browser arbitrates which tools are visible, keeps execution on the page, and lets tasks happen inside the normal UI the user already trusts. A page can expose <code>search_products</code>, <code>update_cart</code>, or <code>checkout</code> as first-class tools, each with explicit inputs and expected outputs.
          </p>
          <div className="link-row">
            <a href="https://developer.chrome.com/docs/ai/webmcp" target="_blank" rel="noreferrer">WebMCP spec ↗</a>
            <a href="https://webmachinelearning.github.io/webmcp/" target="_blank" rel="noreferrer">Explainer ↗</a>
            <a href="https://webmcp.devpost.com/" target="_blank" rel="noreferrer">WebMCP Challenge ↗</a>
          </div>
        </section>

        <section className="section section--narrow" id="why">
          <p className="section-label">Why this project</p>
          <h2>A wrong agent action needs a human undo.</h2>
          <p>
            The WebMCP Challenge asked what becomes possible when people and their agents use the web together. We built Rewind to answer the recovery side of that question: once an agent can change your cart, your labels, or your settings, a mistake becomes a real user problem.
          </p>
          <p>
            Today the only “undo” is another prompt — and that often makes things worse. Rewind gives every WebMCP product Git-style recovery: record silently at the mutation boundary, surface the change where it happens, and let people roll back with one click. The host UI stays unchanged until something goes wrong.
          </p>
          <ul className="plain-list">
            <li>One-click rollback at the point of impact</li>
            <li>Full audit trail and branch-on-retry</li>
            <li>Works without changing the host UI</li>
          </ul>
        </section>

        <section className="section section--narrow" id="how">
          <p className="section-label">How it works</p>
          <h2>Notice, understand, reverse, verify.</h2>
          <ol className="steps">
            <li>
              <b>Notice.</b> The normal cart opens after the agent changes it. The total makes the problem obvious.
            </li>
            <li>
              <b>Understand.</b> Rewind explains who changed what and why the result violated the original request.
            </li>
            <li>
              <b>Reverse.</b> One contextual Undo restores the state from immediately before the agent action.
            </li>
            <li>
              <b>Verify.</b> The restored cart is visible instantly; the reverted action remains in the audit history.
            </li>
          </ol>
        </section>

        <section className="section sdk" id="sdk">
          <div className="section-text">
            <p className="section-label">The SDK</p>
            <h2>Record at the mutation boundary.</h2>
            <p>
              Rewind sits underneath the interface. Each mutating WebMCP tool creates a commit with before state, after state, effects, and a deterministic hash. The host product decides where contextual Undo appears.
            </p>
            <ul className="plain-list">
              <li>Background action history</li>
              <li>Snapshot restore</li>
              <li>Branch-on-retry audit trail</li>
            </ul>
            <div className="link-row">
              <a href="/sdk/rewind-sdk.mjs" download>Download ESM bundle ↓</a>
              <a href="https://github.com/aliabdulkadirali/rewind-webmcp" target="_blank" rel="noreferrer">View on GitHub ↗</a>
            </div>
          </div>
          <pre>
            <code>{`npm install @rewind/webmcp

import { createRewindEngine, mountRewindPanel } from "@rewind/webmcp";

const rewind = createRewindEngine({ initialState });

rewind.registerMutation({
  name: "update_cart",
  mutate: updateShopifyCart
});

mountRewindPanel(rewind, document.querySelector("#rewind"));
await rewind.connectWebMCP();`}</code>
          </pre>
        </section>

        <section className="section section--narrow close">
          <p className="section-label">Try it</p>
          <h2>Agents move fast. People keep a way back.</h2>
          <a className="button" href="/examples/catalog/">
            Try the recovery flow <ArrowRight size={14} />
          </a>
        </section>
      </main>

      <footer>
        <a className="brand" href="/">
          <span><LedgerMark /></span>
          Rewind
        </a>
        <p>Built for the WebMCP Challenge · MIT licensed</p>
      </footer>
    </div>
  );
}

export default App;

import { ArrowRight, GitBranch, History, RotateCcw } from 'lucide-react';
import './styles.css';

const LedgerMark = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
    <path d="M5 4.5h6M5 10h10M5 15.5h6" />
    <circle cx="3" cy="4.5" r="1.2" fill="#fff" stroke="none" />
    <circle cx="17" cy="15.5" r="1.2" fill="#fff" stroke="none" />
  </svg>
);

const ToolsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
          <a href="#product">Product</a>
          <a href="#sdk">SDK</a>
          <a className="demo-link" href="/examples/catalog/">
            Shopify demo <ArrowRight size={13} />
          </a>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div>
            <p className="kicker">Open SDK for WebMCP</p>
            <h1>
              Undo for the
              <br />
              <span className="accent-text">agentic web.</span>
            </h1>
            <p className="lead">
              WebMCP gives websites typed tools that browser agents can call directly. Rewind is the drop-in SDK that records every agent mutation and lets people rewind a mistake at the exact place it appears — no new prompt required.
            </p>
            <div className="actions">
              <a className="primary" href="/examples/catalog/">
                See the Shopify cart demo <ArrowRight size={15} />
              </a>
              <a href="#webmcp">What is WebMCP?</a>
            </div>
            <aside className="browser-note">
              <strong>Use a WebMCP-enabled browser.</strong>
              <span>
                In Chrome 146+, open <code>chrome://flags/#enable-webmcp-testing</code>, set it to Enabled, then relaunch Chrome.
              </span>
            </aside>
          </div>

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
              <i />
              <div>
                <strong>BriskRun Jacket</strong>
                <small>Grey · Qty 1</small>
              </div>
              <b>$157.00</b>
            </div>
            <div className="line">
              <i />
              <div>
                <strong>OrbitProof Sweatshirt</strong>
                <small>White · Qty 1</small>
              </div>
              <b>$101.00</b>
            </div>
          </div>
        </section>

        <section className="reference">
          <span>Built for the WebMCP Challenge</span>
          <strong>Vercel Shop + Shopify WebMCP</strong>
          <a href="https://github.com/vercel/shop" target="_blank" rel="noreferrer">
            View source ↗
          </a>
        </section>

        <section id="webmcp" className="webmcp">
          <header>
            <p className="kicker">What is WebMCP?</p>
            <h2>A new open standard for agent-ready websites.</h2>
            <p className="subhead">
              WebMCP lets a web page register structured tools — names, natural-language descriptions, and JSON input schemas — so browser agents can discover and call them reliably instead of guessing through buttons and forms.
            </p>
          </header>

          <div className="webmcp-grid">
            <article>
              <span className="icon"><ToolsIcon /></span>
              <h3>Typed tools, not scraped DOM</h3>
              <p>
                A page exposes <code>search_products</code>, <code>update_cart</code>, or <code>checkout</code> as first-class tools. The agent knows exactly what each feature does and what inputs it expects.
              </p>
            </article>
            <article>
              <span className="icon"><GlobeIcon /></span>
              <h3>Agent + person, same interface</h3>
              <p>
                Tasks happen inside the normal UI the user already trusts. The agent calls the same JavaScript functions the page uses, so results appear exactly where people expect them.
              </p>
            </article>
            <article>
              <span className="icon"><ShieldIcon /></span>
              <h3>Browser-mediated trust</h3>
              <p>
                The browser arbitrates which tools are visible, handles permissions, and keeps execution on the page — no headless browser or fragile DOM scraping required.
              </p>
            </article>
          </div>

          <div className="webmcp-links">
            <a href="https://developer.chrome.com/docs/ai/webmcp" target="_blank" rel="noreferrer">
              Read the WebMCP spec ↗
            </a>
            <a href="https://webmachinelearning.github.io/webmcp/" target="_blank" rel="noreferrer">
              WebMCP explainer ↗
            </a>
            <a href="https://webmcp.devpost.com/" target="_blank" rel="noreferrer">
              The WebMCP Challenge ↗
            </a>
          </div>
        </section>

        <section id="product" className="product">
          <header>
            <p className="kicker">The human job</p>
            <h2>Notice. Understand. Reverse. Verify.</h2>
            <p>Recovery belongs where the mistake becomes visible — not in a developer dashboard or another chat thread.</p>
          </header>
          <div className="job-grid">
            <article>
              <b>01</b>
              <h3>Notice</h3>
              <p>The normal cart opens after the agent changes it. The total makes the problem obvious.</p>
            </article>
            <article>
              <b>02</b>
              <h3>Understand</h3>
              <p>Rewind explains who changed what and why the result violated the original request.</p>
            </article>
            <article>
              <b>03</b>
              <h3>Reverse</h3>
              <p>One contextual Undo restores the state from immediately before the agent action.</p>
            </article>
            <article>
              <b>04</b>
              <h3>Verify</h3>
              <p>The restored cart is visible instantly; the reverted action remains in the audit history.</p>
            </article>
          </div>
        </section>

        <section className="why">
          <div className="why-card">
            <p className="kicker">Why this project</p>
            <h2>Because a wrong agent action needs a human undo.</h2>
            <p>
              The WebMCP Challenge asked what becomes possible when people and their agents use the web together. We built Rewind to answer the recovery side of that question: the moment an agent can change your cart, your labels, or your settings, a mistake becomes a real user problem. Today the only “undo” is another prompt — and that can make things worse.
            </p>
            <p>
              Rewind gives every WebMCP product Git-style recovery: record silently at the mutation boundary, surface the change where it happens, and let people roll back with one click. No host UI changes needed until something goes wrong.
            </p>
            <ul>
              <li><RotateCcw size={15} /> One-click rollback at the point of impact</li>
              <li><GitBranch size={15} /> Full audit trail and branch-on-retry</li>
              <li><History size={15} /> Works without changing the host UI</li>
            </ul>
          </div>
        </section>

        <section id="sdk" className="sdk">
          <div>
            <p className="kicker">The SDK</p>
            <h2>Record at the mutation boundary.</h2>
            <p>
              Rewind sits underneath the interface. Each mutating WebMCP tool creates a commit with before state, after state, effects, and a deterministic hash. The host product decides where contextual Undo appears.
            </p>
            <ul>
              <li><History size={15} /> Background action history</li>
              <li><RotateCcw size={15} /> Snapshot restore</li>
              <li><GitBranch size={15} /> Branch-on-retry audit trail</li>
            </ul>
            <div className="sdk-cta">
              <a className="secondary" href="/sdk/rewind-sdk.mjs" download>
                Download ESM bundle ↓
              </a>
              <a href="https://github.com/aliabdulkadirali/rewind-webmcp" target="_blank" rel="noreferrer">
                View on GitHub ↗
              </a>
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

        <section className="close">
          <span><LedgerMark /></span>
          <h2>
            Agents move fast.
            <br />
            People keep a way back.
          </h2>
          <a href="/examples/catalog/">
            Try the recovery flow <ArrowRight size={15} />
          </a>
        </section>
      </main>

      <footer>
        <a className="brand" href="/">
          <span><LedgerMark /></span>
          Rewind
        </a>
        <p>Hackathon prototype · MIT licensed</p>
      </footer>
    </div>
  );
}

export default App;

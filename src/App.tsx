import { ArrowRight, GitBranch, History, RotateCcw } from 'lucide-react';
import './styles.css';

const LedgerMark = () => <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M5 4.5h6M5 10h10M5 15.5h6"/><circle cx="3" cy="4.5" r="1.2" fill="#fff" stroke="none"/><circle cx="17" cy="15.5" r="1.2" fill="#fff" stroke="none"/></svg>;

function App() {
  return <div className="site">
    <nav><a className="brand" href="/"><span><LedgerMark/></span>Rewind</a><div><a href="#product">Product</a><a href="#sdk">SDK</a><a className="demo-link" href="/examples/catalog/">Shopify demo <ArrowRight size={13}/></a></div></nav>
    <main>
      <section className="hero">
        <div><p className="kicker">OPEN SDK FOR WEBMCP</p><h1>Undo for the<br/>agentic web.</h1><p className="lead">When an agent gets an action wrong, people shouldn’t need another prompt to repair the damage. Rewind records the change and gives them a reliable way back.</p><div className="actions"><a className="primary" href="/examples/catalog/">See the Shopify cart demo <ArrowRight size={15}/></a><a href="#sdk">Read the integration</a></div><aside className="browser-note"><strong>Use a WebMCP-enabled browser.</strong><span>In Chrome 146+, open <code>chrome://flags/#enable-webmcp-testing</code>, set it to Enabled, then relaunch Chrome.</span></aside></div>
        <div className="recovery-preview">
          <div className="preview-head"><strong>Your cart</strong><span>8 items</span></div>
          <div className="problem"><span>!</span><div><strong>This doesn’t match your request</strong><small>Agent added 8 items · $789.00</small></div><p>Your $200 budget was exceeded by <b>$589.00</b>.</p><button>Undo agent changes</button></div>
          <div className="line"><i/><div><strong>BriskRun Jacket</strong><small>Grey · Qty 1</small></div><b>$157.00</b></div>
          <div className="line"><i/><div><strong>OrbitProof Sweatshirt</strong><small>White · Qty 1</small></div><b>$101.00</b></div>
        </div>
      </section>
      <section className="reference"><span>Built on the official hackathon commerce example</span><strong>Vercel Shop + Shopify WebMCP</strong><a href="https://github.com/vercel/shop" target="_blank" rel="noreferrer">View source ↗</a></section>
      <section id="product" className="product"><header><p className="kicker">THE HUMAN JOB</p><h2>Notice. Understand. Reverse. Verify.</h2><p>Recovery belongs where the mistake becomes visible—not in a developer dashboard.</p></header><div className="job-grid"><article><b>01</b><h3>Notice</h3><p>The normal cart opens after the agent changes it. The total makes the problem obvious.</p></article><article><b>02</b><h3>Understand</h3><p>Rewind explains who changed what and why the result violated the original request.</p></article><article><b>03</b><h3>Reverse</h3><p>One contextual Undo restores the state from immediately before the agent action.</p></article><article><b>04</b><h3>Verify</h3><p>The restored cart is visible instantly; the reverted action remains in the audit history.</p></article></div></section>
      <section id="sdk" className="sdk"><div><p className="kicker">THE SDK</p><h2>Record at the mutation boundary.</h2><p>Rewind sits underneath the interface. Each mutating WebMCP tool creates a commit with before state, after state, effects and a deterministic hash. The host product decides where contextual Undo appears.</p><ul><li><History size={15}/> Background action history</li><li><RotateCcw size={15}/> Snapshot restore</li><li><GitBranch size={15}/> Branch-on-retry audit trail</li></ul><div className="sdk-cta"><a className="secondary" href="/sdk/rewind-sdk.mjs" download>Download ESM bundle ↓</a><a href="https://github.com/aliabdulkadirali/rewind-webmcp" target="_blank" rel="noreferrer">View on GitHub ↗</a></div></div><pre><code>{`npm install @rewind/webmcp

import { createRewindEngine, mountRewindPanel } from "@rewind/webmcp";

const rewind = createRewindEngine({ initialState });

rewind.registerMutation({
  name: "update_cart",
  mutate: updateShopifyCart
});

mountRewindPanel(rewind, document.querySelector("#rewind"));
await rewind.connectWebMCP();`}</code></pre></section>
      <section className="close"><span><LedgerMark/></span><h2>Agents move fast.<br/>People keep a way back.</h2><a href="/examples/catalog/">Try the recovery flow <ArrowRight size={15}/></a></section>
    </main>
    <footer><a className="brand" href="/"><span><LedgerMark/></span>Rewind</a><p>Hackathon prototype · MIT licensed</p></footer>
  </div>;
}
export default App;

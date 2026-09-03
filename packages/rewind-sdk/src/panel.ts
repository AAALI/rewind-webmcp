import type { DiscoveredWebMCPTool, RewindCommit, RewindEffect, RewindEngine, RewindSession } from './index';

export type RewindPanelOptions = { title?: string; initiallyOpen?: boolean };

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const historyIcon = '<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4.5h6M5 10h10M5 15.5h6"/><circle cx="3" cy="4.5" r="1.2"/><circle cx="17" cy="15.5" r="1.2"/></svg>';

function compact(value: unknown) {
  const text = value === undefined ? '—' : typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 62 ? `${text.slice(0, 59)}…` : text;
}

function relativeTime(timestamp: number) {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return seconds < 5 ? 'just now' : `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

function effectMarkup(effect: RewindEffect) {
  return `<div class="rw-effect"><div class="rw-effect-head"><strong>${escapeHtml(effect.label)}</strong>${effect.count ? `<span>${effect.count} items</span>` : ''}</div><div class="rw-change"><div><small>Before</small><b>${escapeHtml(compact(effect.before))}</b></div><span>→</span><div><small>After</small><b>${escapeHtml(compact(effect.after))}</b></div></div></div>`;
}

function drawerMarkup<TState>(session: RewindSession<TState>, selected: RewindCommit<TState>, title: string, tools: DiscoveredWebMCPTool[]) {
  const branches = new Map(session.branches.map((branch) => [branch.id, branch]));
  const commits = session.commits.filter((commit) => commit.actor === 'agent');
  const protectedCount = tools.filter((tool) => tool.coverage === 'tracked').length;
  return `<div class="rw-backdrop" data-rw-close></div><aside class="rw-drawer" aria-label="WebMCP action history">
    <header><div class="rw-logo">${historyIcon}</div><div><strong>${escapeHtml(title)}</strong><span>WebMCP action ledger</span></div><button data-rw-close aria-label="Close history">×</button></header>
    <div class="rw-status"><span><i></i> ${tools.length} tools found · ${protectedCount} protected</span><code>HEAD ${escapeHtml(session.head)}</code></div>
    <section class="rw-tools"><div class="rw-label"><span>WebMCP tools</span><em>live inventory</em></div><div>${tools.map((tool) => `<article><code>${escapeHtml(tool.name)}</code><span>${tool.readOnly ? 'read' : 'action'}</span><b class="${tool.coverage}">${tool.coverage === 'tracked' ? 'logged' : 'discovered'}</b></article>`).join('') || '<p>Waiting for WebMCP tools…</p>'}</div></section>
    <section class="rw-list"><div class="rw-label"><span>Recent actions</span><em>${commits.length} recorded</em></div>${commits.length ? [...commits].reverse().map((commit) => {
      const branch = branches.get(commit.branchId)!;
      return `<button class="rw-commit ${selected.id === commit.id ? 'selected' : ''}" data-rw-select="${commit.id}"><span class="rw-node" style="--rw-color:${branch.color}"><i></i></span><span><small>${escapeHtml(relativeTime(commit.createdAt))} · <code>${commit.id}</code></small><strong>${escapeHtml(commit.summary)}</strong><em>${escapeHtml(commit.toolName)}</em></span><b>${escapeHtml(branch.name)}</b></button>`;
    }).join('') : '<div class="rw-empty"><span>○</span><strong>No agent actions yet</strong><p>Changes will be recorded automatically.</p></div>'}</section>
    <section class="rw-detail"><div class="rw-label"><span>What changed</span><em>${escapeHtml(selected.afterHash)}</em></div><h3>${escapeHtml(selected.summary)}</h3><div class="rw-effects">${selected.effects.length ? selected.effects.map(effectMarkup).join('') : '<div class="rw-no-effects">This is the starting state.</div>'}</div><button class="rw-rewind" data-rw-rewind ${selected.parentId ? '' : 'disabled'}><span>${historyIcon}</span><div><strong>${selected.parentId ? 'Restore previous state' : 'Starting state'}</strong><small>${selected.parentId ? `Return to ${escapeHtml(selected.parentId)}. This action stays in history.` : 'Nothing to restore.'}</small></div></button></section>
    <footer><span>Stored locally in this demo</span><code>@rewind/webmcp</code></footer>
  </aside>`;
}

export function mountRewindPanel<TState>(engine: RewindEngine<TState>, container: HTMLElement, options: RewindPanelOptions = {}) {
  let open = options.initiallyOpen ?? false;
  let selectedId = engine.getSession().head;
  let tools = engine.getToolInventory();
  const render = (session: RewindSession<TState>) => {
    if (!session.commits.some((commit) => commit.id === selectedId)) selectedId = session.head;
    if (selectedId === 'c000' && session.head !== 'c000') selectedId = session.head;
    const selected = session.commits.find((commit) => commit.id === selectedId) ?? session.commits[0];
    const count = session.commits.filter((commit) => commit.actor === 'agent').length;
    container.innerHTML = `<style>${PANEL_CSS}</style><div class="rw-root"><button class="rw-launcher" data-rw-open aria-label="Open WebMCP action history"><span>${historyIcon}</span><strong>Action log</strong>${count ? `<em>${count}</em>` : ''}</button>${open ? drawerMarkup(session, selected, options.title ?? 'Rewind', tools) : ''}</div>`;
    container.querySelector<HTMLButtonElement>('[data-rw-open]')?.addEventListener('click', () => { open = true; render(engine.getSession()); });
    container.querySelectorAll<HTMLElement>('[data-rw-close]').forEach((element) => element.addEventListener('click', () => { open = false; render(engine.getSession()); }));
    container.querySelectorAll<HTMLButtonElement>('[data-rw-select]').forEach((button) => button.addEventListener('click', () => { selectedId = button.dataset.rwSelect!; render(engine.getSession()); }));
    container.querySelector<HTMLButtonElement>('[data-rw-rewind]')?.addEventListener('click', () => {
      if (!selected.parentId) return;
      selectedId = selected.parentId;
      engine.rewindBefore(selected.id);
    });
  };
  const unsubscribe = engine.subscribe(render);
  const unsubscribeTools = engine.subscribeTools((nextTools) => { tools = nextTools; render(engine.getSession()); });
  return () => { unsubscribe(); unsubscribeTools(); container.innerHTML = ''; };
}

const PANEL_CSS = `
.rw-root{font-family:Arial,Helvetica,sans-serif;color:#171717}.rw-root *{box-sizing:border-box}.rw-root button{font:inherit}.rw-launcher{position:fixed;right:18px;bottom:18px;z-index:80;height:38px;padding:0 11px 0 7px;border:1px solid #d8d8d8;border-radius:20px;background:#fff;color:#171717;box-shadow:0 5px 18px rgba(0,0,0,.1);display:flex;align-items:center;gap:7px;cursor:pointer;transition:transform 120ms cubic-bezier(.23,1,.32,1),box-shadow 150ms ease}.rw-launcher:active{transform:scale(.96)}.rw-launcher>span{width:25px;height:25px;border-radius:50%;background:#171717;color:#fff;display:grid;place-items:center;font-size:14px}.rw-launcher strong{font-size:10px}.rw-launcher em{min-width:17px;height:17px;padding:0 5px;border-radius:9px;background:#eee;color:#444;display:grid;place-items:center;font:normal 8px ui-monospace,monospace}.rw-backdrop{position:fixed;inset:0;z-index:98;background:rgba(0,0,0,.18)}.rw-drawer{position:fixed;z-index:99;top:8px;right:8px;bottom:8px;width:min(430px,calc(100vw - 16px));border:1px solid #dedede;border-radius:14px;background:#fff;box-shadow:0 24px 90px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;animation:rw-enter 260ms cubic-bezier(.32,.72,0,1)}@keyframes rw-enter{from{transform:translateX(calc(100% + 16px))}to{transform:translateX(0)}}.rw-drawer>header{height:68px;padding:0 17px;border-bottom:1px solid #e8e8e8;display:flex;align-items:center;gap:10px}.rw-logo{width:29px;height:29px;border-radius:50%;background:#171717;color:#fff;display:grid;place-items:center;font-size:17px}.rw-drawer header>div:nth-child(2){display:grid;gap:3px}.rw-drawer header strong{font-size:13px}.rw-drawer header span{color:#767676;font-size:9px}.rw-drawer header button{width:32px;height:32px;margin-left:auto;border:0;border-radius:50%;background:#f2f2f2;color:#333;font-size:19px;cursor:pointer}.rw-status{height:40px;padding:0 17px;border-bottom:1px solid #ececec;display:flex;align-items:center;justify-content:space-between;color:#707070;font-size:8px}.rw-status span{display:flex;align-items:center;gap:6px}.rw-status i{width:6px;height:6px;border-radius:50%;background:#2e8b57}.rw-status code{font-size:8px}.rw-list{padding:14px 12px;border-bottom:1px solid #e9e9e9;min-height:175px;max-height:40%;overflow:auto}.rw-label{height:25px;padding:0 4px;display:flex;justify-content:space-between}.rw-label span{font-size:9px;font-weight:700}.rw-label em{color:#777;font-size:8px;font-style:normal}.rw-commit{width:100%;min-height:66px;padding:7px 8px 7px 2px;border:1px solid transparent;border-radius:9px;background:transparent;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;text-align:left;cursor:pointer}.rw-commit.selected{border-color:#d7d7d7;background:#f7f7f7}.rw-node{display:grid;place-items:center}.rw-node i{width:9px;height:9px;border:2px solid var(--rw-color);border-radius:50%;background:#fff}.rw-commit>span:nth-child(2){min-width:0}.rw-commit small,.rw-commit strong,.rw-commit em{display:block}.rw-commit small{color:#777;font-size:8px}.rw-commit strong{margin-top:5px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rw-commit em{margin-top:5px;color:#888;font:normal 7px ui-monospace,monospace}.rw-commit>b{padding:3px 6px;border:1px solid #ddd;border-radius:9px;color:#666;font:normal 7px ui-monospace,monospace}.rw-empty{height:110px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#888}.rw-empty span{font-size:22px}.rw-empty strong{margin-top:8px;color:#333;font-size:10px}.rw-empty p{margin:5px 0 0;font-size:8px}.rw-detail{flex:1;padding:16px;overflow:auto}.rw-detail h3{margin:7px 0 13px;font-size:14px}.rw-effects{display:grid;gap:8px}.rw-effect{padding:11px;border:1px solid #e1e1e1;border-radius:9px}.rw-effect-head{display:flex;justify-content:space-between}.rw-effect-head strong{font-size:9px}.rw-effect-head span{color:#777;font-size:8px}.rw-change{margin-top:11px;display:grid;grid-template-columns:1fr auto 1fr;gap:9px;align-items:center}.rw-change small,.rw-change b{display:block}.rw-change small{color:#888;font-size:7px}.rw-change b{margin-top:4px;font-size:9px;overflow:hidden;text-overflow:ellipsis}.rw-change>span{color:#999}.rw-no-effects{height:65px;border:1px dashed #ddd;border-radius:9px;display:grid;place-items:center;color:#888;font-size:9px}.rw-rewind{width:100%;min-height:51px;margin-top:13px;padding:7px 10px;border:1px solid #171717;border-radius:9px;background:#171717;color:#fff;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;transition:transform 120ms cubic-bezier(.23,1,.32,1)}.rw-rewind:active{transform:scale(.98)}.rw-rewind:disabled{border-color:#e5e5e5;background:#eee;color:#999}.rw-rewind>span{width:29px;height:29px;border-radius:50%;background:#fff;color:#171717;display:grid;place-items:center;font-size:17px}.rw-rewind div{display:grid;gap:3px}.rw-rewind strong{font-size:10px}.rw-rewind small{color:#bbb;font-size:8px}.rw-rewind:disabled small{color:#aaa}.rw-drawer>footer{height:39px;padding:0 17px;border-top:1px solid #e9e9e9;display:flex;align-items:center;color:#888;font-size:8px}.rw-drawer>footer code{margin-left:auto;font-size:8px}@media(max-width:520px){.rw-launcher{right:12px;bottom:12px}}@media(prefers-reduced-motion:reduce){.rw-drawer{animation-duration:1ms}}
.rw-logo svg,.rw-launcher svg,.rw-rewind svg{width:16px;height:16px}.rw-tools{padding:12px;border-bottom:1px solid #e9e9e9}.rw-tools>div:last-child{display:flex;gap:6px;overflow-x:auto;padding:1px 3px 3px}.rw-tools article{min-width:132px;padding:8px;border:1px solid #e1e1e1;border-radius:8px;display:grid;grid-template-columns:1fr auto;gap:5px}.rw-tools article code{grid-column:1/-1;font-size:8px;font-weight:700}.rw-tools article span{color:#777;font-size:7px}.rw-tools article b{font-size:7px;font-weight:700}.rw-tools article b.tracked{color:#17653a}.rw-tools article b.discovered{color:#9a6500}.rw-tools>div>p{margin:8px;color:#888;font-size:8px}
`;

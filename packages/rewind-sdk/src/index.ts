export type Risk = 'low' | 'medium' | 'high';
export type Reversibility = 'reversible' | 'compensatable' | 'irreversible';
export type JsonSchema = Record<string, unknown>;
export type ToolInput = Record<string, unknown>;

export type RewindEffect = {
  label: string;
  kind?: 'added' | 'changed' | 'removed' | 'side-effect';
  before?: unknown;
  after?: unknown;
  count?: number;
};

export type MutationOutput<TState> = {
  state: TState;
  summary: string;
  effects?: RewindEffect[];
};

export type MutationDefinition<TState> = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  risk?: Risk;
  reversibility?: Reversibility;
  mutate: (state: TState, input: ToolInput) => MutationOutput<TState>;
};

export type ReadToolDefinition<TState> = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  read: (state: TState, input: ToolInput) => unknown;
};

export type RewindCommit<TState> = {
  id: string;
  parentId: string | null;
  branchId: string;
  toolName: string;
  input: ToolInput;
  summary: string;
  effects: RewindEffect[];
  risk: Risk;
  reversibility: Reversibility;
  before: TState;
  after: TState;
  beforeHash: string;
  afterHash: string;
  actor: 'agent' | 'system';
  createdAt: number;
};

export type RewindBranch = {
  id: string;
  name: string;
  fromCommitId: string | null;
  color: string;
};

export type RewindSession<TState> = {
  version: 1;
  current: TState;
  head: string;
  activeBranchId: string;
  detached: boolean;
  commits: RewindCommit<TState>[];
  branches: RewindBranch[];
  nextCommitNumber: number;
};

export type RewindPersistence<TState> = {
  load: () => RewindSession<TState> | null;
  save: (session: RewindSession<TState>) => void;
  clear?: () => void;
};

export type RewindConfig<TState> = {
  initialState: TState;
  persistence?: RewindPersistence<TState>;
  clone?: (state: TState) => TState;
  now?: () => number;
};

export type InvocationResult = {
  status: 'committed';
  commitId: string;
  branchCreated: string | null;
  summary: string;
  afterHash: string;
};

type Listener<TState> = (session: RewindSession<TState>) => void;

export type DiscoveredWebMCPTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
  origin: string;
  readOnly: boolean;
  coverage: 'tracked' | 'discovered';
};

type ToolListener = (tools: DiscoveredWebMCPTool[]) => void;

export type WebMCPTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: ToolInput, context: { signal: AbortSignal }) => unknown | Promise<unknown>;
};

export type RegisteredWebMCPTool = Omit<WebMCPTool, 'execute'> & {
  title?: string;
  origin?: string;
  window?: Window;
};

export type WebMCPContext = {
  registerTool: (
    tool: WebMCPTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => Promise<void>;
  getTools?: (options?: { fromOrigins?: string[] }) => Promise<RegisteredWebMCPTool[]>;
  executeTool?: (
    tool: RegisteredWebMCPTool,
    input: ToolInput,
    options?: { signal?: AbortSignal },
  ) => Promise<string | null>;
  addEventListener?: EventTarget['addEventListener'];
};

const BRANCH_COLORS = ['#b8ff5a', '#a78bfa', '#49d7ff', '#ffb86b', '#ff6b8a'];

function cloneValue<TValue>(value: TValue): TValue {
  return structuredClone(value);
}

function stableStringify(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? String(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
    .join(',')}}`;
}

export function hashState(value: unknown): string {
  const input = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `sha-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function assertToolName(name: string) {
  if (!/^[A-Za-z0-9_.-]{1,128}$/.test(name)) {
    throw new Error(`Tool name "${name}" must use WebMCP-safe characters and be at most 128 characters.`);
  }
}

export class RewindEngine<TState> {
  private session: RewindSession<TState>;
  private readonly mutations = new Map<string, MutationDefinition<TState>>();
  private readonly reads = new Map<string, ReadToolDefinition<TState>>();
  private readonly listeners = new Set<Listener<TState>>();
  private readonly toolListeners = new Set<ToolListener>();
  private toolInventory: DiscoveredWebMCPTool[] = [];
  private readonly cloneState: (state: TState) => TState;
  private readonly now: () => number;
  private readonly persistence?: RewindPersistence<TState>;

  constructor(config: RewindConfig<TState>) {
    this.cloneState = config.clone ?? cloneValue;
    this.now = config.now ?? Date.now;
    this.persistence = config.persistence;

    const restored = this.persistence?.load();
    if (restored?.version === 1 && restored.commits.length > 0) {
      this.session = cloneValue(restored);
      return;
    }

    const initial = this.cloneState(config.initialState);
    const hash = hashState(initial);
    const root: RewindCommit<TState> = {
      id: 'c000',
      parentId: null,
      branchId: 'main',
      toolName: 'session_init',
      input: {},
      summary: 'Initial application state',
      effects: [],
      risk: 'low',
      reversibility: 'reversible',
      before: this.cloneState(initial),
      after: this.cloneState(initial),
      beforeHash: hash,
      afterHash: hash,
      actor: 'system',
      createdAt: this.now(),
    };

    this.session = {
      version: 1,
      current: initial,
      head: root.id,
      activeBranchId: 'main',
      detached: false,
      commits: [root],
      branches: [{ id: 'main', name: 'main', fromCommitId: null, color: BRANCH_COLORS[0] }],
      nextCommitNumber: 1,
    };
    this.persist();
  }

  registerMutation(definition: MutationDefinition<TState>) {
    assertToolName(definition.name);
    if (this.mutations.has(definition.name) || this.reads.has(definition.name)) {
      throw new Error(`Tool ${definition.name} is already registered.`);
    }
    this.mutations.set(definition.name, definition);
    return this;
  }

  registerReadTool(definition: ReadToolDefinition<TState>) {
    assertToolName(definition.name);
    if (this.mutations.has(definition.name) || this.reads.has(definition.name)) {
      throw new Error(`Tool ${definition.name} is already registered.`);
    }
    this.reads.set(definition.name, definition);
    return this;
  }

  getSession() {
    return cloneValue(this.session);
  }

  subscribe(listener: Listener<TState>) {
    this.listeners.add(listener);
    listener(this.getSession());
    return () => this.listeners.delete(listener);
  }

  getToolInventory() {
    return cloneValue(this.toolInventory);
  }

  subscribeTools(listener: ToolListener) {
    this.toolListeners.add(listener);
    listener(this.getToolInventory());
    return () => this.toolListeners.delete(listener);
  }

  async discoverTools(modelContext?: WebMCPContext, fromOrigins?: string[]) {
    const context = modelContext ?? (document as Document & { modelContext?: WebMCPContext }).modelContext;
    const trackedNames = new Set([
      ...this.mutations.keys(),
      ...this.reads.keys(),
      'rewind_history',
      'rewind_restore',
    ]);
    let discovered: RegisteredWebMCPTool[];
    if (context?.getTools) {
      discovered = await context.getTools(fromOrigins?.length ? { fromOrigins } : undefined);
    } else {
      discovered = [
        ...[...this.mutations.values()].map((tool) => ({ ...tool, annotations: { readOnlyHint: false } })),
        ...[...this.reads.values()].map((tool) => ({ ...tool, annotations: { readOnlyHint: true } })),
      ];
    }
    this.toolInventory = discovered.map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: cloneValue(tool.inputSchema ?? {}),
      origin: tool.origin ?? (typeof location === 'undefined' ? 'local' : location.origin),
      readOnly: tool.annotations?.readOnlyHint === true,
      coverage: trackedNames.has(tool.name) ? 'tracked' : 'discovered',
    }));
    const snapshot = this.getToolInventory();
    for (const listener of this.toolListeners) listener(snapshot);
    return snapshot;
  }

  invoke(name: string, input: ToolInput): InvocationResult {
    const definition = this.mutations.get(name);
    if (!definition) throw new Error(`Mutation tool ${name} is not registered.`);

    const before = this.cloneState(this.session.current);
    const output = definition.mutate(this.cloneState(before), cloneValue(input));
    if (!output || typeof output.summary !== 'string' || !output.summary.trim()) {
      throw new Error(`Mutation tool ${name} must return a non-empty summary.`);
    }

    return this.commit({
      toolName: name,
      input,
      summary: output.summary,
      effects: output.effects ?? [],
      risk: definition.risk ?? 'medium',
      reversibility: definition.reversibility ?? 'reversible',
      before,
      after: output.state,
    });
  }

  restore(commitId: string) {
    const commit = this.session.commits.find((item) => item.id === commitId);
    if (!commit) throw new Error(`Commit ${commitId} was not found.`);
    this.session.current = this.cloneState(commit.after);
    this.session.head = commit.id;
    this.session.activeBranchId = commit.branchId;
    this.session.detached = this.session.commits.some((item) => item.parentId === commit.id);
    this.changed();
  }

  rewindBefore(commitId: string) {
    const commit = this.session.commits.find((item) => item.id === commitId);
    if (!commit) throw new Error(`Commit ${commitId} was not found.`);
    if (!commit.parentId) throw new Error('The initial commit cannot be rewound.');
    this.restore(commit.parentId);
  }

  reset(initialState?: TState) {
    this.persistence?.clear?.();
    const state = initialState === undefined
      ? this.cloneState(this.session.commits[0].after)
      : this.cloneState(initialState);
    const hash = hashState(state);
    const root: RewindCommit<TState> = {
      ...cloneValue(this.session.commits[0]),
      before: this.cloneState(state),
      after: this.cloneState(state),
      beforeHash: hash,
      afterHash: hash,
      createdAt: this.now(),
    };
    this.session = {
      version: 1,
      current: state,
      head: root.id,
      activeBranchId: 'main',
      detached: false,
      commits: [root],
      branches: [{ id: 'main', name: 'main', fromCommitId: null, color: BRANCH_COLORS[0] }],
      nextCommitNumber: 1,
    };
    this.changed();
  }

  async connectWebMCP(modelContext?: WebMCPContext) {
    const context = modelContext ?? (document as Document & { modelContext?: WebMCPContext }).modelContext;
    if (!context) return null;
    const controller = new AbortController();
    const registrations: Promise<void>[] = [];

    for (const definition of this.mutations.values()) {
      registrations.push(
        context.registerTool(
          {
            name: definition.name,
            description: definition.description,
            inputSchema: definition.inputSchema,
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => JSON.stringify(this.invoke(definition.name, input)),
          },
          { signal: controller.signal },
        ),
      );
    }

    for (const definition of this.reads.values()) {
      registrations.push(
        context.registerTool(
          {
            name: definition.name,
            description: definition.description,
            inputSchema: definition.inputSchema,
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute: async (input) => JSON.stringify(definition.read(this.cloneState(this.session.current), input)),
          },
          { signal: controller.signal },
        ),
      );
    }

    const builtIns: WebMCPTool[] = [
      {
        name: 'rewind_history',
        description: 'Read recent Git-style WebMCP action commits and branch relationships.',
        inputSchema: { type: 'object', properties: {} },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async () => ({
          head: this.session.head,
          commits: this.session.commits.slice(-15).map((commit) => ({
            id: commit.id,
            parent_id: commit.parentId,
            branch: commit.branchId,
            tool: commit.toolName,
            summary: commit.summary,
            after_hash: commit.afterHash,
          })),
        }),
      },
      {
        name: 'rewind_restore',
        description: 'Restore the application to a previous action commit.',
        inputSchema: {
          type: 'object',
          properties: { commit_id: { type: 'string', description: 'Commit ID from rewind_history' } },
          required: ['commit_id'],
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: async (input) => {
          const commitId = String(input.commit_id ?? '');
          this.restore(commitId);
          return { restored_to: commitId, head: this.session.head };
        },
      },
    ];

    for (const tool of builtIns) {
      registrations.push(context.registerTool(tool, { signal: controller.signal }));
    }
    await Promise.all(registrations);
    await this.discoverTools(context);
    context.addEventListener?.(
      'toolchange',
      () => { void this.discoverTools(context); },
      { signal: controller.signal },
    );
    return controller;
  }

  private commit(change: {
    toolName: string;
    input: ToolInput;
    summary: string;
    effects: RewindEffect[];
    risk: Risk;
    reversibility: Reversibility;
    before: TState;
    after: TState;
  }): InvocationResult {
    const children = this.session.commits.filter((item) => item.parentId === this.session.head);
    let branchCreated: string | null = null;
    if (children.length > 0) {
      const number = this.session.branches.length;
      branchCreated = `branch-${number}`;
      this.session.activeBranchId = branchCreated;
      this.session.branches.push({
        id: branchCreated,
        name: `retry-${number}`,
        fromCommitId: this.session.head,
        color: BRANCH_COLORS[number % BRANCH_COLORS.length],
      });
    }

    const id = `c${String(this.session.nextCommitNumber).padStart(3, '0')}`;
    const before = this.cloneState(change.before);
    const after = this.cloneState(change.after);
    const commit: RewindCommit<TState> = {
      id,
      parentId: this.session.head,
      branchId: this.session.activeBranchId,
      toolName: change.toolName,
      input: cloneValue(change.input),
      summary: change.summary.trim(),
      effects: cloneValue(change.effects),
      risk: change.risk,
      reversibility: change.reversibility,
      before,
      after,
      beforeHash: hashState(before),
      afterHash: hashState(after),
      actor: 'agent',
      createdAt: this.now(),
    };
    this.session.current = after;
    this.session.commits.push(commit);
    this.session.head = id;
    this.session.detached = false;
    this.session.nextCommitNumber += 1;
    this.changed();
    return {
      status: 'committed',
      commitId: id,
      branchCreated,
      summary: commit.summary,
      afterHash: commit.afterHash,
    };
  }

  private persist() {
    this.persistence?.save(this.getSession());
  }

  private changed() {
    this.persist();
    const snapshot = this.getSession();
    for (const listener of this.listeners) listener(snapshot);
  }
}

export function createRewindEngine<TState>(config: RewindConfig<TState>) {
  return new RewindEngine(config);
}

export function localStoragePersistence<TState>(key: string): RewindPersistence<TState> {
  return {
    load: () => {
      try {
        const value = localStorage.getItem(key);
        return value ? (JSON.parse(value) as RewindSession<TState>) : null;
      } catch {
        return null;
      }
    },
    save: (session) => localStorage.setItem(key, JSON.stringify(session)),
    clear: () => localStorage.removeItem(key),
  };
}

export { mountRewindPanel } from './panel';

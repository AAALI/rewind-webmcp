# @rewind/webmcp

Git-style background commits, restore, and branching for WebMCP applications.

```ts
import { createRewindEngine, localStoragePersistence, mountRewindPanel } from '@rewind/webmcp';

const rewind = createRewindEngine({
  initialState,
  persistence: localStoragePersistence('my-app-rewind'),
});

rewind.registerMutation({
  name: 'archive_task',
  description: 'Archive a task',
  inputSchema: {
    type: 'object',
    properties: { task_id: { type: 'string' } },
    required: ['task_id'],
  },
  risk: 'high',
  reversibility: 'reversible',
  mutate: (state, input) => ({
    state: archiveTask(state, String(input.task_id)),
    summary: 'Archived the task',
    effects: [{ label: 'Task', kind: 'removed', before: task, after: null }],
  }),
});

rewind.subscribe(({ current }) => render(current));
mountRewindPanel(rewind, document.querySelector('#rewind'));
await rewind.connectWebMCP();
```

The host application owns its domain state and deterministic mutations. Rewind quietly owns snapshot hashes, commits, restore, branching, persistence, the on-demand history panel, and WebMCP registration. Humans only open Rewind when they want to inspect or reverse an agent action.

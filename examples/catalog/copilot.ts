type RegisteredTool = {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  origin?: string;
};

type ModelContext = {
  getTools: () => Promise<RegisteredTool[]>;
  executeTool: (tool: RegisteredTool, input: Record<string, unknown> | string) => Promise<unknown>;
};

export type CopilotStep = { role: 'user' | 'agent'; text: string; tools?: string[] };

export type CopilotPageContext = {
  page: string;
  currentProduct: { id: string; name: string; color: string; price: number } | null;
  selectedSize: string | null;
  cart: Array<{ productId: string; quantity: number; size?: string }>;
  cartTotal: number;
};

type PlannerCall = { callId: string; name: string; arguments: Record<string, unknown> };
type PlannerResponse = { responseId?: string; text?: string; calls?: PlannerCall[]; error?: string };

function serializeToolOutput(value: unknown): string {
  if (value === null || value === undefined) return JSON.stringify({ ok: true });
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.content)) {
      const text = record.content
        .filter((part): part is { type: string; text?: string } => typeof part === 'object' && part !== null)
        .filter((part) => part.type === 'text' && typeof part.text === 'string')
        .map((part) => part.text as string)
        .join('\n');
      if (text) return text;
    }
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

async function askPlanner(body: Record<string, unknown>): Promise<PlannerResponse> {
  const response = await fetch('/api/copilot', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json() as PlannerResponse;
  if (!response.ok) throw new Error(result.error ?? 'The AI planner is unavailable.');
  return result;
}

export async function runCopilot(prompt: string, pageContext: CopilotPageContext): Promise<CopilotStep> {
  const context = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (!context?.getTools || !context.executeTool) {
    throw new Error('This browser does not expose in-page WebMCP discovery and execution.');
  }

  const tools = await context.getTools();
  const siteTools = tools.filter((tool) => !tool.name.startsWith('rewind_'));
  const usedTools: string[] = [];
  let previousResponseId: string | undefined;
  let toolOutputs: Array<{ callId: string; output: string }> | undefined;

  for (let turn = 0; turn < 8; turn += 1) {
    const plan = await askPlanner({
      prompt,
      pageContext,
      tools: siteTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema ?? { type: 'object', properties: {} },
        readOnly: tool.annotations?.readOnlyHint === true,
      })),
      previousResponseId,
      toolOutputs,
    });
    if (plan.error) throw new Error(plan.error);

    const calls = plan.calls ?? [];
    if (!calls.length) {
      return {
        role: 'agent',
        text: plan.text?.trim() || (usedTools.length ? 'Done.' : 'I need a little more detail to help with that.'),
        tools: usedTools,
      };
    }

    previousResponseId = plan.responseId;
    toolOutputs = [];
    for (const call of calls) {
      const tool = siteTools.find((item) => item.name === call.name);
      if (!tool) {
        toolOutputs.push({ callId: call.callId, output: JSON.stringify({ error: `${call.name} is not available on this page.` }) });
        continue;
      }
      usedTools.push(call.name);
      try {
        const argsJson = JSON.stringify(call.arguments ?? {});
        let output: unknown;
        try {
          output = await context.executeTool(tool, argsJson);
        } catch {
          output = await context.executeTool(tool, call.arguments);
        }
        toolOutputs.push({ callId: call.callId, output: serializeToolOutput(output) });
      } catch (error) {
        toolOutputs.push({ callId: call.callId, output: JSON.stringify({ error: error instanceof Error ? error.message : 'Tool execution failed.' }) });
      }
    }
  }

  return { role: 'agent', text: 'I stopped after several tool steps so you stay in control.', tools: usedTools };
}

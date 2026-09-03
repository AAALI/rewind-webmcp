type RegisteredTool = {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  origin?: string;
};

type ModelContext = {
  getTools: () => Promise<RegisteredTool[]>;
  executeTool: (tool: RegisteredTool, input: Record<string, unknown>) => Promise<string | null>;
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

async function askPlanner(body: Record<string, unknown>): Promise<PlannerResponse> {
  const response = await fetch('/.netlify/functions/copilot', {
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

  for (let turn = 0; turn < 5; turn += 1) {
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
        const output = await context.executeTool(tool, call.arguments);
        toolOutputs.push({ callId: call.callId, output: output ?? JSON.stringify({ ok: true }) });
      } catch (error) {
        toolOutputs.push({ callId: call.callId, output: JSON.stringify({ error: error instanceof Error ? error.message : 'Tool execution failed.' }) });
      }
    }
  }

  return { role: 'agent', text: 'I stopped after five tool steps so you stay in control.', tools: usedTools };
}

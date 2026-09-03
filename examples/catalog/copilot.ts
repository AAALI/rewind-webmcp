type RegisteredTool = { name: string; description: string; origin?: string };
type ModelContext = {
  getTools: () => Promise<RegisteredTool[]>;
  executeTool: (tool: RegisteredTool, input: Record<string, unknown>) => Promise<string | null>;
};

export type CopilotStep = { role: 'user' | 'agent'; text: string; tools?: string[] };

function parseResult<T>(value: string | null): T {
  if (!value) return [] as T;
  const first = JSON.parse(value) as unknown;
  return (typeof first === 'string' ? JSON.parse(first) : first) as T;
}

export async function runCopilot(prompt: string): Promise<CopilotStep> {
  const context = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (!context?.getTools || !context.executeTool) {
    throw new Error('This browser does not expose in-page WebMCP discovery and execution.');
  }
  const tools = await context.getTools();
  const byName = (name: string) => {
    const tool = tools.find((item) => item.name === name);
    if (!tool) throw new Error(`${name} is not available on this page.`);
    return tool;
  };
  const lower = prompt.toLowerCase();

  if (/return|exchange|shipping|delivery/.test(lower)) {
    const raw = await context.executeTool(byName('search_shop_policies_and_faqs'), { query: prompt });
    const result = parseResult<{ answer: string }>(raw);
    return { role: 'agent', text: result.answer, tools: ['search_shop_policies_and_faqs'] };
  }
  if (/orders?|tracking/.test(lower)) {
    await context.executeTool(byName('manage_orders'), {});
    return { role: 'agent', text: 'I opened your order history and tracking.', tools: ['manage_orders'] };
  }
  if (/checkout|pay now/.test(lower)) {
    const raw = await context.executeTool(byName('proceed_to_checkout'), {});
    const result = parseResult<{ ok: boolean; reason?: string }>(raw);
    return { role: 'agent', text: result.ok ? 'I opened checkout with your current cart.' : result.reason ?? 'Checkout is not available.', tools: ['proceed_to_checkout'] };
  }
  if (/clear|empty|remove everything/.test(lower)) {
    await context.executeTool(byName('cancel_cart'), {});
    return { role: 'agent', text: 'I cleared the cart.', tools: ['cancel_cart'] };
  }

  const budget = Number(lower.match(/(?:under|below|budget(?: of)?)\s*\$?(\d+)/)?.[1] ?? 200);
  const color = ['black', 'pink', 'grey', 'gray', 'white', 'orange', 'yellow', 'blue'].find((value) => lower.includes(value));
  const catalogRaw = await context.executeTool(byName('search_catalog'), { query: color ?? '', max_price: budget, navigate: /find|show|search/.test(lower) });
  const matches = parseResult<Array<{ id: string; name: string; price: number }>>(catalogRaw);
  if (/find|show|search/.test(lower) && !/add|cart|outfit|build|put together/.test(lower)) {
    return { role: 'agent', text: `I found ${matches.length} matching products: ${matches.slice(0, 3).map((item) => `${item.name} ($${item.price})`).join(', ')}.`, tools: ['search_catalog'] };
  }
  await context.executeTool(byName('update_cart'), { items: matches.map((item) => ({ product_id: item.id, quantity: 1 })) });
  return {
    role: 'agent',
    text: `I found ${matches.length} products under $${budget} each and added them to your cart.`,
    tools: ['search_catalog', 'update_cart'],
  };
}

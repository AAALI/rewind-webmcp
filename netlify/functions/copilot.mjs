const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
});

const instructions = `You are the concise shopping copilot inside a Vercel Shop demo.
Use the supplied WebMCP tools to satisfy the shopper's request. Never invent products or tool results.
The current page context is authoritative. When the shopper says "this", "it", or "the product I am viewing", use currentProduct.
Respect requested variants such as size XL. Use show_variant when a variant is requested, then update_cart with that exact size.
update_cart replaces the entire cart, so preserve existing cart lines from the page context unless the shopper asks to clear or replace them.
Use search_catalog for discovery, get_product for details, get_cart when cart state is unclear, and mutation tools only when the shopper asks to change something.
For multi-step work, call one tool at a time and use its output before choosing the next tool.
After tools finish, answer in one short, natural sentence describing the visible outcome. Do not narrate your reasoning or mention JSON.`;

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: 'OPENAI_API_KEY is not configured on the server.' }, 503);

  try {
    const body = await request.json();
    const tools = Array.isArray(body.tools) ? body.tools : [];
    const openAITools = tools.map((tool) => ({
      type: 'function',
      name: String(tool.name),
      description: String(tool.description ?? ''),
      parameters: tool.inputSchema ?? { type: 'object', properties: {} },
      strict: false,
    }));

    const input = body.previousResponseId
      ? (body.toolOutputs ?? []).map((item) => ({
          type: 'function_call_output',
          call_id: String(item.callId),
          output: String(item.output),
        }))
      : `Shopper request: ${String(body.prompt ?? '')}\nCurrent page context: ${JSON.stringify(body.pageContext ?? {})}`;

    const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        instructions,
        input,
        tools: openAITools,
        tool_choice: 'auto',
        parallel_tool_calls: false,
        previous_response_id: body.previousResponseId || undefined,
        reasoning: { effort: 'low' },
        max_output_tokens: 500,
      }),
    });

    const response = await openAIResponse.json();
    if (!openAIResponse.ok) {
      return json({ error: response?.error?.message || 'OpenAI request failed.' }, openAIResponse.status);
    }

    const calls = (response.output ?? [])
      .filter((item) => item.type === 'function_call')
      .map((item) => {
        let args = {};
        try { args = JSON.parse(item.arguments || '{}'); } catch { args = {}; }
        return { callId: item.call_id, name: item.name, arguments: args };
      });
    const text = (response.output ?? [])
      .filter((item) => item.type === 'message')
      .flatMap((item) => item.content ?? [])
      .filter((item) => item.type === 'output_text')
      .map((item) => item.text)
      .join('\n');

    return json({ responseId: response.id, calls, text });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected planner failure.' }, 500);
  }
};

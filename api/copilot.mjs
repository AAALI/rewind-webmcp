const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
});

const instructions = `You are the concise shopping copilot for a Vercel Shop storefront.
Use the supplied WebMCP tools to satisfy the shopper's request. Never invent products or tool results.
Rules:
- Follow the request exactly. If the shopper asks to add "this product in XL", add only that product in XL.
- When the shopper says "this", "it", or "the product I am viewing", use currentProduct from the page context.
- Respect size and variant requests precisely. Use show_variant to select the requested size, then update_cart with that exact size.
- Only add multiple products when the shopper explicitly asks for an outfit, bundle, or multiple items.
- If the shopper mentions a budget, the final cart total must not exceed it.
- update_cart replaces the entire cart, so preserve existing cart lines from the page context unless the shopper asks to clear or replace them.
- Use search_catalog for discovery, get_product for details, get_cart when cart state is unclear, and mutation tools only when the shopper asks to change something.
- For multi-step work, call one tool at a time and use its output before choosing the next tool.
Examples:
- Shopper is viewing a product and says "Add this product in XL to my cart". currentProduct is set, so call show_variant with { product_id: currentProduct.id, size: "XL" }, then update_cart with { items: [{ product_id: currentProduct.id, quantity: 1, size: "XL" }] }.
- Shopper says "Find black products under $80". Call search_catalog with { query: "black", max_price: 80 }.
- Shopper says "What is your returns policy?". Call search_shop_policies_and_faqs with { query: "returns policy" }.
After tools finish, answer in one short, natural sentence describing the visible outcome. Do not narrate your reasoning or mention JSON.`;

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: 'OPENAI_API_KEY is not configured on the server.' }, 503);

  try {
    const body = await request.json();
    const tools = Array.isArray(body.tools) ? body.tools : [];
    const normalizeSchema = (schema) => {
      if (schema && typeof schema === 'object') return schema;
      if (typeof schema === 'string') {
        try { return JSON.parse(schema); } catch { /* fall through */ }
      }
      return { type: 'object', properties: {} };
    };

    const openAITools = tools.map((tool) => ({
      type: 'function',
      name: String(tool.name),
      description: String(tool.description ?? ''),
      parameters: normalizeSchema(tool.inputSchema),
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
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        instructions,
        input,
        tools: openAITools,
        tool_choice: 'auto',
        parallel_tool_calls: false,
        previous_response_id: body.previousResponseId || undefined,
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

export const config = {
  runtime: 'edge',
};

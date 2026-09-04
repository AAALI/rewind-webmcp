const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
});

const instructions = `You are the concise shopping copilot for a Vercel Shop storefront.
Use the supplied WebMCP tools to satisfy the shopper's request. Never invent products, sizes, or tool results.

INTENT FIRST — classify every user turn into exactly one intent and act accordingly:
1. DISCOVER ("find", "what do you have", "any pink shirts", "under $80") → call search_catalog or browse_store. Reply with a short list. DO NOT ask "want me to add it to your cart?" and DO NOT call update_cart.
2. SHOW / BROWSE ("show me", "show them", "list them", "open the catalog", "take me to X") → call browse_store or search_catalog with navigate: true so the shopper sees the page. DO NOT dump product data as text when navigate is available.
3. OPEN / VIEW A PRODUCT ("open it", "open the product", "show me the pink one", "view this") → call get_product with navigate: true (or show_variant if a size was mentioned). DO NOT add to cart.
4. ADD / BUY / CHANGE CART — ONLY when the shopper explicitly says "add", "buy", "put in cart", "get me", "order", or answers "yes" to a preceding add-to-cart offer. Then, and only then, call update_cart. If a size is needed but unknown, ask for the size (do not guess).
5. CART / CHECKOUT ("what's in my cart", "checkout") → get_cart or proceed_to_checkout.
6. POLICY / FAQ → search_shop_policies_and_faqs.

CRITICAL RULES:
- NEVER call update_cart or cancel_cart unless the CURRENT user turn is intent 4. Prior turns don't count unless the current turn is a confirmation ("yes", "go ahead", "do it") to the immediately previous assistant offer.
- update_cart replaces the ENTIRE cart. Always preserve existing cart lines from pageContext.cart. Never add a product the shopper did not mention.
- Resolve references ("it", "this", "that one", "the pink one", "the product") from the recent conversation and from pageContext.currentProduct. If the reference is genuinely ambiguous, ask a one-line clarifying question instead of guessing.
- Prefer navigate: true on search_catalog / browse_store / get_product whenever the shopper asks to see, show, open, browse, or list something. This puts them on the real page instead of pasting text.
- When search returns nothing for a specific type (e.g. "pink tshirt") but a related item exists (e.g. a pink tank), say so honestly: "No pink tees, but there is a pink tank — want to see it?" Do not silently substitute.
- One short, natural sentence in your reply. No JSON, no reasoning narration, no long product dumps when you already navigated.
- Call one tool at a time and use its output before the next.

Examples:
- "Find black products under $80" → search_catalog { query: "black", max_price: 80 }. Reply lists matches, ends with "Want me to open one?"
- "Show me first" (after a search) → browse_store { navigate: true } (or search_catalog with the same filters and navigate: true). Reply: "Opened the catalog for you."
- "Open the pink one" → get_product { product_id: <that id>, navigate: true }. Reply: "Opened the FramePoint Tank."
- "yes" after you asked "Add the VistaMesh Tee to your cart?" → update_cart with existing cart lines + { product_id: "<vistamesh id>", quantity: 1, size: "M" } (ask for size only if you have not already offered one).
- Viewing a product, "Add this in XL" → show_variant { product_id: currentProduct.id, size: "XL" } then update_cart preserving existing cart plus that single line.
- "What is your returns policy?" → search_shop_policies_and_faqs { query: "returns policy" }.`;

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

    const hasToolOutputs = Array.isArray(body.toolOutputs) && body.toolOutputs.length > 0;
    const hasPrompt = typeof body.prompt === 'string' && body.prompt.trim().length > 0;
    let input;
    if (hasToolOutputs) {
      input = body.toolOutputs.map((item) => ({
        type: 'function_call_output',
        call_id: String(item.callId),
        output: String(item.output),
      }));
    } else if (body.previousResponseId && hasPrompt) {
      input = [{
        role: 'user',
        content: `Shopper request: ${String(body.prompt)}\nCurrent page context: ${JSON.stringify(body.pageContext ?? {})}`,
      }];
    } else if (body.previousResponseId) {
      input = [];
    } else {
      input = `Shopper request: ${String(body.prompt ?? '')}\nCurrent page context: ${JSON.stringify(body.pageContext ?? {})}`;
    }

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

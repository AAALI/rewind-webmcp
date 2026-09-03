type WebMCPTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (
    input: Record<string, unknown>,
    context: { signal: AbortSignal },
  ) => unknown | Promise<unknown>;
};

interface WebMCPModelContext extends EventTarget {
  registerTool(
    tool: WebMCPTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ): Promise<void>;
  getTools(options?: { fromOrigins?: string[] }): Promise<Array<{
    name: string;
    title?: string;
    description: string;
    inputSchema: Record<string, unknown>;
    origin: string;
    annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  }>>;
  executeTool(
    tool: { name: string; origin: string },
    input: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ): Promise<string | null>;
}

interface Document {
  modelContext?: WebMCPModelContext;
}

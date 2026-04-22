import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createOpenClaudeStreamFn } from "./src/stream.js";

export default definePluginEntry({
  id: "openclaude",
  name: "OpenClaude Provider",
  description: "Connects OpenClaw to an OpenClaude gRPC server",
  register(api) {
    const config = (api.pluginConfig || {}) as { grpcHost?: string; grpcPort?: number };
    const host = config.grpcHost || "localhost";
    const port = config.grpcPort || 50051;

    api.registerProvider({
      id: "openclaude",
      label: "OpenClaude",
      docsPath: "/providers/openclaude",
      auth: [
        {
          id: "local",
          label: "Local gRPC",
          kind: "custom",
          run: async () => ({
            profiles: [
              {
                profileId: "openclaude:default",
                credential: { type: "api_key", apiKey: "none" } as any,
              },
            ],
          }),
        },
      ],
      catalog: {
        order: "simple",
        run: async () => ({
          provider: {
            id: "openclaude",
            label: "OpenClaude",
            api: "openclaude-grpc",
            models: {
              "openclaude/agent": {
                id: "openclaude/agent",
                label: "OpenClaude Agent",
                contextWindow: 200000,
              },
            },
          },
        }),
      },
      createStreamFn: () => createOpenClaudeStreamFn(host, port),
    });
  },
});

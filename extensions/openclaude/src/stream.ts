import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { createAssistantMessageEventStream } from "@mariozechner/pi-ai";
import type { StreamFn } from "@mariozechner/pi-agent-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.resolve(__dirname, "proto/openclaude.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const openclaudeProto = protoDescriptor.openclaude.v1;

export function createOpenClaudeStreamFn(host: string, port: number): StreamFn {
  const target = `${host}:${port}`;

  return (model, context, options) => {
    const stream = createAssistantMessageEventStream();

    const run = async () => {
      try {
        const client = new openclaudeProto.AgentService(
          target,
          grpc.credentials.createInsecure()
        );

        const call = client.Chat();

        const lastMessage = context.messages?.[context.messages.length - 1];
        const userText = typeof lastMessage?.content === "string" 
          ? lastMessage.content 
          : Array.isArray(lastMessage?.content) 
            ? lastMessage.content.map((c: any) => c.text || "").join("\n")
            : "";

        // Initial Request
        call.write({
          request: {
            message: userText,
            working_directory: process.cwd(),
            session_id: context.sessionId || "default",
          },
        });

        call.on("data", (serverMessage: any) => {
          if (serverMessage.text_chunk) {
            stream.push({
              type: "chunk",
              chunk: {
                text: serverMessage.text_chunk.text,
              },
            });
          } else if (serverMessage.done) {
            stream.push({
              type: "done",
              reason: "stop",
              message: {
                role: "assistant",
                content: serverMessage.done.full_text,
                usage: {
                  input_tokens: serverMessage.done.prompt_tokens,
                  output_tokens: serverMessage.done.completion_tokens,
                },
              },
            });
            call.end();
          } else if (serverMessage.error) {
            stream.push({
              type: "error",
              reason: "error",
              error: new Error(serverMessage.error.message),
            });
            call.end();
          }
          // TODO: Handle tool_start, tool_result, action_required for a richer agent experience
        });

        call.on("error", (err: Error) => {
          stream.push({
            type: "error",
            reason: "error",
            error: err,
          });
        });

        if (options?.signal) {
          options.signal.addEventListener("abort", () => {
            call.write({ cancel: { reason: "User aborted" } });
            call.end();
          });
        }
      } catch (err) {
        stream.push({
          type: "error",
          reason: "error",
          error: err instanceof Error ? err : new Error(String(err)),
        });
        stream.end();
      }
    };

    queueMicrotask(() => void run());
    return stream;
  };
}

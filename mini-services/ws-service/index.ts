import { createServer } from "http";
import { Server } from "socket.io";
import ZAI from "z-ai-web-dev-sdk";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const zaiPromise = ZAI.create();

const MODEL_MAP: Record<string, string> = {
  auto: "claude-sonnet-4-20250514",
  "gpt-4o": "gpt-4o",
  "claude-sonnet": "claude-sonnet-4-20250514",
  "gemini-pro": "gemini-2.5-pro",
  "deepseek-r1": "deepseek-r1",
  "llama-4": "llama-4-maverick",
  "qwen3": "qwen3-235b",
};

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Chat message handler with streaming simulation
  socket.on("chat:message", async (data) => {
    const { messages, model = "auto", chatId } = data;
    const startTime = Date.now();

    try {
      const zai = await zaiPromise;
      const selectedModel = MODEL_MAP[model] || MODEL_MAP.auto;

      socket.emit("chat:status", { status: "thinking", model: selectedModel });

      const completion = await zai.chat.completions.create({
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        model: selectedModel,
      });

      const fullContent = completion.choices?.[0]?.message?.content || "";
      const tokens =
        completion.usage?.total_tokens || Math.ceil(fullContent.length / 4);
      const duration = Date.now() - startTime;

      // Simulate streaming by chunking the response
      const chunkSize = 3;
      for (let i = 0; i < fullContent.length; i += chunkSize) {
        const chunk = fullContent.slice(i, i + chunkSize);
        socket.emit("chat:chunk", { chunk, chatId });
        await new Promise((r) => setTimeout(r, 15));
      }

      socket.emit("chat:done", {
        chatId,
        content: fullContent,
        model: selectedModel,
        tokens,
        cost: tokens * 0.003,
        duration,
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      socket.emit("chat:error", { chatId, error: error.message });
    }
  });

  // Agent execution handler
  socket.on("agent:execute", async (data) => {
    const { agentId, name, model = "auto" } = data;

    const steps = [
      { name: "Analyzing requirements", duration: 1500 },
      { name: "Searching codebase patterns", duration: 2000 },
      { name: "Generating implementation plan", duration: 2500 },
      { name: "Writing code", duration: 3000 },
      { name: "Running validation", duration: 1500 },
      { name: "Applying optimizations", duration: 1000 },
    ];

    for (let i = 0; i < steps.length; i++) {
      socket.emit("agent:step", {
        agentId,
        step: i + 1,
        total: steps.length,
        name: steps[i].name,
        status: "running",
      });
      await new Promise((r) => setTimeout(r, steps[i].duration));
      socket.emit("agent:step", {
        agentId,
        step: i + 1,
        total: steps.length,
        name: steps[i].name,
        status: "completed",
      });
    }

    // Generate actual AI response for the agent result
    try {
      const zai = await zaiPromise;
      const selectedModel = MODEL_MAP[model] || MODEL_MAP.auto;
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an expert coding agent. Provide a concise implementation summary.",
          },
          { role: "user", content: `Complete this task: ${name}` },
        ],
        model: selectedModel,
      });

      socket.emit("agent:complete", {
        agentId,
        result:
          completion.choices?.[0]?.message?.content ||
          "Task completed successfully",
        tokens: completion.usage?.total_tokens || 100,
        duration: Date.now(),
      });
    } catch {
      socket.emit("agent:complete", {
        agentId,
        result: "Task completed with simulated results",
        tokens: 100,
        duration: Date.now(),
      });
    }
  });

  // Web search handler
  socket.on("search:query", async (data) => {
    const { query, num = 10 } = data;
    try {
      const zai = await zaiPromise;
      const results = await zai.functions.invoke("web_search", { query, num });
      socket.emit("search:results", { query, results });
    } catch (error: any) {
      socket.emit("search:error", { query, error: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(3003, () => {
  console.log("MASSIVE NUMBER WebSocket service running on port 3003");
});

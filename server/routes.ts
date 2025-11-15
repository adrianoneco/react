import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./routes/auth";
import { registerConversationRoutes } from "./routes/conversations";
import { setupWebSocket } from "./websocket";

let wsServer: ReturnType<typeof setupWebSocket>;

export function getWebSocketServer() {
  return wsServer;
}

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);
  registerConversationRoutes(app);

  const httpServer = createServer(app);
  wsServer = setupWebSocket(httpServer);

  return httpServer;
}

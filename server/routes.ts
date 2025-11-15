import type { Express, Router } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./routes/auth";
import { registerConversationRoutes } from "./routes/conversations";
import { registerUploadRoutes } from "./routes/upload";
import { setupWebSocket } from "./websocket";

let wsServer: ReturnType<typeof setupWebSocket>;

export function getWebSocketServer() {
  return wsServer;
}

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);
  registerConversationRoutes(app);
  
  const uploadRouter = app as unknown as Router;
  registerUploadRoutes(uploadRouter);

  const httpServer = createServer(app);
  wsServer = setupWebSocket(httpServer);

  return httpServer;
}

import type { Express, Router } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./routes/auth";
import { registerConversationRoutes } from "./routes/conversations";
import { registerUploadRoutes } from "./routes/upload";
import { registerUserRoutes } from "./routes/users";
import { templatesRouter } from "./routes/templates";
import { aiRouter } from "./routes/ai";
import { setupWebSocket } from "./websocket";

let wsServer: ReturnType<typeof setupWebSocket>;

export function getWebSocketServer() {
  return wsServer;
}

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);
  registerConversationRoutes(app);
  registerUserRoutes(app);
  
  const uploadRouter = app as unknown as Router;
  registerUploadRoutes(uploadRouter);

  app.use("/api/templates", templatesRouter);
  app.use("/api/ai", aiRouter);

  const httpServer = createServer(app);
  wsServer = setupWebSocket(httpServer);

  return httpServer;
}

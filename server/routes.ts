import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAuthRoutes } from "./routes/auth";
import { registerConversationRoutes } from "./routes/conversations";

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);
  registerConversationRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}

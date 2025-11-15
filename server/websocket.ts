import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import { parse } from "url";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  conversationId?: string;
  authenticated?: boolean;
}

export function setupWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request: IncomingMessage, socket, head) => {
    const { pathname } = parse(request.url || "");
    
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws: AuthenticatedWebSocket) => {
    console.log("WebSocket client connected");

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "auth") {
          ws.userId = message.userId;
          ws.authenticated = true;
        }
        
        if (message.type === "subscribe") {
          ws.conversationId = message.conversationId;
        }
        
        if (message.type === "unsubscribe") {
          ws.conversationId = undefined;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  return {
    broadcast: (data: any) => {
      wss.clients.forEach((client) => {
        const authClient = client as AuthenticatedWebSocket;
        if (
          client.readyState === WebSocket.OPEN &&
          authClient.authenticated
        ) {
          client.send(JSON.stringify(data));
        }
      });
    },
    
    broadcastToConversation: (conversationId: string, data: any) => {
      wss.clients.forEach((client) => {
        const authClient = client as AuthenticatedWebSocket;
        if (
          client.readyState === WebSocket.OPEN &&
          authClient.conversationId === conversationId
        ) {
          client.send(JSON.stringify(data));
        }
      });
    },
    
    notifyConversationUpdate: (userId: string, data: any) => {
      wss.clients.forEach((client) => {
        const authClient = client as AuthenticatedWebSocket;
        if (
          client.readyState === WebSocket.OPEN &&
          authClient.userId === userId
        ) {
          client.send(JSON.stringify(data));
        }
      });
    }
  };
}

import type { Express, Request, Response } from "express";
import { insertConversationSchema, insertMessageSchema, updateConversationSchema } from "@shared/schema";
import { storage } from "../storage";

export function registerConversationRoutes(app: Express) {
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const { status } = req.query;
      const conversations = await storage.getConversations({
        status: status as string | undefined,
        userId: user.id,
        role: user.role,
      });

      res.json(conversations);
    } catch (error: any) {
      console.error("Get conversations error:", error);
      res.status(500).json({ 
        message: "Erro ao buscar conversas" 
      });
    }
  });

  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      if (
        conversation.clientId !== user.id &&
        conversation.attendantId !== user.id &&
        user.role !== 'attendant'
      ) {
        return res.status(403).json({ message: "Sem permissão para acessar esta conversa" });
      }

      res.json(conversation);
    } catch (error: any) {
      console.error("Get conversation error:", error);
      res.status(500).json({ 
        message: "Erro ao buscar conversa" 
      });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      if (user.role !== 'client') {
        return res.status(403).json({ 
          message: "Apenas clientes podem criar conversas" 
        });
      }

      const validatedData = insertConversationSchema.parse({
        clientId: user.id,
        status: 'pending',
      });

      const conversation = await storage.createConversation(validatedData);

      res.json(conversation);
    } catch (error: any) {
      console.error("Create conversation error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao criar conversa" 
      });
    }
  });

  app.patch("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      if (user.role !== 'attendant') {
        return res.status(403).json({ 
          message: "Apenas atendentes podem atualizar conversas" 
        });
      }

      const validatedData = updateConversationSchema.parse(req.body);

      if (validatedData.attendantId && validatedData.attendantId !== user.id) {
        return res.status(403).json({ 
          message: "Você só pode atribuir conversas para si mesmo" 
        });
      }

      const updatedConversation = await storage.updateConversation(
        req.params.id,
        validatedData
      );

      res.json(updatedConversation);
    } catch (error: any) {
      console.error("Update conversation error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao atualizar conversa" 
      });
    }
  });

  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      if (
        conversation.clientId !== user.id &&
        conversation.attendantId !== user.id &&
        user.role !== 'attendant'
      ) {
        return res.status(403).json({ message: "Sem permissão para acessar esta conversa" });
      }

      const messages = await storage.getMessagesByConversation(req.params.id);

      res.json(messages);
    } catch (error: any) {
      console.error("Get messages error:", error);
      res.status(500).json({ 
        message: "Erro ao buscar mensagens" 
      });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }

      if (
        conversation.clientId !== user.id &&
        conversation.attendantId !== user.id
      ) {
        return res.status(403).json({ message: "Sem permissão para enviar mensagens nesta conversa" });
      }

      const validatedData = insertMessageSchema.parse({
        conversationId: req.params.id,
        senderId: user.id,
        content: req.body.content,
      });

      const message = await storage.createMessage(validatedData);

      res.json(message);
    } catch (error: any) {
      console.error("Create message error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao enviar mensagem" 
      });
    }
  });
}

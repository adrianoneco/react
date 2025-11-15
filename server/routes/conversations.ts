import type { Express, Request, Response } from "express";
import { insertConversationSchema, insertMessageSchema, updateConversationSchema, insertReactionSchema } from "@shared/schema";
import { storage } from "../storage";
import { getWebSocketServer } from "../routes";
import { upload } from "../upload";

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

      const isClient = user.role === 'client' && conversation.clientId === user.id;
      const isAssignedAttendant = user.role === 'attendant' && conversation.attendantId === user.id;
      const isPendingUnassigned = user.role === 'attendant' && conversation.status === 'pending' && !conversation.attendantId;

      if (!isClient && !isAssignedAttendant && !isPendingUnassigned) {
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

      const isAssigningToSelf = validatedData.attendantId === user.id && !conversation.attendantId;
      const isAlreadyAssigned = conversation.attendantId === user.id;

      if (!isAssigningToSelf && !isAlreadyAssigned) {
        return res.status(403).json({ 
          message: "Você só pode alterar conversas atribuídas a você" 
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

      const isClient = user.role === 'client' && conversation.clientId === user.id;
      const isAssignedAttendant = user.role === 'attendant' && conversation.attendantId === user.id;
      const isPendingUnassigned = user.role === 'attendant' && conversation.status === 'pending' && !conversation.attendantId;

      if (!isClient && !isAssignedAttendant && !isPendingUnassigned) {
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

  app.post("/api/conversations/:id/messages", upload.single('file'), async (req: Request, res: Response) => {
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

      let messageType = 'text';
      let fileUrl = null;
      let fileName = null;

      if (req.file) {
        fileUrl = `/${req.file.path}`;
        fileName = req.file.originalname;
        
        if (req.file.mimetype.startsWith('image/')) {
          messageType = 'image';
        } else if (req.file.mimetype.startsWith('audio/')) {
          messageType = 'audio';
        } else if (req.file.mimetype.startsWith('video/')) {
          messageType = 'video';
        } else {
          messageType = 'file';
        }
      }

      const validatedData = insertMessageSchema.parse({
        conversationId: req.params.id,
        senderId: user.id,
        content: req.body.content || '',
        messageType,
        fileUrl,
        fileName,
        replyToId: req.body.replyToId || undefined,
      });

      const message = await storage.createMessage(validatedData);

      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.broadcast(req.params.id, {
          type: "new_message",
          message,
        });
      }

      res.json(message);
    } catch (error: any) {
      console.error("Create message error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao enviar mensagem" 
      });
    }
  });

  app.post("/api/messages/:messageId/reactions", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const { emoji } = req.body;
      if (!emoji) {
        return res.status(400).json({ message: "Emoji é obrigatório" });
      }

      const validatedData = insertReactionSchema.parse({
        messageId: req.params.messageId,
        userId: user.id,
        emoji,
      });

      const reaction = await storage.createReaction(validatedData);

      const message = await storage.getMessage(req.params.messageId);
      
      if (message) {
        const wsServer = getWebSocketServer();
        if (wsServer) {
          wsServer.broadcast(message.conversationId, {
            type: "new_reaction",
            reaction,
          });
        }
      }

      res.json(reaction);
    } catch (error: any) {
      console.error("Create reaction error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao adicionar reação" 
      });
    }
  });

  app.delete("/api/messages/:messageId/reactions", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const { emoji } = req.body;
      if (!emoji) {
        return res.status(400).json({ message: "Emoji é obrigatório" });
      }

      await storage.deleteReaction(req.params.messageId, user.id, emoji);

      const message = await storage.getMessage(req.params.messageId);
      
      if (message) {
        const wsServer = getWebSocketServer();
        if (wsServer) {
          wsServer.broadcast(message.conversationId, {
            type: "delete_reaction",
            messageId: req.params.messageId,
            userId: user.id,
            emoji,
          });
        }
      }

      res.status(204).send();
    } catch (error: any) {
      console.error("Delete reaction error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao remover reação" 
      });
    }
  });

  app.get("/api/messages/:messageId/reactions", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const reactions = await storage.getReactionsByMessage(req.params.messageId);
      res.json(reactions);
    } catch (error: any) {
      console.error("Get reactions error:", error);
      res.status(500).json({ 
        message: "Erro ao buscar reações" 
      });
    }
  });
}

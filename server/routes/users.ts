import type { Express, Request, Response } from "express";
import { updateUserSchema, createUserBodySchema, updateUserBodySchema } from "@shared/schema";
import { storage } from "../storage";
import { getWebSocketServer } from "../routes";
import { upload } from "../upload";
import argon2 from "argon2";

export function registerUserRoutes(app: Express) {
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "attendant") {
        return res.status(403).json({ message: "Apenas atendentes podem ver usuários" });
      }

      const { role } = req.query;
      const users = await storage.getUsers({ role: role as string | undefined });

      const usersWithoutPassword = users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });

      res.json(usersWithoutPassword);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ 
        message: "Erro ao buscar usuários" 
      });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "attendant") {
        return res.status(403).json({ message: "Apenas atendentes podem criar usuários" });
      }

      const validatedBody = createUserBodySchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(validatedBody.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      const hashedPassword = await argon2.hash(validatedBody.password);
      const newUser = await storage.createUser({
        username: validatedBody.username,
        password: hashedPassword,
        role: validatedBody.role,
      });

      const { password: _, ...userWithoutPassword } = newUser;

      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.broadcast({
          type: "user_created",
          user: userWithoutPassword,
        });
      }

      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao criar usuário" 
      });
    }
  });

  app.patch("/api/users/:id", upload.single('profilePicture'), async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const { profilePicture: _, ...bodyWithoutProfilePicture } = req.body;
      const validatedBody = updateUserBodySchema.parse(bodyWithoutProfilePicture);

      const isSelf = req.params.id === currentUser.id;
      const isAttendant = currentUser.role === "attendant";

      if (!isSelf && !isAttendant) {
        return res.status(403).json({ message: "Sem permissão para alterar este usuário" });
      }

      const updates: any = {};

      if (validatedBody.username) {
        if (!isSelf && !isAttendant) {
          return res.status(403).json({ message: "Sem permissão para alterar username" });
        }
        updates.username = validatedBody.username;
      }
      
      if (validatedBody.password) {
        if (!isSelf && !isAttendant) {
          return res.status(403).json({ message: "Sem permissão para alterar senha" });
        }
        updates.password = await argon2.hash(validatedBody.password);
      }

      if (validatedBody.role) {
        if (!isAttendant) {
          return res.status(403).json({ message: "Apenas atendentes podem alterar o tipo de usuário" });
        }
        if (isSelf) {
          return res.status(403).json({ message: "Você não pode alterar seu próprio tipo" });
        }
        updates.role = validatedBody.role;
      }

      if (req.file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({ message: "Tipo de arquivo inválido. Use JPEG, PNG, GIF ou WEBP" });
        }
        if (req.file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ message: "Arquivo muito grande. Máximo 5MB" });
        }
        const sanitizedPath = req.file.path.replace(/\\/g, '/');
        updates.profilePicture = `/${sanitizedPath}`;
      }

      const validatedData = updateUserSchema.parse(updates);
      const updatedUser = await storage.updateUser(req.params.id, validatedData);

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const { password, ...userWithoutPassword } = updatedUser;

      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.broadcast({
          type: "user_updated",
          user: userWithoutPassword,
        });
      }

      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao atualizar usuário" 
      });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "attendant") {
        return res.status(403).json({ message: "Apenas atendentes podem deletar usuários" });
      }

      if (req.params.id === user.id) {
        return res.status(400).json({ message: "Você não pode deletar a si mesmo" });
      }

      await storage.deleteUser(req.params.id);

      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.broadcast({
          type: "user_deleted",
          userId: req.params.id,
        });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error("Delete user error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao deletar usuário" 
      });
    }
  });
}

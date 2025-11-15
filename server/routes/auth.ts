import type { Express, Request, Response } from "express";
import { loginSchema, insertUserSchema } from "@shared/schema";
import { storage } from "../storage";
import { hashPassword, verifyPassword } from "../utils/auth";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const { username, password, role } = validatedData;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Nome de usuário já está em uso" 
        });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role,
      });

      req.session.userId = user.id;

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao criar conta" 
      });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { username, password } = validatedData;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ 
          message: "Nome de usuário ou senha incorretos" 
        });
      }

      const isValidPassword = await verifyPassword(user.password, password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: "Nome de usuário ou senha incorretos" 
        });
      }

      req.session.userId = user.id;

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ 
        message: error.message || "Erro ao fazer login" 
      });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ 
        message: "Erro ao buscar usuário" 
      });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ 
            message: "Erro ao fazer logout" 
          });
        }
        res.json({ message: "Logout realizado com sucesso" });
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(500).json({ 
        message: "Erro ao fazer logout" 
      });
    }
  });
}

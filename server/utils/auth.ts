import argon2 from 'argon2';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
    
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Erro de autenticação" });
  }
}

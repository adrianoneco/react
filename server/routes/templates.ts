import { Router } from "express";
import { db } from "../db";
import { messageTemplates } from "@shared/schema";
import { insertMessageTemplateSchema, updateMessageTemplateSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "../utils/auth";

export const templatesRouter = Router();

templatesRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const templates = await db
      .select()
      .from(messageTemplates)
      .where(eq(messageTemplates.userId, req.user!.id));
    
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar templates" });
  }
});

templatesRouter.post("/", isAuthenticated, async (req, res) => {
  try {
    const data = insertMessageTemplateSchema.parse({
      ...req.body,
      userId: req.user!.id,
    });

    const [template] = await db
      .insert(messageTemplates)
      .values(data)
      .returning();

    res.json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Erro ao criar template" });
  }
});

templatesRouter.patch("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateMessageTemplateSchema.parse(req.body);

    const [template] = await db
      .update(messageTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.userId, req.user!.id)
      ))
      .returning();

    if (!template) {
      return res.status(404).json({ message: "Template não encontrado" });
    }

    res.json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Erro ao atualizar template" });
  }
});

templatesRouter.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const [template] = await db
      .delete(messageTemplates)
      .where(and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.userId, req.user!.id)
      ))
      .returning();

    if (!template) {
      return res.status(404).json({ message: "Template não encontrado" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar template" });
  }
});

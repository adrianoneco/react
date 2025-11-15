import { 
  users, 
  conversations, 
  messages, 
  type User, 
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type UpdateConversation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import { generateProtocolNumber } from "@shared/utils";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversations(filters: { status?: string; userId?: string; role?: string }): Promise<Conversation[]>;
  updateConversation(id: string, updates: UpdateConversation): Promise<Conversation | undefined>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    let protocolNumber = generateProtocolNumber();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const [conversation] = await db
          .insert(conversations)
          .values({
            ...insertConversation,
            protocolNumber,
          })
          .returning();
        return conversation;
      } catch (error: any) {
        if (error.code === '23505' && attempts < maxAttempts - 1) {
          protocolNumber = generateProtocolNumber();
          attempts++;
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Falha ao gerar número de protocolo único');
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversations(filters: { status?: string; userId?: string; role?: string }): Promise<Conversation[]> {
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(conversations.status, filters.status as any));
    }
    
    if (filters.userId && filters.role) {
      if (filters.role === 'client') {
        conditions.push(eq(conversations.clientId, filters.userId));
      } else if (filters.role === 'attendant') {
        conditions.push(
          or(
            eq(conversations.attendantId, filters.userId),
            and(
              eq(conversations.status, 'pending'),
              isNull(conversations.attendantId)
            )
          )
        );
      }
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const result = await db
      .select()
      .from(conversations)
      .where(whereClause)
      .orderBy(desc(conversations.updatedAt));
    
    return result;
  }

  async updateConversation(id: string, updates: UpdateConversation): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, insertMessage.conversationId));
    
    return message;
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
    return result;
  }
}

export const storage = new DatabaseStorage();

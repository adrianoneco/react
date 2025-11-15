import { Router } from "express";
import { isAuthenticated } from "../utils/auth";

export const aiRouter = Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroqAPI(messages: any[]) {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  return response.json();
}

aiRouter.post("/correct-text", isAuthenticated, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Texto é obrigatório" });
    }

    const messages = [
      {
        role: "system",
        content: "Você é um assistente que corrige ortografia, gramática e melhora a clareza de textos em português. Retorne apenas o texto corrigido, sem explicações ou comentários adicionais.",
      },
      {
        role: "user",
        content: `Corrija o seguinte texto: ${text}`,
      },
    ];

    const result = await callGroqAPI(messages);
    const correctedText = result.choices[0]?.message?.content || text;

    res.json({ correctedText });
  } catch (error: any) {
    console.error("Erro ao corrigir texto:", error);
    res.status(500).json({ message: "Erro ao corrigir texto com IA" });
  }
});

aiRouter.post("/suggest-message", isAuthenticated, async (req, res) => {
  try {
    const { prompt, variables } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt é obrigatório" });
    }

    const systemPrompt = `Você é um assistente de atendimento ao cliente profissional. Gere mensagens de suporte claras, educadas e úteis em português do Brasil.

Variáveis disponíveis para usar na mensagem:
- {{clientName}}: Nome do cliente
- {{attendantName}}: Nome do atendente
- {{protocol}}: Número do protocolo de atendimento
- {{conversationDate}}: Data da conversa

IMPORTANTE: Use as variáveis exatamente como mostrado acima (com chaves duplas) na sua resposta quando apropriado.

Retorne apenas o texto da mensagem, sem explicações adicionais.`;

    const userPrompt = variables 
      ? `${prompt}\n\nInformações disponíveis:\n${JSON.stringify(variables, null, 2)}`
      : prompt;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const result = await callGroqAPI(messages);
    const suggestedMessage = result.choices[0]?.message?.content || "";

    res.json({ suggestedMessage });
  } catch (error: any) {
    console.error("Erro ao gerar sugestão:", error);
    res.status(500).json({ message: "Erro ao gerar sugestão com IA" });
  }
});

aiRouter.post("/generate-template", isAuthenticated, async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ message: "Descrição é obrigatória" });
    }

    const messages = [
      {
        role: "system",
        content: `Você é um assistente que cria templates de mensagens para atendimento ao cliente.

Variáveis disponíveis:
- {{clientName}}: Nome do cliente
- {{attendantName}}: Nome do atendente
- {{protocol}}: Número do protocolo de atendimento
- {{conversationDate}}: Data da conversa

IMPORTANTE: Inclua as variáveis apropriadas na mensagem usando a sintaxe {{variableName}}.
Retorne apenas o texto do template, sem explicações.`,
      },
      {
        role: "user",
        content: `Crie um template de mensagem para: ${description}`,
      },
    ];

    const result = await callGroqAPI(messages);
    const template = result.choices[0]?.message?.content || "";

    res.json({ template });
  } catch (error: any) {
    console.error("Erro ao gerar template:", error);
    res.status(500).json({ message: "Erro ao gerar template com IA" });
  }
});

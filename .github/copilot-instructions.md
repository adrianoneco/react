# ChatApp - Sistema de Atendimento ao Cliente em Tempo Real

## Visão Geral do Projeto

ChatApp é uma aplicação completa de atendimento ao cliente em tempo real, desenvolvida com React, Express, PostgreSQL e WebSocket. O sistema oferece comunicação bidirecional entre clientes e atendentes com suporte a múltiplos tipos de mídia, reações, citações e gerenciamento de usuários.

## Arquitetura do Sistema

### Stack Tecnológico

**Frontend:**
- React 18 com TypeScript
- Vite como build tool
- Wouter para roteamento
- TanStack Query v5 para gerenciamento de estado do servidor
- shadcn/ui (Radix UI) para componentes
- Tailwind CSS para estilização
- WebSocket para comunicação em tempo real

**Backend:**
- Express.js com TypeScript
- PostgreSQL (Neon serverless)
- Drizzle ORM para queries type-safe
- WebSocket (ws) para comunicação em tempo real
- Argon2 para hash de senhas
- Multer para upload de arquivos
- Express-session para autenticação baseada em sessão

## Estrutura do Banco de Dados

### Tabelas Principais

**users**
- id: varchar (UUID gerado automaticamente)
- username: text (único, não nulo)
- password: text (hash argon2, não nulo)
- role: enum ['client', 'attendant'] (padrão: 'client')
- profilePicture: text (URL opcional)
- createdAt: timestamp (padrão: now())

**conversations**
- id: varchar (UUID)
- protocolNumber: varchar(10) (único, gerado automaticamente)
- clientId: varchar (referência a users.id)
- attendantId: varchar (referência a users.id, opcional)
- status: enum ['pending', 'attending', 'closed'] (padrão: 'pending')
- createdAt: timestamp
- updatedAt: timestamp

**messages**
- id: varchar (UUID)
- conversationId: varchar (referência a conversations.id)
- senderId: varchar (referência a users.id)
- content: text (opcional para mensagens de mídia)
- messageType: enum ['text', 'image', 'audio', 'video', 'file'] (padrão: 'text')
- fileUrl: text (opcional)
- fileName: text (opcional)
- replyToId: varchar (auto-referência para citações)
- createdAt: timestamp

**reactions**
- id: varchar (UUID)
- messageId: varchar (referência a messages.id, cascade delete)
- userId: varchar (referência a users.id)
- emoji: text (não nulo)
- createdAt: timestamp

## APIs REST

### Autenticação (/api/auth)
- POST /login - Login com credenciais
- POST /register - Registro de novo usuário
- POST /logout - Encerrar sessão
- GET /me - Obter usuário atual

### Conversas (/api/conversations)
- GET / - Listar conversas (com filtro por status)
- GET /:id - Obter detalhes de uma conversa
- POST / - Criar nova conversa (apenas clientes)
- PATCH /:id - Atualizar conversa (atendentes)
- GET /:id/messages - Listar mensagens de uma conversa
- POST /:id/messages - Enviar mensagem (suporta FormData para arquivos)

### Mensagens (/api/messages)
- POST /:messageId/reactions - Adicionar reação
- DELETE /:messageId/reactions - Remover reação
- GET /:messageId/reactions - Listar reações

### Usuários (/api/users)
- GET / - Listar usuários (apenas atendentes, com filtro por role)
- PATCH /:id - Atualizar usuário (suporta upload de foto)
- DELETE /:id - Deletar usuário (apenas atendentes)

### Upload (/api/upload)
- POST / - Upload de arquivo (requer autenticação)

## WebSocket

### Conexão
- Endpoint: ws://host/ws
- Protocolo: JSON messages

### Tipos de Mensagens

**Cliente → Servidor:**
```json
{ "type": "auth", "userId": "user-id" }
{ "type": "subscribe", "conversationId": "conv-id" }
{ "type": "unsubscribe" }
```

**Servidor → Cliente:**
```json
{ "type": "new_message", "message": {...} }
{ "type": "new_reaction", "reaction": {...} }
{ "type": "delete_reaction", "messageId": "...", "userId": "...", "emoji": "..." }
{ "type": "user_updated", "user": {...} }
{ "type": "user_deleted", "userId": "..." }
```

## Funcionalidades de Mídia

### Tipos de Mídia Suportados

**Imagens:** JPEG, PNG, GIF, WEBP
**Áudio:** MP3, WAV, OGG, WEBM
**Vídeo:** MP4, WEBM, OGG
**Documentos:** PDF, DOC, DOCX, XLS, XLSX, TXT

### Upload de Arquivos

- Tamanho máximo: 50MB
- Armazenamento: Sistema de arquivos local em /uploads/{tipo}/
- Organização por tipo de mídia
- Nome único gerado automaticamente

### Captura de Mídia

**Componente MediaCapture:**
- Gravação de áudio usando MediaRecorder API
- Gravação de vídeo usando MediaRecorder API
- Captura de fotos usando getUserMedia + Canvas

**Componente FileUpload:**
- Upload de imagens com preview
- Upload de arquivos diversos
- Validação de tipo MIME

## Sistema de Mensagens

### Citações (Reply)
- Campo replyToId vincula mensagem à mensagem citada
- Visualização estilo WhatsApp com borda lateral
- Preview do conteúdo citado
- Rolagem automática para mensagem citada

### Reações
- Sistema de emojis por mensagem
- WebSocket para atualizações em tempo real
- Múltiplas reações por usuário permitidas
- Armazenamento em tabela separada

### Tipos de Mensagem
- Texto simples
- Imagens com preview
- Áudio com player integrado
- Vídeo com player integrado
- Arquivos com download

## Gerenciamento de Usuários

### Página de Usuários (/users)

**Visualizações:**
- Cards: Grid responsivo com avatares
- Tabela: Lista detalhada com ordenação

**Filtros:**
- Por tipo (todos, clientes, atendentes)
- Busca por nome de usuário

**Ações (apenas atendentes):**
- Criar usuário
- Editar usuário (incluindo foto de perfil)
- Deletar usuário
- Upload de foto de perfil

### Componente DataView (Reutilizável)

**Props:**
- data: Array de dados
- columns: Definição de colunas para tabela
- renderCard: Função para renderizar card
- keyExtractor: Função para chave única
- searchPlaceholder: Texto do campo de busca
- onSearch: Callback de busca
- filters: Componentes de filtro personalizados
- actions: Botões de ação personalizados

**Recursos:**
- Alternância entre visualização cards/tabela
- Busca integrada
- Filtros personalizáveis
- Responsivo
- ScrollArea para grandes conjuntos de dados

## Padrões de Código

### Frontend

**Estrutura de Arquivos:**
```
client/src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── data-view.tsx    # Componente global de visualização
│   ├── media-capture.tsx
│   ├── file-upload.tsx
│   └── ...
├── pages/
│   ├── conversations.tsx
│   ├── users.tsx
│   └── ...
├── contexts/
│   └── auth-context.tsx
└── lib/
    ├── queryClient.ts
    └── utils.ts
```

**Queries (TanStack Query):**
```typescript
// Sempre use object form (v5)
const { data } = useQuery({
  queryKey: ['/api/resource', id],
  enabled: !!id,
});

// Mutations
const mutation = useMutation({
  mutationFn: async (data) => { ... },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/resource'] });
  }
});
```

**Formulários:**
```typescript
// Use react-hook-form com zodResolver
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

### Backend

**Estrutura de Arquivos:**
```
server/
├── routes/
│   ├── auth.ts
│   ├── conversations.ts
│   ├── users.ts
│   └── upload.ts
├── storage.ts      # Interface e implementação
├── db.ts          # Drizzle client
├── upload.ts      # Multer config
├── websocket.ts   # WebSocket setup
└── index.ts       # Express app
```

**Padrão de Rotas:**
```typescript
// Sempre validar autenticação
if (!req.session.userId) {
  return res.status(401).json({ message: "Não autenticado" });
}

// Validar com Zod
const validatedData = schema.parse(req.body);

// Usar storage interface
const result = await storage.method(validatedData);

// Broadcast WebSocket se necessário
const wsServer = getWebSocketServer();
if (wsServer) {
  wsServer.broadcast(conversationId, { type: "...", data: ... });
}
```

**Storage Pattern:**
```typescript
// Interface define contratos
export interface IStorage {
  method(params): Promise<ReturnType>;
}

// Implementação usa Drizzle ORM
export class DatabaseStorage implements IStorage {
  async method(params) {
    const [result] = await db
      .select()
      .from(table)
      .where(eq(table.field, value));
    return result;
  }
}
```

## Schemas Zod

### Validação de Entrada
```typescript
// Login
z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

// Registro
loginSchema.extend({
  confirmPassword: z.string(),
  role: z.enum(["client", "attendant"]),
}).refine(data => data.password === data.confirmPassword)

// Update User
z.object({
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["client", "attendant"]).optional(),
  profilePicture: z.string().optional(),
})
```

## Segurança

### Autenticação e Autorização
- Sessões seguras com httpOnly cookies
- Verificação de role para ações restritas
- Validação de propriedade de recursos
- Hash de senha com argon2

### Upload de Arquivos
- Whitelist de tipos MIME
- Limite de tamanho (50MB)
- Nomes de arquivo únicos
- Organização por diretório de tipo
- Autenticação obrigatória

### WebSocket
- Autenticação via mensagem inicial
- Subscrição baseada em sala (conversationId)
- Broadcast apenas para clientes autorizados

## Boas Práticas

### Performance
- Queries otimizadas com índices
- WebSocket para atualizações em tempo real (evita polling)
- Lazy loading de componentes
- Debounce em buscas
- Invalidação seletiva de cache

### UX
- Loading states durante operações assíncronas
- Toasts para feedback de ações
- Confirmação para ações destrutivas
- Scroll automático em novas mensagens
- Indicadores visuais de estado

### Código
- TypeScript strict mode
- Tipos compartilhados entre client/server
- Validação em ambos os lados
- Tratamento de erros consistente
- Logs estruturados

## Fluxos Principais

### Fluxo de Atendimento
1. Cliente cria nova conversa (status: pending)
2. Conversa aparece na lista de atendentes
3. Atendente assume a conversa (status: attending)
4. Troca de mensagens em tempo real via WebSocket
5. Atendente fecha conversa (status: closed)

### Fluxo de Mensagem com Mídia
1. Usuário seleciona tipo de mídia (foto, áudio, vídeo, arquivo)
2. Captura ou seleção de arquivo
3. Preview opcional
4. Upload via FormData
5. Servidor processa e armazena
6. Mensagem criada com fileUrl e fileName
7. Broadcast via WebSocket
8. Renderização específica por tipo de mídia

### Fluxo de Gerenciamento de Usuários
1. Atendente acessa página de usuários
2. Visualiza em cards ou tabela
3. Filtra por tipo ou busca
4. Edita usuário (incluindo foto)
5. Upload de foto de perfil
6. Atualização em tempo real via WebSocket

## Resolução de Problemas Comuns

### WebSocket não conecta
- Verificar protocolo (ws/wss)
- Confirmar mensagem de autenticação
- Checar subscrição à sala correta

### Upload falha
- Verificar tamanho do arquivo
- Confirmar tipo MIME permitido
- Verificar autenticação
- Checar permissões de diretório

### Mensagem não aparece em tempo real
- Verificar broadcast para conversationId correto
- Confirmar subscrição ativa
- Validar parsing de mensagem WebSocket

### Erro de validação
- Verificar schema Zod
- Confirmar todos os campos obrigatórios
- Checar tipos de dados

## Próximos Passos Sugeridos

1. **Notificações Push:** Implementar service worker para notificações
2. **Histórico de Mensagens:** Paginação infinita
3. **Busca de Mensagens:** Full-text search no PostgreSQL
4. **Analytics:** Dashboard de métricas de atendimento
5. **Exportação:** Exportar conversas em PDF
6. **Temas:** Personalização de cores
7. **Internacionalização:** Suporte multi-idioma
8. **Mobile:** PWA ou app nativo

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Iniciar produção
npm start

# Sincronizar schema do banco
npm run db:push

# Verificar tipos
npm run check
```

## Variáveis de Ambiente

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
PORT=5000
NODE_ENV=development|production
```

Este documento serve como guia completo para o GitHub Copilot entender a arquitetura, padrões e funcionalidades do ChatApp, facilitando sugestões de código contextualmente relevantes.

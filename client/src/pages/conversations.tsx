import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Send, MessageSquare, ChevronRight, Clock, CheckCircle, XCircle, Plus, Image, Mic, Video, Paperclip, Reply, X, Smile, Camera, Sparkles, CheckCheck, Phone } from "lucide-react";
import type { Conversation, Message, MessageTemplate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getTime, getDate } from "@shared/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaCapture } from "@/components/media-capture";
import { FileUpload } from "@/components/file-upload";
import { WebRTCCall } from "@/components/webrtc-call";

export default function Conversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [messageContent, setMessageContent] = useState("");
  const [infoSidebarOpen, setInfoSidebarOpen] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [mediaDialog, setMediaDialog] = useState<'audio' | 'video' | 'photo' | null>(null);
  const [fileDialog, setFileDialog] = useState<'image' | 'file' | null>(null);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/templates"],
    enabled: user?.role === "attendant",
  });

  const { data: conversations = [], refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", selectedStatus],
    queryFn: async () => {
      const response = await fetch(`/api/conversations?status=${selectedStatus}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
  });

  const { data: selectedConversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", selectedConversationId],
    enabled: !!selectedConversationId,
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${selectedConversationId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch conversation");
      return response.json();
    },
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });

  useEffect(() => {
    if (!selectedConversationId || !user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: user.id }));
      ws.send(JSON.stringify({ type: "subscribe", conversationId: selectedConversationId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") {
        refetchMessages();
        refetchConversations();
      }
    };

    wsRef.current = ws;

    return () => {
      ws.send(JSON.stringify({ type: "unsubscribe" }));
      ws.close();
    };
  }, [selectedConversationId, user, refetchMessages, refetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {});
      return response.json() as Promise<Conversation>;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(newConversation.id);
      setSelectedStatus("pending");
      toast({
        title: "Conversa criada!",
        description: `Protocolo: ${newConversation.protocolNumber}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conversa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, file }: { content: string; file?: File }) => {
      const formData = new FormData();
      formData.append("content", content);
      
      if (replyingTo?.id) {
        formData.append("replyToId", replyingTo.id);
      }
      
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      setMessageContent("");
      setReplyingTo(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: async ({ id, status, attendantId }: { id: string; status?: string; attendantId?: string }) => {
      const response = await apiRequest("PATCH", `/api/conversations/${id}`, {
        status,
        attendantId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Conversa atualizada!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar conversa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate({ content: messageContent });
  };

  const handleMediaCapture = async (file: File) => {
    if (!selectedConversationId) return;
    sendMessageMutation.mutate({ content: file.name, file });
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedConversationId) return;
    sendMessageMutation.mutate({ content: file.name, file });
  };

  const handleAssignToMe = () => {
    if (!selectedConversationId || !user) return;
    updateConversationMutation.mutate({
      id: selectedConversationId,
      attendantId: user.id,
      status: "attending",
    });
  };

  const handleChangeStatus = (newStatus: string) => {
    if (!selectedConversationId) return;
    updateConversationMutation.mutate({
      id: selectedConversationId,
      status: newStatus,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: any; label: string }> = {
      pending: { icon: Clock, label: "Pendente" },
      attending: { icon: CheckCircle, label: "Atendendo" },
      closed: { icon: XCircle, label: "Fechado" },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error("Failed to add reaction");
      }

      refetchMessages();
    } catch (error) {
      toast({
        title: "Erro ao adicionar reação",
        variant: "destructive",
      });
    }
  };

  const handleCorrectText = async () => {
    if (!messageContent.trim()) return;
    setIsCorrecting(true);
    try {
      const response = await apiRequest("POST", "/api/ai/correct-text", {
        text: messageContent,
      });
      const data = await response.json();
      setMessageContent(data.correctedText);
      toast({
        title: "Texto corrigido!",
        description: "A IA corrigiu seu texto.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível corrigir o texto",
        variant: "destructive",
      });
    } finally {
      setIsCorrecting(false);
    }
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    let content = template.content;
    
    if (selectedConversation && user) {
      content = content
        .replace(/\{\{clientName\}\}/g, "Cliente")
        .replace(/\{\{attendantName\}\}/g, user.username)
        .replace(/\{\{protocol\}\}/g, selectedConversation.protocolNumber)
        .replace(/\{\{conversationDate\}\}/g, getDate(selectedConversation.createdAt));
    }
    
    setMessageContent(content);
    setAiAssistantOpen(false);
    toast({
      title: "Template aplicado!",
      description: "O template foi inserido na mensagem.",
    });
  };

  const getOtherUserId = () => {
    if (!selectedConversation || !user) return "";
    return user.id === selectedConversation.clientId 
      ? selectedConversation.attendantId || ""
      : selectedConversation.clientId;
  };

  const renderMessage = (msg: Message) => {
    const repliedMessage = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
    const isMine = msg.senderId === user?.id;

    const renderMediaContent = () => {
      switch (msg.messageType) {
        case 'image':
          return msg.fileUrl ? (
            <img src={msg.fileUrl} alt={msg.fileName || 'Image'} className="max-w-full rounded-md mb-2" />
          ) : null;
        case 'audio':
          return msg.fileUrl ? (
            <audio src={msg.fileUrl} controls className="w-full mb-2" />
          ) : null;
        case 'video':
          return msg.fileUrl ? (
            <video src={msg.fileUrl} controls className="max-w-full rounded-md mb-2" />
          ) : null;
        case 'file':
          return msg.fileUrl ? (
            <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-2 p-2 border rounded-md mb-2 hover:bg-muted/50">
              <Paperclip className="w-4 h-4" />
              <span className="text-sm truncate">{msg.fileName}</span>
            </a>
          ) : null;
        default:
          return null;
      }
    };

    return (
      <div
        key={msg.id}
        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
        data-testid={`message-${msg.id}`}
      >
        <div className={`max-w-md rounded-md ${isMine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          {repliedMessage && (
            <div className={`px-3 pt-3 pb-1 border-l-2 ${isMine ? "border-primary-foreground/30" : "border-primary/30"}`}>
              <div className={`text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"} mb-1`}>
                <Reply className="w-3 h-3 inline mr-1" />
                Respondendo
              </div>
              <div className={`text-sm ${isMine ? "text-primary-foreground/80" : "text-muted-foreground/80"} line-clamp-2`}>
                {repliedMessage.content}
              </div>
            </div>
          )}
          <div className="p-3">
            {renderMediaContent()}
            {msg.content && (
              <p className="whitespace-pre-wrap mb-1">{msg.content}</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className={`text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {getTime(msg.createdAt)}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => handleReaction(msg.id, "👍")}
                >
                  <Smile className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => setReplyingTo(msg)}
                  data-testid={`button-reply-${msg.id}`}
                >
                  <Reply className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-semibold">Conversas</h2>
            {user?.role === "client" && (
              <Button
                size="icon"
                onClick={() => createConversationMutation.mutate()}
                disabled={createConversationMutation.isPending}
                data-testid="button-create-conversation"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" data-testid="tab-pending">Pendente</TabsTrigger>
              <TabsTrigger value="attending" data-testid="tab-attending">Atendendo</TabsTrigger>
              <TabsTrigger value="closed" data-testid="tab-closed">Fechado</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className={`cursor-pointer hover-elevate ${
                  selectedConversationId === conv.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedConversationId(conv.id)}
                data-testid={`conversation-${conv.id}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-semibold" data-testid={`protocol-${conv.id}`}>
                        {conv.protocolNumber}
                      </span>
                    </div>
                    {getStatusBadge(conv.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getDate(conv.createdAt)} {getTime(conv.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
            {conversations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma conversa</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversationId && selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Protocolo: {selectedConversation.protocolNumber}</span>
                    {getStatusBadge(selectedConversation.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Criado em {getDate(selectedConversation.createdAt)} às {getTime(selectedConversation.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isCallActive && user && getOtherUserId() && (
                  <WebRTCCall
                    conversationId={selectedConversationId!}
                    userId={user.id}
                    targetUserId={getOtherUserId()}
                    ws={wsRef.current}
                    onCallEnd={() => setIsCallActive(false)}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInfoSidebarOpen(!infoSidebarOpen)}
                  data-testid="button-toggle-info"
                >
                  <ChevronRight className={`w-5 h-5 transition-transform ${infoSidebarOpen ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              {replyingTo && (
                <div className="mb-2 p-2 bg-muted rounded-md flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">
                      <Reply className="w-3 h-3 inline mr-1" />
                      Respondendo
                    </div>
                    <p className="text-sm line-clamp-2">{replyingTo.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-message"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCorrectText}
                    disabled={!messageContent.trim() || isCorrecting}
                    title="Corrigir texto com IA"
                    data-testid="button-correct-text"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                  {user?.role === "attendant" && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAiAssistantOpen(true)}
                      title="Assistente de mensagens"
                      data-testid="button-assistant"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMediaDialog('photo')}
                    title="Tirar foto"
                    data-testid="button-photo"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFileDialog('image')}
                    title="Enviar imagem"
                    data-testid="button-image"
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMediaDialog('audio')}
                    title="Gravar áudio"
                    data-testid="button-audio"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMediaDialog('video')}
                    title="Gravar vídeo"
                    data-testid="button-video"
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFileDialog('file')}
                    title="Enviar arquivo"
                    data-testid="button-file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>

      {infoSidebarOpen && selectedConversation && (
        <div className="w-80 border-l flex flex-col p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Informações da Conversa</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Protocolo</p>
                <p className="font-mono font-semibold" data-testid="info-protocol">
                  {selectedConversation.protocolNumber}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                {getStatusBadge(selectedConversation.status)}
              </div>

              {user?.role === "attendant" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Ações</p>
                    {!selectedConversation.attendantId && selectedConversation.status === "pending" && (
                      <Button
                        className="w-full"
                        onClick={handleAssignToMe}
                        data-testid="button-assign-to-me"
                      >
                        Assumir Atendimento
                      </Button>
                    )}
                    {selectedConversation.attendantId === user.id && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Alterar status:</p>
                        <Select
                          value={selectedConversation.status}
                          onValueChange={handleChangeStatus}
                        >
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="attending">Atendendo</SelectItem>
                            <SelectItem value="closed">Fechado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Criado em</p>
                <p className="text-sm">
                  {getDate(selectedConversation.createdAt)} às {getTime(selectedConversation.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Última atualização</p>
                <p className="text-sm">
                  {getDate(selectedConversation.updatedAt)} às {getTime(selectedConversation.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {mediaDialog && (
        <MediaCapture
          type={mediaDialog}
          open={!!mediaDialog}
          onClose={() => setMediaDialog(null)}
          onCapture={handleMediaCapture}
        />
      )}

      {fileDialog && (
        <FileUpload
          type={fileDialog}
          open={!!fileDialog}
          onClose={() => setFileDialog(null)}
          onUpload={handleFileUpload}
        />
      )}

      <Dialog open={aiAssistantOpen} onOpenChange={setAiAssistantOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assistente de Mensagens</DialogTitle>
            <DialogDescription>
              Selecione um template para inserir na mensagem
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum template criado. Crie templates na página de Assistente de Mensagens.
                </p>
              ) : (
                templates.map((template) => (
                  <Card
                    key={template.id}
                    className="p-3 cursor-pointer hover-elevate"
                    onClick={() => handleSelectTemplate(template)}
                    data-testid={`template-option-${template.id}`}
                  >
                    <h4 className="font-semibold mb-1">{template.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.content}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

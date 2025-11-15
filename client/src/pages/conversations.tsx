import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Send, MessageSquare, User, ChevronRight, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import type { Conversation, Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function Conversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [messageContent, setMessageContent] = useState("");
  const [infoSidebarOpen, setInfoSidebarOpen] = useState(true);

  const { data: conversations = [], refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", selectedStatus],
    queryFn: async () => {
      const response = await fetch(`/api/conversations?status=${selectedStatus}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
    refetchInterval: 3000,
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
    refetchInterval: 2000,
  });

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
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/conversations/${selectedConversationId}/messages`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageContent("");
      refetchMessages();
      refetchConversations();
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
    sendMessageMutation.mutate(messageContent);
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
    const variants: Record<string, { icon: any; label: string; color: string }> = {
      pending: { icon: Clock, label: "Pendente", color: "bg-yellow-500" },
      attending: { icon: CheckCircle, label: "Atendendo", color: "bg-blue-500" },
      closed: { icon: XCircle, label: "Fechado", color: "bg-gray-500" },
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
                <p>Nenhuma conversa {selectedStatus === "pending" ? "pendente" : selectedStatus === "attending" ? "em atendimento" : "fechada"}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversationId && selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInfoSidebarOpen(!infoSidebarOpen)}
                data-testid="button-toggle-info"
              >
                <ChevronRight className={`w-5 h-5 transition-transform ${infoSidebarOpen ? "rotate-180" : ""}`} />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${msg.id}`}
                  >
                    <div
                      className={`max-w-md rounded-md p-3 ${
                        msg.senderId === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {getTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
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
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
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
    </div>
  );
}

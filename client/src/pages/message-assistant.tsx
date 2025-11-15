import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Plus, Trash2, Edit, Sparkles, Search } from "lucide-react";
import type { MessageTemplate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AVAILABLE_VARIABLES = [
  { key: "{{clientName}}", description: "Nome do cliente" },
  { key: "{{attendantName}}", description: "Nome do atendente" },
  { key: "{{protocol}}", description: "Número do protocolo" },
  { key: "{{conversationDate}}", description: "Data da conversa" },
];

export default function MessageAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      return apiRequest("POST", "/api/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsCreating(false);
      setTemplateTitle("");
      setTemplateContent("");
      toast({
        title: "Template criado!",
        description: "Seu template foi salvo com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o template",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string }) => {
      return apiRequest("PATCH", `/api/templates/${data.id}`, {
        title: data.title,
        content: data.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setEditingTemplate(null);
      setTemplateTitle("");
      setTemplateContent("");
      toast({
        title: "Template atualizado!",
        description: "Suas alterações foram salvas.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o template",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/templates/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template excluído!",
        description: "O template foi removido.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o template",
        variant: "destructive",
      });
    },
  });

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/ai/generate-template", {
        description: aiPrompt,
      });
      const data = await response.json();
      setTemplateContent(data.template);
      toast({
        title: "Template gerado!",
        description: "A IA criou um template para você. Revise e ajuste se necessário.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o template com IA",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!templateTitle.trim() || !templateContent.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e conteúdo",
        variant: "destructive",
      });
      return;
    }

    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        title: templateTitle,
        content: templateContent,
      });
    } else {
      createMutation.mutate({
        title: templateTitle,
        content: templateContent,
      });
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateTitle(template.title);
    setTemplateContent(template.content);
  };

  const insertVariable = (variable: string) => {
    setTemplateContent((prev) => prev + variable);
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Assistente de Mensagens</h1>
            <p className="text-sm text-muted-foreground">
              Crie e gerencie templates de mensagens com variáveis dinâmicas
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} data-testid="button-create-template">
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid gap-4">
            {templates.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhum template criado ainda. Clique em "Novo Template" para começar.
                </CardContent>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id} data-testid={`card-template-${template.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(template)}
                        data-testid={`button-edit-${template.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(template.id)}
                        data-testid={`button-delete-${template.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{template.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="w-80 border-l p-6">
        <h2 className="text-lg font-semibold mb-4">Variáveis Disponíveis</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Clique para inserir no template
        </p>
        <div className="space-y-2">
          {AVAILABLE_VARIABLES.map((variable) => (
            <Card
              key={variable.key}
              className="p-3 cursor-pointer hover-elevate"
              onClick={() => insertVariable(variable.key)}
              data-testid={`variable-${variable.key}`}
            >
              <Badge variant="secondary" className="mb-1">
                {variable.key}
              </Badge>
              <p className="text-xs text-muted-foreground">{variable.description}</p>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isCreating || !!editingTemplate} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingTemplate(null);
          setTemplateTitle("");
          setTemplateContent("");
          setAiPrompt("");
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <DialogDescription>
              Use a IA para gerar um template ou crie manualmente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Descreva o template que deseja (ex: mensagem de boas-vindas)"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                data-testid="input-ai-prompt"
              />
              <Button
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
                data-testid="button-generate-ai"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar com IA
              </Button>
            </div>

            <Separator />

            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder="Ex: Saudação Inicial"
                data-testid="input-template-title"
              />
            </div>

            <div>
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                placeholder="Digite seu template aqui. Use as variáveis como {{clientName}}"
                className="min-h-[200px]"
                data-testid="textarea-template-content"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Dica: Use as variáveis da barra lateral para personalizar sua mensagem
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingTemplate(null);
                setTemplateTitle("");
                setTemplateContent("");
                setAiPrompt("");
              }}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-template"
            >
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

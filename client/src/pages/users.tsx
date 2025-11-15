import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getTime, getDate } from "@shared/utils";
import { DataView, DataViewColumn } from "@/components/data-view";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserWithoutPassword = Omit<User, 'password'>;

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserWithoutPassword | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithoutPassword | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "client" as "client" | "attendant",
    profilePicture: null as File | null,
  });

  const { data: users = [], refetch } = useQuery<UserWithoutPassword[]>({
    queryKey: roleFilter !== "all" ? ["/api/users", roleFilter] : ["/api/users"],
  });

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: user.id }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "user_updated" || data.type === "user_deleted" || data.type === "user_created") {
        refetch();
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [user, refetch]);

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; role: string }) => {
      return await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCreateDialogOpen(false);
      setFormData({ username: "", password: "", role: "client", profilePicture: null });
      toast({
        title: "Usuário criado!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "Usuário atualizado!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`, {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeletingUser(null);
      toast({
        title: "Usuário deletado!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.username || !formData.password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate({
      username: formData.username,
      password: formData.password,
      role: formData.role,
    });
  };

  const handleEdit = (user: UserWithoutPassword) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
      profilePicture: null,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingUser) return;

    const data = new FormData();
    if (formData.username !== editingUser.username) {
      data.append("username", formData.username);
    }
    if (formData.password) {
      data.append("password", formData.password);
    }
    if (formData.role !== editingUser.role) {
      data.append("role", formData.role);
    }
    if (formData.profilePicture) {
      data.append("profilePicture", formData.profilePicture);
    }

    updateUserMutation.mutate({ id: editingUser.id, data });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData({ ...formData, profilePicture: file });
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: DataViewColumn<UserWithoutPassword>[] = [
    {
      key: "profilePicture",
      label: "Foto",
      render: (user) => (
        <Avatar>
          <AvatarImage src={user.profilePicture || undefined} alt={user.username} />
          <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      ),
    },
    { key: "username", label: "Nome" },
    {
      key: "role",
      label: "Tipo",
      render: (user) => (
        <Badge variant="outline">
          {user.role === "client" ? "Cliente" : "Atendente"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Criado em",
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {getDate(user.createdAt)} {getTime(user.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      render: (user) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(user)}
            data-testid={`button-edit-${user.id}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingUser(user)}
            data-testid={`button-delete-${user.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const renderCard = (user: UserWithoutPassword) => (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.profilePicture || undefined} alt={user.username} />
              <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{user.username}</h3>
              <Badge variant="outline" className="mt-1">
                {user.role === "client" ? "Cliente" : "Atendente"}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(user)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDeletingUser(user)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Criado em {getDate(user.createdAt)} às {getTime(user.createdAt)}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full">
      <DataView
        data={filteredUsers}
        columns={columns}
        renderCard={renderCard}
        keyExtractor={(user) => user.id}
        searchPlaceholder="Buscar usuários..."
        onSearch={setSearchQuery}
        filters={
          <>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40" data-testid="select-role-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
                <SelectItem value="attendant">Atendentes</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <Button onClick={() => {
            setFormData({ username: "", password: "", role: "client", profilePicture: null });
            setCreateDialogOpen(true);
          }} data-testid="button-create-user">
            <Plus className="w-4 h-4 mr-2" />
            Novo usuário
          </Button>
        }
      />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Usuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="create-username">Nome de usuário</Label>
              <Input
                id="create-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                data-testid="input-create-username"
              />
            </div>

            <div>
              <Label htmlFor="create-password">Senha</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                data-testid="input-create-password"
              />
            </div>

            <div>
              <Label htmlFor="create-role">Tipo</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "client" | "attendant") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="select-create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="attendant">Atendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createUserMutation.isPending} data-testid="button-save-new-user">
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                data-testid="input-edit-username"
              />
            </div>

            <div>
              <Label htmlFor="password">Nova senha (opcional)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Deixe em branco para manter a senha atual"
                data-testid="input-edit-password"
              />
            </div>

            <div>
              <Label htmlFor="role">Tipo</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "client" | "attendant") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="select-edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="attendant">Atendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Foto de perfil</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                data-testid="button-upload-profile-picture"
              >
                <Upload className="w-4 h-4 mr-2" />
                {formData.profilePicture ? formData.profilePicture.name : "Selecionar foto"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateUserMutation.isPending} data-testid="button-save-user">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário {deletingUser?.username}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && deleteUserMutation.mutate(deletingUser.id)}
              data-testid="button-confirm-delete"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

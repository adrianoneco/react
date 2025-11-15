import { useQuery } from "@tanstack/react-query";
import { InfoAlert } from "@/components/info-alert";
import { getDate, getTime } from "@shared/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: user, isLoading } = useQuery<{ username: string }>({
    queryKey: ["/api/auth/me"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const currentDate = new Date();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Conversas</h2>
        <p className="text-muted-foreground">
          Bem-vindo ao ChatApp, {user?.username}!
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {getDate(currentDate)} às {getTime(currentDate)}
        </p>
      </div>

      <InfoAlert
        title="Sistema em Desenvolvimento"
        message="O sistema de chat em tempo real está sendo desenvolvido. Em breve você poderá enviar e receber mensagens instantaneamente!"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Funcionalidades</CardTitle>
            <CardDescription>Em breve disponível</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Mensagens em tempo real
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Salas de chat
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Notificações
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Compartilhamento de arquivos
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

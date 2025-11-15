import { MessageSquare, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppHeaderProps {
  username?: string;
  onLogout: () => void;
}

export function AppHeader({ username, onLogout }: AppHeaderProps) {
  const userInitials = username
    ? username.substring(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-blue-600 to-purple-600 shadow-md">
      <div className="flex h-16 items-center px-4 gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-white" />
          <h1 className="text-xl font-bold text-white hidden sm:block">
            ChatApp
          </h1>
        </div>

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-white hover:bg-white/20"
              data-testid="button-user-menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-white text-blue-600 font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline font-medium">{username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Conversations from "@/pages/conversations";
import Contacts from "@/pages/contacts";
import Users from "@/pages/users";
import Settings from "@/pages/settings";
import MessageAssistant from "@/pages/message-assistant";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <AppHeader
        username={user?.username}
        onLogout={handleLogout}
      />
      <SidebarLayoutWrapper>{children}</SidebarLayoutWrapper>
    </div>
  );
}

function SidebarLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-1 overflow-hidden">
      <AppSidebar onToggle={toggleSidebar} />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}

function AuthenticatedLayoutWrapper({ children }: { children: React.ReactNode }) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        <ProtectedRoute>
          <AuthenticatedLayoutWrapper>
            <Conversations />
          </AuthenticatedLayoutWrapper>
        </ProtectedRoute>
      </Route>
      <Route path="/contacts">
        <ProtectedRoute>
          <AuthenticatedLayoutWrapper>
            <Contacts />
          </AuthenticatedLayoutWrapper>
        </ProtectedRoute>
      </Route>
      <Route path="/users">
        <ProtectedRoute>
          <AuthenticatedLayoutWrapper>
            <Users />
          </AuthenticatedLayoutWrapper>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <AuthenticatedLayoutWrapper>
            <Settings />
          </AuthenticatedLayoutWrapper>
        </ProtectedRoute>
      </Route>
      <Route path="/message-assistant">
        <ProtectedRoute>
          <AuthenticatedLayoutWrapper>
            <MessageAssistant />
          </AuthenticatedLayoutWrapper>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

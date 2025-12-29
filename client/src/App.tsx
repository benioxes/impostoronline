import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import GameLobby from "@/pages/GameLobby";
import JoinWithLink from "@/pages/JoinWithLink";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/join/:code" component={JoinWithLink} />
      <Route path="/game/:code" component={GameLobby} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

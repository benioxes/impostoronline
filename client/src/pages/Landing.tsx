import { useState } from "react";
import { useCreateLobby, useJoinLobby } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ghost, Users, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const [playerName, setPlayerName] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const createLobby = useCreateLobby();
  const joinLobby = useJoinLobby();

  const handleCreate = () => {
    if (!playerName.trim()) return;
    createLobby.mutate({ playerName });
  };

  const handleJoin = () => {
    if (!playerName.trim() || lobbyCode.length !== 4) return;
    joinLobby.mutate({ code: lobbyCode.toUpperCase(), playerName });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1600&h=900&fit=crop')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <Ghost className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-display font-bold mb-2 tracking-tight">
            IMPOSTOR<span className="text-primary">.ONLINE</span>
          </h1>
          <p className="text-muted-foreground text-lg">Oszukaj przyjaciół. Odkryj prawdę.</p>
        </div>

        <Card className="glass-card border-0 shadow-2xl">
          <CardContent className="p-6">
            <Tabs defaultValue="join" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/20">
                <TabsTrigger value="join">Dołącz do gry</TabsTrigger>
                <TabsTrigger value="create">Utwórz lobby</TabsTrigger>
              </TabsList>

              <TabsContent value="join" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Twoja nazwa</label>
                  <Input 
                    placeholder="Wpisz swój pseudonim..." 
                    className="h-12 bg-background/50 border-white/10"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Kod lobby</label>
                  <Input 
                    placeholder="ABCD" 
                    maxLength={4}
                    className="h-12 bg-background/50 border-white/10 font-mono text-center tracking-[0.5em] uppercase text-lg"
                    value={lobbyCode}
                    onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                  />
                </div>
                <Button 
                  className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
                  onClick={handleJoin}
                  disabled={joinLobby.isPending || !playerName || lobbyCode.length !== 4}
                >
                  {joinLobby.isPending ? <Loader2 className="animate-spin" /> : "Dołącz do gry"}
                </Button>
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Twoja nazwa</label>
                  <Input 
                    placeholder="Wpisz swój pseudonim..." 
                    className="h-12 bg-background/50 border-white/10"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-white/5 text-sm text-muted-foreground">
                  <p>Będziesz gospodarzem. Możesz skonfigurować ustawienia gry na następnym ekranie.</p>
                </div>
                <Button 
                  className="w-full h-12 text-lg font-bold bg-secondary hover:bg-secondary/80 text-white mt-2 border border-white/10"
                  onClick={handleCreate}
                  disabled={createLobby.isPending || !playerName}
                >
                  {createLobby.isPending ? <Loader2 className="animate-spin" /> : "Utwórz nowe lobby"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

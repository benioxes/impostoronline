import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useJoinLobby } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Ghost, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function JoinWithLink() {
  const [match, params] = useRoute("/join/:code");
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const code = params?.code?.toUpperCase() || "";
  const joinLobby = useJoinLobby();

  useEffect(() => {
    if (!match) {
      setLocation("/");
    }
  }, [match, setLocation]);

  const handleJoin = () => {
    if (!playerName.trim() || !code) return;
    joinLobby.mutate({ code, playerName });
  };

  if (!match) return null;

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
          <p className="text-muted-foreground text-lg">Zostałeś zaproszony do gry!</p>
        </div>

        <Card className="glass-card border-0 shadow-2xl">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Lobby Code Display */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Kod lobby</label>
                <div className="h-12 bg-background/50 border border-white/10 rounded-md flex items-center justify-center font-mono text-center tracking-[0.5em] text-xl font-bold text-primary">
                  {code}
                </div>
              </div>

              {/* Player Name Input */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Twoja nazwa</label>
                <Input 
                  placeholder="Wpisz swój pseudonim..." 
                  className="h-12 bg-background/50 border-white/10"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  autoFocus
                />
              </div>

              {/* Join Button */}
              <Button 
                className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleJoin}
                disabled={joinLobby.isPending || !playerName.trim()}
              >
                {joinLobby.isPending ? <Loader2 className="animate-spin mr-2" /> : "Dołącz do gry"}
              </Button>

              {/* Back Button */}
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Wróć do menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

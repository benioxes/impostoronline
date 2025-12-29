import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGameState, useUpdateSettings, useStartGame, useVote, useGuessWord } from "@/hooks/use-game";
import { PlayerList } from "@/components/PlayerList";
import { GameSettings } from "@/components/GameSettings";
import { RoleCard } from "@/components/RoleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Copy, Play, SkipForward, AlertTriangle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';

export default function GameLobby() {
  const [match, params] = useRoute("/game/:code");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  if (!match || !params?.code) {
    setLocation("/");
    return null;
  }

  const code = params.code;
  const { data: gameState, isLoading, error } = useGameState(code);
  
  // Hooks
  const updateSettings = useUpdateSettings();
  const startGame = useStartGame();
  const castVote = useVote();
  const guessWord = useGuessWord();

  // Local state
  const [guessInput, setGuessInput] = useState("");
  const [isGuessDialogOpen, setIsGuessDialogOpen] = useState(false);

  // Effects
  useEffect(() => {
    if (gameState?.lobby.status === "finished") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [gameState?.lobby.status]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Game Not Found</h2>
        <p className="text-muted-foreground mb-6">This lobby might have closed or doesn't exist.</p>
        <Button onClick={() => setLocation("/")}>Back to Home</Button>
      </div>
    );
  }

  const { lobby, players, me } = gameState;
  const isHost = me?.isHost ?? false;
  const isImpostor = me?.role === "impostor";

  // -- HANDLERS --
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code Copied!", description: "Send it to your friends." });
  };

  const handleSkipVote = () => {
    castVote.mutate({ lobbyId: lobby.id, targetId: null });
  };

  const handleVote = (targetId: number | null) => {
    castVote.mutate({ lobbyId: lobby.id, targetId });
  };

  const handleGuess = () => {
    guessWord.mutate({ lobbyId: lobby.id, word: guessInput });
    setIsGuessDialogOpen(false);
    setGuessInput("");
  };

  // -- RENDER STATES --

  // 1. WAITING ROOM
  if (lobby.status === "waiting") {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl font-display font-bold">Lobby</h1>
              <p className="text-muted-foreground">Waiting for players...</p>
            </div>
            <div className="flex items-center gap-2 bg-secondary/50 px-6 py-3 rounded-xl border border-white/10">
              <span className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Code:</span>
              <span className="font-mono text-2xl font-bold tracking-widest text-primary">{code}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 ml-2" onClick={copyCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Player List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Players <span className="text-muted-foreground text-sm font-normal">({players.length})</span>
                </h2>
              </div>
              <PlayerList players={players} hostId={players.find(p => p.isHost)?.id} />
              
              {isHost && (
                <div className="pt-4">
                  <Button 
                    size="lg" 
                    className="w-full text-lg font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20"
                    onClick={() => startGame.mutate(lobby.id)}
                    disabled={players.length < 3}
                  >
                    {startGame.isPending ? <Loader2 className="animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
                    Start Game
                  </Button>
                  {players.length < 3 && (
                    <p className="text-center text-xs text-muted-foreground mt-2">Need at least 3 players to start.</p>
                  )}
                </div>
              )}
              {!isHost && (
                <div className="text-center p-8 bg-white/5 rounded-xl border border-white/5 animate-pulse">
                  <p className="text-muted-foreground">Waiting for host to start...</p>
                </div>
              )}
            </div>

            {/* Right: Settings */}
            <div>
              <GameSettings 
                initialSettings={lobby.settings} 
                isHost={isHost}
                onUpdate={(s) => updateSettings.mutate({ lobbyId: lobby.id, ...s })}
                isLoading={updateSettings.isPending}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. PLAYING / GAME OVER (Results)
  return (
    <div className="min-h-screen bg-background p-4 pb-24 relative overflow-x-hidden">
      {/* Dynamic Background based on role/state */}
      <div className={`fixed inset-0 pointer-events-none transition-colors duration-1000 opacity-20 ${isImpostor ? 'bg-destructive/10' : 'bg-primary/10'}`} />
      
      <div className="max-w-md mx-auto relative z-10 space-y-8 pt-6">
        
        {/* Top Status Bar */}
        <div className="flex justify-between items-center bg-secondary/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg sticky top-4 z-50">
          <div>
            <div className="text-xs uppercase font-bold text-muted-foreground">Status</div>
            <div className="font-display font-bold text-lg flex items-center gap-2">
              {lobby.status === 'playing' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              {lobby.status === 'voting' && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
              {lobby.status === 'finished' && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
              {lobby.status.toUpperCase()}
            </div>
          </div>
          {lobby.status === 'playing' && isImpostor && (
             <Dialog open={isGuessDialogOpen} onOpenChange={setIsGuessDialogOpen}>
               <DialogTrigger asChild>
                 <Button variant="destructive" size="sm" className="font-bold">
                   Guess Word
                 </Button>
               </DialogTrigger>
               <DialogContent className="border-destructive/50 bg-background/95 backdrop-blur-xl">
                 <DialogHeader>
                   <DialogTitle className="text-destructive">Risk it all?</DialogTitle>
                   <DialogDescription>
                     If you guess the secret word correctly, you win instantly. If you fail, you might lose.
                   </DialogDescription>
                 </DialogHeader>
                 <div className="space-y-4 py-4">
                   <Input 
                     placeholder="Enter secret word..." 
                     value={guessInput}
                     onChange={(e) => setGuessInput(e.target.value)}
                     className="bg-secondary border-destructive/20 text-lg"
                   />
                   <Button onClick={handleGuess} className="w-full bg-destructive text-white hover:bg-destructive/90">
                     Submit Guess
                   </Button>
                 </div>
               </DialogContent>
             </Dialog>
          )}
        </div>

        {/* MAIN GAME AREA */}
        
        {/* GAME OVER SCREEN */}
        {lobby.status === 'finished' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-24 h-24 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-4xl font-display font-black mb-2">GAME OVER</h2>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 inline-block">
                <span className="block text-xs uppercase text-muted-foreground mb-1">Secret Word Was</span>
                <span className="text-2xl font-bold text-primary">{lobby.settings.word}</span>
              </div>
            </div>
            
            {isHost && (
              <Button size="lg" className="w-full" onClick={() => setLocation("/")}>
                Back to Home
              </Button>
            )}
          </motion.div>
        )}

        {/* ROLE REVEAL & INFO */}
        {lobby.status !== 'finished' && (
          <RoleCard 
            role={me?.role as any} 
            word={lobby.settings.word}
            hint={lobby.settings.hint}
            category={lobby.settings.category}
          />
        )}

        {/* VOTING INTERFACE */}
        {(lobby.status === 'voting' || lobby.status === 'playing') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Players</h3>
              {lobby.status === 'playing' && !me?.hasVoted && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleVote(null)} // Trigger vote phase logic usually on backend, simplified here
                >
                  Call Vote
                </Button>
              )}
            </div>

            <PlayerList 
              players={players} 
              hostId={lobby.hostId ? parseInt(lobby.hostId) : undefined}
              showVotes={lobby.status === 'voting'}
              onVote={lobby.status === 'voting' && !me?.hasVoted ? handleVote : undefined}
              currentVoteTarget={me?.votedFor}
            />

            {lobby.status === 'voting' && !me?.hasVoted && (
              <Button 
                variant="outline" 
                className="w-full border-dashed border-muted-foreground/50 hover:bg-white/5"
                onClick={handleSkipVote}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip Vote
              </Button>
            )}
            
            {lobby.status === 'voting' && me?.hasVoted && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                <p className="text-green-500 font-bold">Vote Submitted</p>
                <p className="text-xs text-muted-foreground">Waiting for others...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

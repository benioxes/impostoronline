import { Player } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, CheckCircle2, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerListProps {
  players: Player[];
  hostId?: number;
  showVotes?: boolean; // If true, show who has voted
  onVote?: (targetId: number | null) => void; // If provided, list is interactive for voting
  currentVoteTarget?: number | null;
}

export function PlayerList({ players, hostId, showVotes, onVote, currentVoteTarget }: PlayerListProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {players.map((player) => {
        const isHost = player.id === hostId || player.isHost; // Fallback to isHost flag
        const isSelected = currentVoteTarget === player.id;
        const canVote = !!onVote;

        return (
          <div
            key={player.id}
            onClick={() => canVote && onVote(player.id)}
            className={cn(
              "relative group overflow-hidden rounded-xl border p-4 transition-all duration-200",
              "bg-secondary/50 backdrop-blur-sm",
              canVote ? "cursor-pointer hover:border-primary/50 hover:bg-secondary/80" : "",
              isSelected ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-white/5",
              player.hasVoted && !canVote && "border-green-500/30 bg-green-900/10" // Visual feedback that they voted
            )}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-white/10 shadow-inner">
                  <AvatarFallback className="bg-background text-lg font-bold font-display">
                    {player.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {isHost && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1 shadow-lg">
                    <Crown className="w-3 h-3 text-black fill-current" />
                  </div>
                )}

                {showVotes && player.hasVoted && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 shadow-lg animate-in zoom-in">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="font-bold text-foreground truncate max-w-[120px]">{player.name}</div>
                <div className="text-xs text-muted-foreground">
                  {player.id === hostId ? "Host" : "Player"}
                </div>
              </div>

              {canVote && (
                <div className={cn(
                  "absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 transition-opacity",
                  "group-hover:opacity-100",
                  isSelected && "opacity-100"
                )}>
                  <span className="font-display font-bold text-primary bg-background/80 px-3 py-1 rounded-full backdrop-blur-md">
                    VOTE
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

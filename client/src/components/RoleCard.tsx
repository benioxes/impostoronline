import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Skull, ShieldCheck } from "lucide-react";

interface RoleCardProps {
  role: "impostor" | "innocent" | null;
  word?: string;
  hint?: string;
  category?: string;
}

export function RoleCard({ role, word, hint, category }: RoleCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!role) return null;

  const isImpostor = role === "impostor";

  return (
    <div className="w-full max-w-md mx-auto perspective-1000">
      <div 
        className={cn(
          "relative w-full aspect-[3/4] transition-all duration-500 transform-style-3d cursor-pointer",
          isRevealed ? "rotate-y-180" : ""
        )}
        onClick={() => setIsRevealed(!isRevealed)}
      >
        {/* FRONT OF CARD (Hidden State) */}
        <div className="absolute inset-0 backface-hidden">
          <div className="w-full h-full bg-gradient-to-br from-secondary to-background border-2 border-primary/20 rounded-2xl flex flex-col items-center justify-center p-8 shadow-2xl neon-border">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
              <Eye className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold text-center mb-2">Tap to Reveal Role</h3>
            <p className="text-muted-foreground text-center text-sm">Keep your screen hidden from others!</p>
          </div>
        </div>

        {/* BACK OF CARD (Revealed State) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className={cn(
            "w-full h-full rounded-2xl flex flex-col items-center justify-center p-8 shadow-2xl border-4",
            isImpostor 
              ? "bg-gradient-to-br from-destructive/20 to-background border-destructive impostor-border" 
              : "bg-gradient-to-br from-primary/20 to-background border-primary neon-border"
          )}>
            <div className="absolute top-4 right-4" onClick={(e) => { e.stopPropagation(); setIsRevealed(false); }}>
              <EyeOff className="w-6 h-6 text-muted-foreground hover:text-foreground" />
            </div>

            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mb-6",
              isImpostor ? "bg-destructive/20" : "bg-primary/20"
            )}>
              {isImpostor ? (
                <Skull className="w-12 h-12 text-destructive animate-pulse" />
              ) : (
                <ShieldCheck className="w-12 h-12 text-primary animate-pulse" />
              )}
            </div>

            <h2 className={cn(
              "text-3xl font-display font-black text-center mb-1 uppercase tracking-wider",
              isImpostor ? "text-destructive drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]" : "text-primary drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]"
            )}>
              {isImpostor ? "IMPOSTOR" : "INNOCENT"}
            </h2>

            <div className="w-full h-px bg-white/10 my-6" />

            <div className="space-y-4 text-center w-full">
              <div>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Category</span>
                <p className="text-lg font-bold">{category}</p>
              </div>

              {isImpostor ? (
                <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                  <span className="text-xs uppercase tracking-widest text-destructive">Your Hint</span>
                  <p className="text-xl font-bold text-foreground mt-1">{hint}</p>
                  <p className="text-xs text-destructive/80 mt-2">Blend in. Figure out the secret word.</p>
                </div>
              ) : (
                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                  <span className="text-xs uppercase tracking-widest text-primary">Secret Word</span>
                  <p className="text-2xl font-black text-foreground mt-1">{word}</p>
                  <p className="text-xs text-primary/80 mt-2">Find the impostor who doesn't know this.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

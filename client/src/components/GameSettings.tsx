import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, RefreshCw } from "lucide-react";

interface GameSettingsProps {
  initialSettings: {
    numImpostors: number;
    category: string;
    word: string;
    hint: string;
  };
  isHost: boolean;
  onUpdate: (settings: any) => void;
  isLoading?: boolean;
}

export function GameSettings({ initialSettings, isHost, onUpdate, isLoading }: GameSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings.category, initialSettings.word, initialSettings.hint, initialSettings.numImpostors]);

  const handleChange = (key: string, value: any) => {
    if (!isHost) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(settings);
    setHasChanges(false);
  };

  if (!isHost) {
    return (
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-primary" />
            Lobby Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Impostors</span>
              <span className="font-mono text-xl">{settings.numImpostors}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Category</span>
              <span className="font-mono text-xl">{settings.category || "Not set"}</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-center text-muted-foreground">Only the host can change settings.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5 text-primary" />
          Game Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Number of Impostors</Label>
            <span className="font-mono font-bold text-primary">{settings.numImpostors}</span>
          </div>
          <Slider
            value={[settings.numImpostors]}
            min={1}
            max={3}
            step={1}
            onValueChange={(val) => handleChange("numImpostors", val[0])}
            className="py-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={settings.category}
            onChange={(e) => handleChange("category", e.target.value)}
            placeholder="e.g. Animals, Countries..."
            className="bg-background/50 border-white/10 focus:border-primary/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="word" className="text-primary">Secret Word</Label>
            <Input
              id="word"
              value={settings.word}
              onChange={(e) => handleChange("word", e.target.value)}
              placeholder="The word innocents see"
              className="bg-background/50 border-primary/20 focus:border-primary/50 font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hint" className="text-destructive">Impostor Hint</Label>
            <Input
              id="hint"
              value={settings.hint}
              onChange={(e) => handleChange("hint", e.target.value)}
              placeholder="Clue for the impostor"
              className="bg-background/50 border-destructive/20 focus:border-destructive/50"
            />
          </div>
        </div>

        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Apply Changes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

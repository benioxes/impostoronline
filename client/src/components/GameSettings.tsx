import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings, RefreshCw } from "lucide-react";

interface GameSettingsProps {
  initialSettings: {
    numImpostors: number;
    giveHint: boolean;
  };
  isHost: boolean;
  onUpdate: (settings: any) => void;
  isLoading?: boolean;
}

export function GameSettings({ initialSettings, isHost, onUpdate, isLoading }: GameSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings.numImpostors, initialSettings.giveHint]);

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
            Ustawienia gry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Impostorów</span>
              <span className="font-mono text-2xl font-bold text-primary">{settings.numImpostors}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Podpowiedź dla impostora</span>
              <span className="font-mono text-lg">{settings.giveHint ? 'Tak' : 'Nie'}</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-center text-muted-foreground">Słowa będą losowane po rozpoczęciu gry.</p>
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
          Konfiguracja gry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Liczba impostorów</Label>
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

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <Label htmlFor="hint-toggle" className="cursor-pointer">Dać podpowiedź impostorowi?</Label>
          <Switch
            id="hint-toggle"
            checked={settings.giveHint}
            onCheckedChange={(checked) => handleChange("giveHint", checked)}
          />
        </div>

        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-muted-foreground">Tajne słowa zostaną losowo przydzielone każdemu graczowi po rozpoczęciu gry.</p>
        </div>

        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Zastosuj zmiany
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

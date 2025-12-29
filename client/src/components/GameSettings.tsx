import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, RefreshCw, Dices } from "lucide-react";

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

const CATEGORIES = ['Zwierzęta', 'Jedzenie', 'Kraje', 'Sport', 'Filmy', 'Instrumenty'];

const WORDS_DB: Record<string, Array<{ word: string; hint: string }>> = {
  Zwierzęta: [
    { word: 'Pies', hint: 'Udomowiony, bestia człowieka' },
    { word: 'Kot', hint: 'Niezależne, furkające stworzenie' },
    { word: 'Słoń', hint: 'Ogromne stworzenie z trąbą' },
    { word: 'Pingwin', hint: 'Czarno-biały ptak z Antarktydy' },
    { word: 'Żyrafa', hint: 'Długa szyja, afrykańskie zwierzę' },
  ],
  Jedzenie: [
    { word: 'Pizza', hint: 'Włoskie danie z serkiem i sosem' },
    { word: 'Sushi', hint: 'Japońskie, ryż z rybą' },
    { word: 'Burger', hint: 'Kanapka z mięsem' },
    { word: 'Lody', hint: 'Chłodny deser' },
    { word: 'Pasta', hint: 'Włoskie makaron' },
  ],
  Kraje: [
    { word: 'Polska', hint: 'Kraj w Europie Środkowej' },
    { word: 'Japonia', hint: 'Wyspa w Azji' },
    { word: 'Brazylia', hint: 'Wielki kraj w Ameryce Południowej' },
    { word: 'Niemcy', hint: 'Kraj w środku Europy' },
    { word: 'Norwegia', hint: 'Kraj fjordów' },
  ],
  Sport: [
    { word: 'Piłka nożna', hint: 'Gra z piłką i bramkami' },
    { word: 'Tenis', hint: 'Rakietka i mała piłeczka' },
    { word: 'Pływanie', hint: 'Ruch w wodzie' },
    { word: 'Koszykówka', hint: 'Gra z kosem i piłką' },
    { word: 'Skoki narciarskie', hint: 'Skakanie ze skoków' },
  ],
  Filmy: [
    { word: 'Avatar', hint: 'Pandora, niebiescy ludzie' },
    { word: 'Titanic', hint: 'Statek, lodowiec' },
    { word: 'Incepcja', hint: 'Marzenia w marzeniach' },
    { word: 'Matrix', hint: 'Kapsułki, świat wirtualny' },
    { word: 'Gwiezdne Wojny', hint: 'Kosmos, miecze świetlne' },
  ],
  Instrumenty: [
    { word: 'Gitara', hint: 'Struny, muzyka rockowa' },
    { word: 'Fortepian', hint: 'Klawisze, muzyka poważna' },
    { word: 'Bęben', hint: 'Perkusja, głośny' },
    { word: 'Skrzypce', hint: 'Smyczek, muzyka klasyczna' },
    { word: 'Trąbka', hint: 'Metal, jazz' },
  ],
};

function getRandomWord(category: string) {
  const words = WORDS_DB[category] || WORDS_DB.Zwierzęta;
  return words[Math.floor(Math.random() * words.length)];
}

export function GameSettings({ initialSettings, isHost, onUpdate, isLoading }: GameSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [includeHint, setIncludeHint] = useState(!!initialSettings.hint);

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

  const handleRandomWord = () => {
    const randomWord = getRandomWord(settings.category || 'Zwierzęta');
    const newSettings = {
      ...settings,
      word: randomWord.word,
      hint: includeHint ? randomWord.hint : '',
    };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleRandomCategory = () => {
    const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const randomWord = getRandomWord(randomCategory);
    const newSettings = {
      ...settings,
      category: randomCategory,
      word: randomWord.word,
      hint: includeHint ? randomWord.hint : '',
    };
    setSettings(newSettings);
    setHasChanges(true);
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Impostorów</span>
              <span className="font-mono text-xl">{settings.numImpostors}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Kategoria</span>
              <span className="font-mono text-xl">{settings.category || "Nie ustawiono"}</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-center text-muted-foreground">Tylko gospodarz może zmienić ustawienia.</p>
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

        <div className="space-y-2">
          <Label htmlFor="category">Kategoria</Label>
          <Select value={settings.category} onValueChange={(val) => handleChange("category", val)}>
            <SelectTrigger className="bg-background/50 border-white/10">
              <SelectValue placeholder="Wybierz kategorię" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="word" className="text-primary">Tajne słowo</Label>
            <Input
              id="word"
              value={settings.word}
              onChange={(e) => handleChange("word", e.target.value)}
              placeholder="Słowo dla gracza"
              className="bg-background/50 border-primary/20 focus:border-primary/50 font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hint" className="text-destructive">Podpowiedź impostora</Label>
            <Input
              id="hint"
              value={settings.hint}
              onChange={(e) => handleChange("hint", e.target.value)}
              placeholder="Podpowiedź dla impostora"
              disabled={!includeHint}
              className="bg-background/50 border-destructive/20 focus:border-destructive/50 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <Label htmlFor="hint-toggle" className="cursor-pointer">Dać podpowiedź impostorowi?</Label>
          <Switch
            id="hint-toggle"
            checked={includeHint}
            onCheckedChange={(checked) => {
              setIncludeHint(checked);
              handleChange("hint", checked ? settings.hint : "");
            }}
          />
        </div>

        <Button
          onClick={handleRandomWord}
          variant="outline"
          className="w-full border-primary/20 hover:border-primary/50"
          disabled={!settings.category}
        >
          <Dices className="w-4 h-4 mr-2" />
          Losuj słowo
        </Button>

        <Button
          onClick={handleRandomCategory}
          variant="secondary"
          className="w-full"
        >
          <Dices className="w-4 h-4 mr-2" />
          Losuj wszystko
        </Button>

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

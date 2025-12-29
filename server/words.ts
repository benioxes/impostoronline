export const WORD_CATEGORIES = {
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
    { word: 'Lodów', hint: 'Chłodny deser' },
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

export function getRandomWord(category: string): { word: string; hint: string } {
  const words = WORD_CATEGORIES[category as keyof typeof WORD_CATEGORIES];
  if (!words || words.length === 0) {
    return { word: 'Sekret', hint: 'Niespodziewane' };
  }
  const randomWord = words[Math.floor(Math.random() * words.length)];
  return randomWord;
}

export function getRandomCategory(): string {
  const categories = Object.keys(WORD_CATEGORIES);
  return categories[Math.floor(Math.random() * categories.length)];
}

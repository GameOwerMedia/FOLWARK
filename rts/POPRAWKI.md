# English Default and Illustrated Menu

- English by default; Polish selectable in Options > Language and persisted per browser.
- Localized panels, tooltips, map labels, choices, notifications and existing chronicles. Saves and simulation identifiers remain unchanged.
- Widescreen and portrait title artwork with FOLWARK lettering; interactive menu controls stay separate from the image.
- 66 unit tests; bilingual browser verification added in scripts/language-browser.js.

# Menu, zywy region i nowy teren (15.09.2026)

- Menu startowe i pauza menu; trzy scenariusze, kontynuacja i powrot do rozgrywki.
- Trzy miejsca zapisu, quicksave, autosave, potwierdzenia, import i eksport JSON. Walidacja i migracja do v5.
- Zapamietywane opcje dzwieku, kamery, animacji i autozapisu; pelny ekran.
- Drobniejsza laka meadow-fine.png zamiast wielkich lisci. Ogrodzenie wykorzystuje teksture drewnianego plotu z dostarczonego atlasu; bramy sa przejezdne.
- Trzy autonomiczne gospodarki z zapasami, zuzyciem, produkcja, przestojami i kupcami. Pomoc ma rzeczywisty skutek gospodarczy.
- Trakt wychodzacy poza mape, cztery oferty miasta, przejazd i caly dzien pobytu poza mapa przed powrotem.
- Poprawione wymiary canvasa po menu oraz obsluga klawiatury suwakow bez przechwytywania przez RTS.
- 62 testy logiki i atlasu; testy przegladarki obejmuja menu, zapisy, opcje, gospodarke i transport.

# Poprawki grafiki i symulacji

## Przetrwanie i wladza: najnowsza wersja

- Ramka zaznaczenia znika takze po puszczeniu myszy poza plansza, utracie fokusu i anulowaniu trybu.
- Usuniety prostokat nakladki oswietlenia; pauza przeniesiona do naglowka, komunikaty do panelu bocznego.
- Rozdzial pomiedzy zasobami a czasem, a pod nimi staly priorytet przetrwania.
- Mniej drzew wewnatrz folwarku. Obwodowe ogrodzenie z dwiema przejezdnymi bramami i rzeczywistymi kolizjami.
- Trzy sasiednie gospodarstwa, polaczone drogami omijajacymi zabudowania. Szlakow nie mozna zabudowac.
- Handel i pomoc przez fizyczne karawany; zaplata przy wysylce, dostawa po powrocie. Pelny magazyn nie niszczy ladunku.
- Domyslny scenariusz: 10 dni. Mróz -12/-24 C, spalanie drewna, ocieplenie kwater, glod i zgony.
- Warunki zwyciestwa: co najmniej 8 zywych i 40% ciepla o swicie dnia 11. Stare tryby nadal dostepne w Opcjach.
- Propaganda, ujawnianie klamstw, cenzura, przymusowa zmiana i brutalne dzialanie strazy.
- Osobny oficjalny biuletyn i rzeczywista kronika. Zaufanie, strach i uczciwosc maja konsekwencje.
- Kontrakt oddania wskazanego pracownika ludziom: nieodwracalna strata, koszty moralne, zaplata wraca karawana.
- Potwierdzenia rozkazow przemocy, dylematy i moralna ocena zakonczenia.
- Zapis v4 wraz z migracja v1-v3. 52 testy automatyczne oraz test nowych paneli na komputerze i telefonie.
- Zakres: scenariusz RTS przetrwania inspirowany wskazanym kierunkiem, nie pelna replika Frostpunka.

## Grafika

- 80 kompletnych obiektow wyodrebnionych wedlug kanalu alfa, z marginesami i odstepami w atlasie.
- Oryginalne 18 obrazow pozostaje bez zmian. Nowy atlas: public/assets/sprites-prepared.png.
- Dachy, sylwetki i krawedzie pol nie sa juz wycinane przyblizonymi prostokatami.
- Zmieniona kolejnosc rysowania pol i ogrodow: pracownicy pozostaja widoczni podczas pracy.
- Usuniete dekoracje zawierajace nieruchome, wrysowane zwierzeta.
- Osobne tekstury trawy, ziemi, wody i lesnego podloza. Losowo obrocone, miekkie probki eliminuja widoczne szwy i lustrzane powtorzenia.
- Budowanie uwzglednia miejsce na cala wysokosc obiektu. Kamera nie pokazuje pustego obszaru poza mapa.

## Ruch i logika

- Staly krok symulacji 50 ms. Taki sam uplyw czasu, produkcja i ruch przy roznych FPS.
- EasyStar wyznacza sciezki wokol budynkow, stawu i dekoracji. Budowa przelicza aktywne trasy.
- Wygladzanie sciezek, stale proporcje jednostek, zachowany kierunek po zatrzymaniu.
- 12 klatek proceduralnego chodu na gatunek; 180 klatek lacznie. Dolne konczyny poruszaja sie wzgledem tulowia, zamiast podmieniania roznych ilustracji.
- Klikniecie pola przypisuje konkretne pole, a nie dowolne najblizsze.
- Mieszkancy przerywaja prace na jedzenie i odpoczynek, po czym wracaja do swojego zadania.
- Przerwane przewozy zachowuja rodzaj i ilosc surowca; nadwyzka nie znika przy pelnym magazynie.
- Wiatrak ma rzeczywisty cykl mielenia; piekarnia zuzywa make i drewno. Nie ma juz globalnego bonusu wiatraka do zbiorow.
- Patrol odwiedza kolejne punkty. Menu nie kasuje pauzy ustawionej przez gracza.
- Zapis v4 zachowuje rowniez drogi, prawo, badania i produkcje; zapisy v1/v2/v3 sa migrowane.

## Rozbudowa RTS

- Mapa 3600x2400: czterokrotnie wieksza powierzchnia, dodatkowy las, zloze kamienia, sad i wolne laki.
- Drogi ziemne i brukowane, koszt wytyczenia, rozbiorka, premie predkosci i trasowanie wedlug czasu podrozy.
- Przesuwanie dotykiem/dlonia, przeciaganie prawym i srodkowym przyciskiem, minimapa, WASD i krawedzie.
- 17 rodzajow budowli. Budowa wymaga obecnych pracownikow; rusztowania, odslaniana konstrukcja, pyl i ruch pracy.
- Kolejka, priorytety, anulowanie z czesciowym zwrotem, przydzial zalogi, wstrzymanie oraz ulepszenia produkcji/upraw.
- Maka, chleb, narzedzia, wiedza; cykle produkcyjne z rzeczywistym zuzyciem skladnikow i limitami magazynu.
- Cztery prawa gospodarcze, rynek surowcow, biblioteka i trzy technologie.
- Kolejkowanie ruchu z Shift, budowanie, rozladunek, patrol i pilnowanie miejsca.
- Tryb swobodny z porami roku i dawna kampania 7 dni pozostaja w Opcjach.
- Rozszerzone testy przegladarkowe i walidacja zapisow.

## Weryfikacja

52 testy automatyczne: ekonomia, pelny tydzien, potrzeby, rozkazy, kolizje, budowanie, zapis i atlas.
Testowane rozmiary: 1440x960, 1280x720, 390x844 i 360x740.
Test przegladarki sprawdza klikanie, ruch, budowe, polityke, wydarzenia, zapis i galerie.
Dodatkowa kontrola obejmuje 180 klatek, ich marginesy, stale wymiary i kierunek ruchu.
Animacja nadal korzysta z pojedynczych ilustracji. Pelny, anatomicznie poprawny chod w osmiu kierunkach wymaga osobnych arkuszy animacyjnych lub modeli 3D.

## Nowy material terenu

Plik: public/assets/terrain-materials.png.
Wygenerowany lokalnie przez narzedzie OpenAI imagegen na potrzeby tej poprawki, 15 wrzesnia 2026.
Opis promptu: kwadratowy atlas 2x2 materialow dla malarskiej, izometrycznej gry o jesiennym folwarku; trawa, drobnoziarnista ubita ziemia, naturalna woda stawu oraz lesne podloze z mchem i liscmi. Bez budynkow, zwierzat, napisow i interfejsu.
Oryginalny wynik generowania pozostal w katalogu generated_images; do gry trafila jego kopia.
## Higgsfield: aktualizacja oprawy

- Nowy aktywny atlas public/assets/terrain-higgsfield.png: trawa, ziemia, woda, lesna sciolka.
- Generacja referencyjna przez wtyczke Higgsfield, model katalogowy nano_banana_2, 2K, koszt wyceny 2 kredyty.
- Job: 5668990c-2daf-4080-aecb-f9dbba130ac6; model raportowany przez backend: nano_banana_flash.
- Referencje: ilustracja 02_13_01, interfejs 02_13_19, karty 02_13_42, przeslane przez uzytkownika w panelu Higgsfield.
- Prompt: atlas 2x2 top-down w malarskim stylu folwarku; lewy gorny trawa, prawy gorny ziemia, lewy dolny woda, prawy dolny podloze lesne. Bez postaci, budynkow, napisow, perspektywy i obramowan.
- Oryginalne 18 plikow oraz poprzedni material terenu zachowane.
- Poprawiony blad wspolrzednej Y podczas rysowania poczatkowych drog: obraz trasy odpowiada teraz jej geometrii nawigacyjnej.
- Delikatne cienie kontaktowe, animowane zmarszczki wody, ruch roslinnosci i sztandaru bez prostokatnej nakladki oswietlenia.
- Efekty sa zalezne od czasu symulacji, zatrzymuja sie w pauzie i nie zmieniaja ekonomii.
- Animacja AutoSprite nie zostala zamowiona: wycena zwrocila blad. Chod nadal korzysta z dotychczasowych 180 klatek proceduralnych.
- scripts/higgsfield-browser.js sprawdza aktywny atlas, ruch wody, pauze oraz brak prostokatnej nakladki.

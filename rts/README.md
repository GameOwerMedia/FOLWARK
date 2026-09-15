# FOLWARK: Przetrwanie i wladza

Grywalna strategiczna gra 2D, rozwijajaca kod z galezi `rts-rebuild` repozytorium GameOwerMedia/FOLWARK.
Phaser renderuje mape i jednostki; TypeScript obsluguje gospodarke, potrzeby i polityke, a EasyStar wyznacza drogi wokol budynkow i stawu.

## Language and title screen

English is the default language. In Options > Language choose Polski to switch the interface, tooltips, map labels, events and existing chronicles without resetting the game. The choice is stored per browser, separately from game saves. Original artwork in the archive is preserved as supplied.

The start menu uses two generated title illustrations: a widescreen scene and a portrait composition. Commands are real HTML controls, not painted buttons. Artwork: built-in OpenAI image generation; the tool does not expose a selectable or verifiable GPT Image 2.5 model. Prompts and provenance: MENU-ART.md.

## Najprostsze uruchomienie

Otworz dwuklikiem `portable/GRAJ-FOLWARK.html` (lub dostarczony osobno plik `GRAJ-FOLWARK.html`) w Chrome albo Edge.
Wszystkie 18 dostarczonych obrazow, przygotowany atlas obiektow, trzy materialy terenu (atlas 2K z Higgsfield, drobna laka OpenAI i poprzedni zapasowy), dwie ilustracje menu, czcionki i kod sa w tym pliku. Nie potrzeba serwera, instalacji ani internetu.
Plik jest duzy, poniewaz zawiera takze oryginalne grafiki w pelnej rozdzielczosci.
Szczegoly poprawionej wersji: [POPRAWKI.md](POPRAWKI.md).

## Cel

Domyslny scenariusz to ciagle przetrwanie na mapie 3600x2400, z pierwszym kryzysem po 10 dniach. Folwark jest ogrodzony; dwie bramy lacza go ze szlakami do trzech sasiadow. W srodku pozostaly pojedyncze drzewa sadu, a las rosnie glownie poza plotem.

O swicie dnia 11 musi zyc co najmniej 8 mieszkancow, a cieplo kwater musi wynosic co najmniej 40%. Mniej niz 6 zywych albo niepokoje powyzej 80% koncza rzady wczesniej. Po udanym pierwszym kryzysie gra nie zatrzymuje sie: nadchodza wiosna, lato i nastepny rok. Kronika zachowuje uczciwosc rady, zgony i osoby oddane ludziom.

To interpretacja politycznego dramatu Folwarku zwierzecego: przetrwanie, propaganda, nierowne racje, przymus i moralne konsekwencje. Nie jest pelna replika Frostpunka ani kompletna adaptacja fabuly ksiazki.

Pasek pod zasobami pokazuje aktualny priorytet. Zakladka Przetrwanie podaje cel, ogrzewanie, zaufanie, strach i uczciwosc. Rozdzial znajduje sie w naglowku, pomiedzy zasobami a zegarem. Pauza i komunikaty nie zaslaniaja mapy.

Jeden dzien trwa 65 sekund przy predkosci 1x. Mozna zatrzymac czas lub przyspieszyc go do 2x i 4x.
Menu glowne > Nowa gra pozwalaja wrocic do dawnej kampanii 7 dni lub trybu swobodnego. Wczytanie starszego zapisu zachowuje jego scenariusz; nowa zima wymaga rozpoczecia scenariusza Przetrwanie.

## Zima i wladza

- Ocieplenie kosztuje 60 drewna i 20 kamienia; zmniejsza zuzycie opalu o 30%.
- Temperatura: +8 C w dniach 1-3, 0 C w dniach 4-6, -12 C w dniach 7-8, -24 C w dniach 9-10, -12 C w dniach 11-13. Potem temperatura wynika z powtarzalnego sezonu.
- Bazowe ogrzewanie zuzywa 28 albo 48 drewna dziennie. Mroz zwieksza te wartosci do 2,5 raza; panel pokazuje aktualny koszt.
- Przy -24 C potrzebne jest mocne ogrzewanie. Brak opalu obniza cieplo; zimno odbiera zdrowie. Lecznica wymaga ciepla i dostepnego jedzenia.
- Dzienne racje kosztuja 2 zboza na osobe (1 chleb zastepuje 2 zboza), niezaleznie od indywidualnych przerw na posilki.
- Dekrety wymagaja placu zgromadzen. Mozna wydac jeden na dzien: prawdziwe zapasy, propaganda o urodzaju, przymusowa zmiana albo pokaz sily.
- Propaganda zwieksza lojalnosc, ale niedobor ponizej 55 zboza i chleba ujawnia klamstwo i obniza zaufanie. Niskie zaufanie oslabia lojalnosc i podnosi krzywde.
- Przymus: +35% pracy, +60% zmeczenia i utrata zdrowia pracujacych przez jeden dzien. Pokaz sily bezposrednio rani pracownikow i pogarsza relacje z Wolnym Mlynem.
- Cenzura kosztuje 12 monet. Oficjalny biuletyn moze ukrywac smierc jako przeniesienie; rzeczywista Kronika zachowuje nazwisko i decyzje.
- W dniach 3, 5 i 7 czas zatrzymuja dylematy. Rozkazy przemocy i oddania pracownika wymagaja osobnego potwierdzenia.

## Pory roku, teren i zagrozenia

Rok liczy 28 dni: jesien 1-6, zima 7-13, wiosna 14-20, lato 21-28. Zapis zachowuje dokladny czas i faze zagrozenia. Zima zatrzymuje odrastanie upraw; wiosna przyspiesza wzrost. Podloze, drzewa, pola i staw zmieniaja wyglad, zima pojawiaja sie lod i snieg. W cieplych sezonach ogrzewanie nie zuzywa drewna.

Pozary i najazdy pojawiaja sie naprzemiennie, z 30-sekundowym ostrzezeniem. Pasek alarmu otwiera miejsce zagrozenia i rozkazy w panelu Przetrwanie. Straz musi dotrzec do ognia lub przeciwnika; zapasy awaryjne kosztuja 15 drewna i 10 zboza. Pozar niszczy zboze i blokuje rozladunek. Najezdzcy ida przez brame po zapasy i moga zostac odparci przez straz.

Pastwiska maja odrebne ploty, przechodnia brame i stanowiska wypasu. Ogrodzenie staje sie przeszkoda po zakonczeniu budowy. Zwierzeta zachowuja odstep, a dojscia korzystaja z powiekszonych obrysow budynkow. Zniknela dekoracja pastwiska z wmalowanymi zwierzetami.

Nowe pliki `winter-tree.png` i `fence-timber.png` wygenerowano wbudowanym narzedziem OpenAI do obrazow: zimowy dab bez lisci oraz proste przeslo ze starych drewnianych belek, z przezroczystym tlem. Plot jest skladany w runtime z pionowymi slupami, nie obracany jako plaski obrazek. Pola ponownie wycieto z dostarczonego arkusza `buildings-final.png`, z przezroczystym marginesem.

Weryfikacja: `npm test`, `npm run build`, skrypty Playwright `seasons-browser.js`, `browser-smoke.js` i `asset-loading-browser.js`.

## Menu i opcje

Gra uruchamia sie w menu nad zatrzymana plansza. Kontynuuj wczytuje najnowszy poprawny zapis; Nowa gra pozwala wybrac przetrwanie, kampanie lub tryb swobodny. Menu w czasie gry zatrzymuje symulacje i po powrocie zachowuje wczesniejsza pauze.
Opcje zapamietuja glosnosc i dzwieki interfejsu, przesuwanie przy krawedzi, szybkosc kamery, ograniczenie animacji oraz czestotliwosc autozapisu. Dostepny jest pelny ekran.

## Sasiedzi

Zakladka Sasiedzi lub klikniecie obcej siedziby otwiera relacje i oferty. Klikniecie nazwy centruje kamere.
Kamienny Dwor: 40 drewna za 85 zboza. Wolny Mlyn: 45 zboza za 75 drewna. Czerwony Folwark: 25 monet za 45 chleba.
Koszt pobierany jest przy wysylce; karawana jedzie do sasiada i wraca z ladunkiem. Dopiero powrot zasila magazyn. Pelny magazyn zatrzymuje karawane z pozostala czescia ladunku.
Pomoc kosztuje 25 zboza i podnosi relacje o 20 punktow dopiero po dotarciu. Relacje ponizej 20 punktow oznaczaja embargo handlowe.
Jedna aktywna karawana na sasiada. Budowa wymusza omijanie nowych przeszkod; nieprzejezdna trasa wstrzymuje przewoz.
Kontrakt z Dworem bezpowrotnie oddaje wskazanego pracownika ludziom za obietnice 100 zboza i 30 monet. Spada zaufanie i uczciwosc; osoba przestaje pracowac natychmiast, zaplata wraca karawana.

Sasiedzi prowadza wlasna gospodarke: Dwor zbiera zboze, Mlyn zuzywa zboze podczas pozyskiwania drewna, Czerwony Folwark piecze chleb ze zboza i drewna. Oferty rezerwuja rzeczywiste zapasy. Niedobory, pelne magazyny, zimno i przestoje ograniczaja produkcje. Dzien 3 przynosi strajk, dzien 5 wichure; dostarczona pomoc moze wznowic prace. Wlasni kupcy sasiadow wywoza nadwyzki i wracaja z zaplata oraz zywnoscia.

## Droga do miasta

Wschodni trakt wychodzi poza granice mapy. Zakladka Sasiedzi zawiera zamowienia miejskie: 35 monet za 120 zboza i 30 chleba, 30 monet za 100 drewna, 40 monet za 20 narzedzi lub 70 zboza za 45 monet. Jedna karawana miejska naraz. Po dotarciu do granicy znika na pelny dzien (65 sekund symulacji), nastepnie fizycznie wraca. Nie jest to osobna grywalna mapa miasta.

## Sterowanie

- Lewy przycisk myszy: wybierz zwierze lub budynek. Portrety na dole rowniez wybieraja jednostki.
- Przeciagniecie lewym przyciskiem: zaznacz grupe. Shift dodaje jednostke do wyboru.
- Prawy przycisk: rozkaz ruchu (Shift kolejkowuje do 16 punktow); nad polem wydaje rozkaz zbiorow, nad skladem drewna zbior drewna, nad kamieniolomem wydobycie. Nad budowa przydziela budowniczych; nad zakladem produkcje, nad stodola rozladunek.
- Przyciski na dole: ruch, plony, drewno, kamien, posilek, odpoczynek i zatrzymanie, a takze budowa, rozladunek, patrol, pilnowanie miejsca i wybor bezczynnych.
- WASD / strzalki, przeciaganie srodkowym/prawym przyciskiem lub narzedzie dloni: przesuwanie mapy. Przesuwanie przy krawedzi mozna wylaczyc w Opcjach. Rolka i przyciski +/-: przyblizanie.
- Klikniecie minimapy przesuwa widok. Przycisk celownika centruje folwark.
- Spacja: pauza (gdy fokus nie znajduje sie w przycisku lub oknie). Escape: anulowanie trybu budowy/ruchu.
- Telefon: wybierz portret, dotknij rozkazu, a przy ruchu dotknij miejsca na mapie. Dlon pozwala przesuwac mape dotykiem. Minimapka i +/- steruja widokiem.

## Rozgrywka

Mieszkancy niosa zasoby do stodoly. Zboze nie trafia do magazynu przed rozladunkiem.
Pracownicy jedza i odpoczywaja, po czym wracaja do przydzielonej pracy.
Zmiana pracy z zachowanym ladunkiem najpierw kieruje jednostke do rozladunku.

Panel Rozbudowa pozwala postawic pola, ogrody, domy, spichlerze, studnie, lecznice, wiatraki i straznice.
17 rodzajow budowli, w tym piekarnia, kuznia, szkola, biblioteka, pasieka, sad i targ. Kamien i drewno pochodza z istniejacych zloz; nie mozna tworzyc ich za pomoca budowy.
Budowa kosztuje surowce z gory i wymaga obecnosci pracownikow. Czas zalezy od wielkosci obiektu, zalogi, zmeczenia, polityki i technologii. Dwie wolne jednostki moga zostac przydzielone automatycznie; recznie zatrzymane jednostki czekaja na rozkaz.
W panelu Zaklady widac kolejke, priorytety i produkcje. Anulowanie zwraca 80% niewykorzystanej czesci kosztu. Wstrzymanie zakladu zwalnia zaloge, ktora po wznowieniu wymaga ponownego przydzialu.
Nie mozna budowac na wodzie, przeszkodach, drodze ani innym budynku.
Domy zwiekszaja limit mieszkancow; nowych pracownikow przyjmuje sie w panelu domu lub w Radzie.

Rada zmienia racje, rytm pracy, podatki, wielkosc posilkow i gospodarke lesna. Mobilizacja daje 130% wydajnosci i 150% zmeczenia; krotsza praca 80% i 65%. Wysokie podatki zwiekszaja dochod i krzywde. Targ poprawia ceny zakupu oraz sprzedazy. Cena i ilosc sa widoczne przed wymiana.
Nierowne racje zwiekszaja krzywde pracownikow. Dlugi glod i wyczerpanie prowadza do odmowy pracy i protestow.
W dniach 3, 5 i 7 pojawiaja sie decyzje, ktore zatrzymuja czas do rozstrzygniecia.
Kronika zapisuje decyzje i wazne wydarzenia.

Ksiega folwarku zawiera wszystkie 18 oryginalnych arkuszy i ilustracji z mozliwoscia podgladu.
Arkusze sluza jako atlasy budynkow, jednostek, zasobow i portretow. Ilustracje koncepcyjne oraz karty sa dostepne w ksiedze.

## Drogi i transport

Rozbudowa > droga ziemna lub kamienna. Kliknij poczatek, potem koniec odcinka (24-700 krokow); kolejne klikniecia przedluzaja trase. Escape lub prawy przycisk konczy wytyczanie. Czerwony podglad oznacza przeszkode albo brak zasobow.
Ziemna droga kosztuje 1 drewna na kazde rozpoczete 35 krokow i daje 130% predkosci. Kamienna: 1 kamienia / 25 krokow oraz 1 drewna / 80 krokow; daje 165% predkosci. Obie powstaja od razu, bez zalogi budowlanej.
Wyszukiwanie sciezki uwzglednia czas przejscia, nie tylko odleglosc. Mozna polozyc bruk na ziemnej drodze. Narzedzie rozbiorki usuwa najwyzszy odcinek i oddaje 25% materialow.

## Produkcja i badania

Zaklady potrzebuja pracownika na miejscu oraz skladnikow w magazynie. Pelny magazyn lub brak skladnikow zatrzymuje cykl bez produkowania zasobow z niczego.
- Wiatrak: 5 zboza -> 4 maki, bazowy cykl 8 sekund pracy.
- Piekarnia: 4 maki + 1 drewna -> 6 chleba, 9 sekund.
- Kuznia: 3 drewna + 2 kamienia -> 2 narzedzia, 12 sekund.
- Szkola: 2 zboza -> 3 wiedzy, 12 sekund.
- Pasieka: 2 posilki (wspolny zapas chleba), 16 sekund.

Do 3 pracownikow na zaklad. Ulepszenia zakladow i upraw do poziomu 3 podnosza wydajnosc; w uprawach zwiekszaja tez zapas.
Biblioteka odblokowuje 3 jednorazowe badania: agronomia (+20% zbiorow i odrastania), logistyka (+8 udzwigu, +10% ruchu), murarstwo (+30% budowy).
Drewno odrasta tylko przy odnawialnej gospodarce lesnej. Kamien jest skonczony. Plony korzystaja ze studni w poblizu; chleb jest jedzony przed surowym zbozem.

## Zapisy

Przycisk dyskietki tworzy zapis reczny. Gra robi oddzielny zapis automatyczny co 20 sekund czasu rzeczywistego.
Zapis v4 obejmuje drogi, produkcje, prawa, badania, ogrzewanie, dekrety, ofiary, kontrakty i karawany. Starsze zapisy v1/v2/v3 otrzymuja domyslny stan rady oraz przeliczone trasy wokol nowego ogrodzenia. Uszkodzone dane sa odrzucane przed zmiana stanu gry.
Oba zapisy wczytuje sie w Opcjach. Zapisy sa lokalne dla danej przegladarki i adresu/pliku.
Nowa gra nie usuwa recznego zapisu. Automatyczny zapis zostanie z czasem zastapiony nowa rozgrywka.
Przegladarka prywatna lub blokujaca pamiec lokalna moze uniemozliwic zachowanie zapisow.

## Rozwoj projektu

Wymagany Node.js 22.12+ (testowano na Node 24).

```sh
npm ci
npm run dev -- --port 5177
npm test
npm run build
npm run portable
```

- `dist/`: produkcyjna wersja do hostowania na serwerze HTTP.
- `portable/GRAJ-FOLWARK.html`: pojedynczy plik do grania offline.
- `src/simulation/`: niezalezna logika i model stanu.
- `src/game/FarmScene.ts`: mapa, kamera, atlas i interakcje.
- `src/game/UI.ts`: panele, rozkazy, zapisy i okna.
- `src/game/Atlas.ts` i `prepared-atlas.json`: ramki obiektow oraz portretow.
- `src/game/Terrain.ts`: materialy podloza i maski drog; laka pochodzi z OpenAI, pozostale materialy z Higgsfield.
- `src/game/Atmosphere.ts`: cienie i ruch wody; ruch roslinnosci w FarmScene.
- `src/game/Gait.ts`: proceduralna animacja konczyn z jednej sylwetki, bez podmieniania roznych poz.
- `scripts/prepare-sprites.ts`: odtwarzalna ekstrakcja 80 pelnych obiektow przez `npm run assets`.
- `public/assets/`: 18 niezmienionych oryginalow oraz cztery dodatkowe pliki terenu i atlasu.
- `tests/simulation.test.ts`: testy gospodarki, budowy, transportu, zapisu, polityki i pelnego scenariusza.

Test przegladarki: `npx playwright-cli -s=folwark open http://127.0.0.1:5177 --browser chrome`, a potem
`npx playwright-cli -s=folwark run-code --filename scripts/browser-smoke.js`.
Nowe funkcje sprawdza rowniez skrypt scripts/development-browser.js (drogi, przeciaganie kamery, budowa, zaloga, handel i polityka).
Skrypt scripts/survival-browser.js sprawdza nowe panele, dekrety, potwierdzenia, ogrzewanie, kontrakt i sasiadow na 5 rozmiarach ekranu.
Menu, miejsca zapisu, import/eksport, trwale opcje i handel regionalny sprawdza scripts/menu-region-browser.js; najpierw uruchom `node --import tsx scripts/menu-fixtures.ts`.
Skrypt offline-smoke dokumentuje test lokalnego pliku; jego adres pliku trzeba dostosowac po przeniesieniu projektu.

## Weryfikacja

66 testow logiki i atlasu, w tym uczciwe przetrwanie calej zimy, porazka bez reakcji na mroz, dekrety, cenzura, kontrakty i fizyczne dostawy. Test klikania: wybor, ruch, budowa, zapis/odczyt, polityka, wydarzenia i galeria.
Skrypt `scripts/regression-browser.js` sprawdza 180 klatek ruchu, ich marginesy, proporcje, kierunek, pauze i widocznosc jednostek na polach.
Sprawdzone widoki: 1920x1080, 1440x960, 1280x720, 390x844 i 360x740; kontrola pikseli canvasa i bledow JavaScript.
Plik offline sprawdzony przez file:// z zablokowanymi polaczeniami HTTP i HTTPS.

To lokalna, grywalna pierwsza wersja scenariusza RTS. Nie zawiera wszystkich systemow dawnej gry z glownego index.html, np. wyborow, konstytucji czy walki z ludzmi.

## Frontiers update

Buildable fences and gates, wildlife, political missions, larger region and progression trees:
see [FRONTIERS.md](docs/FRONTIERS.md). Saves now use version 8, with migration from earlier releases.

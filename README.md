# MatIndeks

[Otwórz MatIndeks](https://szymongazinski.github.io/MatIndeks/)

Baza zadań z matury rozszerzonej z matematyki. Obejmuje główne i dodatkowe terminy od 2015 r. do 2026 r., arkusze przykładowe do matur 2015 i 2023, próby CKE z grudnia 2014, kwietnia 2020, marca 2021, grudnia 2022 i grudnia 2024 oraz zbiór zadań CKE w formule 2023. Terminy główny i dodatkowy 2020 r. przypadały odpowiednio w czerwcu i lipcu. Od 2023 r. roczniki zawierają nowszą formułę. Próbny arkusz z kwietnia 2020 r. powtarza zadania z czerwca 2018 r. W archiwum są oba terminy, a generator nie losuje tej samej treści dwukrotnie.

Każde zadanie prowadzi do oryginalnego PDF-u i strony rozwiązania CKE. Rozwiązania przedstawiają metody CKE własnymi słowami. W zadaniach zamkniętych klucz CKE może zawierać samą literę odpowiedzi. W plikach CKE dostępne są też dodatkowe szkice pomocnicze do niektórych wariantów rozwiązań. [Archiwum arkusze.pl](https://arkusze.pl/matematyka-matura-poziom-rozszerzony/) · [Zbiór zadań CKE](https://cke.gov.pl/images/_EGZAMIN_MATURALNY_OD_2023/materialy_dodatkowe/matematyka/Matematyka%20-%20zbior%20zadan%20na%20poziomie%20rozszerzonym.pdf)

Kategorie odpowiadają celowi polecenia. Tagi opisują badany motyw lub narzędzie użyte w co najmniej jednej metodzie rozwiązania danego podpunktu. Przycisk przy kategorii rozwija jej tagi tematyczne. Katalog i archiwum mają sortowanie po roku i terminie w obu kierunkach. Zadania za 1 pkt są dostępne w zwijanym dziale w katalogu i w odpowiednich arkuszach. Wyszukiwarka i generator korzystają z pozostałych zadań.

## Generator

Generator losuje po jednym zadaniu z równań kwadratowych z parametrem, ciągów, równań trygonometrycznych, geometrii analitycznej, geometrii przestrzennej i optymalizacji. Losuje też dwa zadania z planimetrii (85% losowań) lub trzy (15%) i jedno zadanie z kombinatoryki albo prawdopodobieństwa. Dodatkowo może losować jedno zadanie na dowodzenie (65%) oraz od zera do trzech zadań z różnych krótszych działów (odpowiednio 10%, 15%, 60% i 15%). Wagi liczności dotyczą puli, w której wszystkie liczności są możliwe. Każde zadanie liczy się do swojej głównej kategorii. Dla wylosowanej liczby zadań generator dobiera punktację najbliższą 50.

W trybie pełnego arkusza wybrane lata ograniczają pulę. Opcja „Tylko nowa formuła” zawęża ją do zadań w formule 2023 z lat 2023–2026. Możesz wykluczyć zadania z wybranymi tagami oraz ustawić limit najwyżej jednego zadania na każdy tag dodany do pola „Maksymalnie raz”. Generator sprawdza, czy filtry pozwalają zachować wymagany rozkład kategorii. W tym trybie można też sprawdzić częstości kategorii w arkuszach CKE.

W trybie „Według kategorii” generator losuje z wybranych działów. Tagi opcjonalnie zawężają pulę do zadań spełniających wszystkie uwzględnione tagi. Zadanie z dowolnym wykluczonym tagiem wypada z puli.

## Dane i uruchomienie

Źródłem publikowanej bazy są `content/arkusze.json` i `content/zbior.json`. Plik SQLite zawiera jedną tabelę `zadania`. Numer zadania jest tekstem, żeby zachować podpunkty takie jak `12.1` i `13a`. Kategorie i tagi to tablice JSON zgodne ze słownikami w `docs/data/slowniki.json`. Pierwsza kategoria służy do obliczania rozkładu. Pola `sprawdzone_polecenie` i `sprawdzone_rozwiazanie` oznaczają porównanie transkrypcji ze źródłem.

Zapis `[[rysunek:nazwa|opis]]` wstawia oryginalny rysunek z PDF-u CKE wycięty jako PNG z przezroczystym tłem. Plik `content/kadry-rysunkow.json` podaje dla każdego rysunku nazwę PDF-u, numer strony i współrzędne wycinka liczone w punktach od lewego górnego rogu strony. Do odtworzenia plików użyj `python scripts/wytnij-rysunki.py <katalog-z-pdfami>` z pakietami `pymupdf` oraz `Pillow`.

Po zmianach w danych uruchom z katalogu projektu:

```sh
python scripts/build_database.py
npm ci
npm test
node scripts/sprawdz-formuly.mjs
python -m unittest discover -s tests -p "test_*.py"
python -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Podgląd jest dostępny pod [localhost:8000](http://127.0.0.1:8000). GitHub Pages publikuje folder `docs/` gałęzi `main`. Przeglądarka odczytuje SQLite przez sql.js i renderuje wzory przez KaTeX. Pliki potrzebne do działania strony są w repozytorium.

# MatIndeks

[Otwórz MatIndeks](https://szymongazinski.github.io/MatIndeks/)

Baza zadań z matury rozszerzonej z matematyki. Obejmuje główne i dodatkowe terminy od 2015 r. do 2026 r., arkusze przykładowe do matur 2015 i 2023, próby CKE z grudnia 2014, kwietnia 2020, marca 2021, grudnia 2022 i grudnia 2024 oraz zbiór zadań CKE w formule 2023. Terminy główny i dodatkowy 2020 r. przypadały odpowiednio w czerwcu i lipcu. Od 2023 r. roczniki zawierają nowszą formułę. Próbny arkusz z kwietnia 2020 r. powtarza zadania z czerwca 2018 r. W archiwum są oba terminy, a generator nie losuje tej samej treści dwukrotnie.

Każde zadanie prowadzi do oryginalnego PDF-u i strony rozwiązania CKE. Oznaczenie „Transkrypcja automatyczna” dotyczy materiału wymagającego jeszcze sprawdzenia z oryginałem. W plikach CKE dostępne są także rysunki pomocnicze używane w dalszych wariantach rozwiązań. [Archiwum arkusze.pl](https://arkusze.pl/matematyka-matura-poziom-rozszerzony/) · [Zbiór zadań CKE](https://cke.gov.pl/images/_EGZAMIN_MATURALNY_OD_2023/materialy_dodatkowe/matematyka/Matematyka%20-%20zbior%20zadan%20na%20poziomie%20rozszerzonym.pdf)

Przycisk przy kategorii rozwija przypisane jej tagi tematyczne. Wybór tagu z tego menu zawęża wyniki w ramach kategorii. Zadania za 1 pkt są dostępne w zwijanym dziale w katalogu i w odpowiednich arkuszach. Wyszukiwarka i generator korzystają z pozostałych zadań.

## Generator

Pełne arkusze główne i dodatkowe w formule 2023 wyznaczają częstości głównych kategorii. Generator losuje rozkład jednego z tych arkuszy, dobiera zadania z wybranych lat i szuka sumy możliwie bliskiej 50 pkt. Gdy kilku zadań brakuje w wybranej puli, podaje brakujące kategorie. Wybrane tagi włączają losowanie z puli spełniającej wszystkie uwzględniane tagi i wolnej od wykluczanych tagów.

## Dane i uruchomienie

Źródłem publikowanej bazy są `content/arkusze.json` i `content/zbior.json`. Plik SQLite zawiera jedną tabelę `zadania`. Numer zadania jest tekstem, żeby zachować podpunkty takie jak `12.1`. Kategorie i tagi to tablice JSON zgodne ze słownikami w `docs/data/slowniki.json`. Pierwsza kategoria służy do obliczania rozkładu. Pola `sprawdzone_polecenie` i `sprawdzone_rozwiazanie` oznaczają porównanie transkrypcji ze źródłem. Zapis `[[rysunek:nazwa|opis]]` wstawia odpowiadający eksport z GeoGebry. Edytowalne konstrukcje są w `geogebra/konstrukcje/`.

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

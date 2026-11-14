# Rysunki MatIndeks

Polecenia i rozwiązania używają znaczników `[[rysunek:nazwa|opis alternatywny]]`. Nazwa wskazuje na plik PNG w katalogu `docs/rysunki`. Do każdego eksportu dołączono edytowalny plik `.ggb` w `geogebra/konstrukcje`.

Rysunki powstały z obiektów GeoGebry 5.4.920.0. Konstrukcje odtwarzają informacje podane w rysunkach CKE. Perspektywę brył przedstawiono umownie. Powtarzające się rysunki do podpunktów wspólnego zadania używają jednego pliku. Powiązania z zadaniami i numery stron dokumentują `arkusze.json` i `rozwiazania.json`.

Do ponownego eksportu jest potrzebny Node.js, pakiet `playwright-core`, Chromium i dostęp do GeoGebry w sieci. Ścieżkę do lokalnego Chromium można przekazać w zmiennej środowiskowej `MATINDEKS_CHROMIUM`. Z głównego katalogu projektu uruchom `node geogebra/export.cjs`, aby wyeksportować wszystkie rysunki, albo dodaj jedną lub kilka nazw, np. `node geogebra/export.cjs 2026-05-4`.

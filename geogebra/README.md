# Rysunki MatIndeks

Na stronie wyświetlane są oryginalne ilustracje z PDF-ów CKE. Katalog `geogebra/konstrukcje` zawiera wcześniejsze edytowalne konstrukcje GeoGebry 5.4.920.0. Numery stron w `arkusze.json` i `rozwiazania.json` dotyczą źródeł tych konstrukcji. Współrzędne aktualnych wycinków są w `content/kadry-rysunkow.json`.

Do ponownego eksportu konstrukcji jest potrzebny Node.js, pakiet `playwright-core`, Chromium i dostęp do GeoGebry w sieci. Ścieżkę do lokalnego Chromium można przekazać w zmiennej środowiskowej `MATINDEKS_CHROMIUM`. Polecenie `node geogebra/export.cjs` zapisuje pliki PNG w `geogebra/eksport/`. Można też podać nazwę, np. `node geogebra/export.cjs 2026-05-4`.

"""Build the published, read-only SQLite catalog using the versioned JSON data."""

import argparse
import json
import re
import sqlite3
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
FIELDS = (
    "id", "numer", "arkusz_id", "arkusz", "rok", "miesiac", "typ", "formula",
    "punkty", "kategorie", "tagi", "polecenie", "rozwiazanie", "zrodlo_arkusz",
    "zrodlo_rozwiazanie", "strona_zadania", "strona_rozwiazania",
    "sprawdzone_polecenie", "sprawdzone_rozwiazanie",
)
JSON_FIELDS = {"kategorie", "tagi"}
TYPES = {"glowny", "dodatkowy", "przykladowy", "diagnostyczny", "zbior"}
FIGURE = re.compile(r"\[\[rysunek:([a-z0-9.-]+(?:-[a-z0-9.-]+)*)\|[^\n|\]]+\]\]")
SCHEMA = """
CREATE TABLE zadania (
    id TEXT PRIMARY KEY,
    numer TEXT NOT NULL,
    arkusz_id TEXT NOT NULL,
    arkusz TEXT NOT NULL,
    rok INTEGER NOT NULL CHECK (rok >= 2014),
    miesiac INTEGER CHECK (miesiac BETWEEN 1 AND 12),
    typ TEXT NOT NULL CHECK (typ IN ('glowny', 'dodatkowy', 'przykladowy', 'diagnostyczny', 'zbior')),
    formula INTEGER NOT NULL CHECK (formula IN (2015, 2023)),
    punkty INTEGER CHECK (punkty > 0),
    kategorie TEXT NOT NULL CHECK (json_valid(kategorie) AND json_array_length(kategorie) > 0),
    tagi TEXT NOT NULL CHECK (json_valid(tagi) AND json_type(tagi) = 'array'),
    polecenie TEXT NOT NULL CHECK (length(trim(polecenie)) > 0),
    rozwiazanie TEXT,
    zrodlo_arkusz TEXT NOT NULL,
    zrodlo_rozwiazanie TEXT,
    strona_zadania INTEGER NOT NULL CHECK (strona_zadania > 0),
    strona_rozwiazania INTEGER CHECK (strona_rozwiazania > 0),
    sprawdzone_polecenie INTEGER NOT NULL DEFAULT 0 CHECK (sprawdzone_polecenie IN (0,1)),
    sprawdzone_rozwiazanie INTEGER NOT NULL DEFAULT 0 CHECK (sprawdzone_rozwiazanie IN (0,1)),
    UNIQUE (arkusz_id, numer)
) STRICT;
CREATE INDEX zadania_termin ON zadania (rok, miesiac, typ, arkusz_id);
"""
BOOK_URL = (
    "https://cke.gov.pl/images/_EGZAMIN_MATURALNY_OD_2023/materialy_dodatkowe/"
    "matematyka/Matematyka%20-%20zbior%20zadan%20na%20poziomie%20rozszerzonym.pdf"
)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def load_rows(path):
    with closing(sqlite3.connect(path)) as database:
        database.row_factory = sqlite3.Row
        rows = [dict(row) for row in database.execute("SELECT * FROM zadania ORDER BY rowid")]
    for row in rows:
        for field in JSON_FIELDS:
            row[field] = json.loads(row[field])
    return rows


def build_database(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix="matindeks-", dir=path.parent) as temp:
        new_database = Path(temp) / "catalog.sqlite"
        connection = sqlite3.connect(new_database)
        try:
            with connection:
                connection.executescript(SCHEMA)
                connection.executemany(
                    f"INSERT INTO zadania ({', '.join(FIELDS)}) VALUES ({', '.join('?' for _ in FIELDS)})",
                    ([json.dumps(row[field], ensure_ascii=False) if field in JSON_FIELDS else row[field]
                      for field in FIELDS] for row in rows),
                )
                if connection.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                    raise ValueError("SQLite wykrył niespójną bazę.")
        except sqlite3.IntegrityError as error:
            raise ValueError(f"Niepoprawny albo powtórzony rekord: {error}") from error
        finally:
            connection.close()
        new_database.replace(path)


def figure_directives(task):
    matches = FIGURE.findall(task)
    if len(matches) != task.count("[[rysunek:"):
        raise ValueError("Niepoprawny znacznik rysunku.")
    return matches


def validate(rows, dictionary, figures):
    by_sheet = {}
    for row in rows:
        key = row["id"]
        if not re.fullmatch(r"\d+(?:\.\d+)?", row["numer"]) or row["typ"] not in TYPES:
            raise ValueError(f"Nieprawidłowy numer albo typ: {key}")
        for field in JSON_FIELDS:
            labels = row[field]
            if not set(labels) <= set(dictionary[field]) or len(set(labels)) != len(labels):
                raise ValueError(f"Nieznane lub powtórzone etykiety {field}: {key}")
        for name in ("zrodlo_arkusz", "zrodlo_rozwiazanie"):
            if row[name] and urlsplit(row[name]).scheme != "https":
                raise ValueError(f"Wymagany adres HTTPS w {name}: {key}")
        if row["zrodlo_rozwiazanie"] and not row["strona_rozwiazania"]:
            raise ValueError(f"Brak numeru strony rozwiązania: {key}")
        for field in ("polecenie", "rozwiazanie"):
            for slug in figure_directives(row[field] or ""):
                if not (figures / f"{slug}.png").is_file():
                    raise ValueError(f"Brak rysunku {slug} dla {key}")
        if row["typ"] != "zbior":
            by_sheet[row["arkusz_id"]] = by_sheet.get(row["arkusz_id"], 0) + row["punkty"]
    for sheet, points in by_sheet.items():
        if points != 50:
            raise ValueError(f"Arkusz {sheet}: {points} pkt zamiast 50.")


def collection_rows():
    for row in read_json(ROOT / "content" / "zbior.json"):
        yield {
            **row, "id": f"zbior-2023-{row['numer']}", "arkusz_id": "zbior-2023",
            "arkusz": "Zbiór zadań CKE 2023", "rok": 2023, "miesiac": None,
            "typ": "zbior", "formula": 2023, "zrodlo_arkusz": BOOK_URL, "zrodlo_rozwiazanie": BOOK_URL,
            "sprawdzone_polecenie": 1, "sprawdzone_rozwiazanie": 1,
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "docs/data/zadania.sqlite")
    args = parser.parse_args()
    dictionary = read_json(ROOT / "docs/data/slowniki.json")
    rows = read_json(ROOT / "content" / "arkusze.json") + list(collection_rows())
    validate(rows, dictionary, ROOT / "docs/rysunki")
    build_database(args.output, rows)
    print(f"{len(rows)} zadań, {len({row['arkusz_id'] for row in rows})} zestawy → {args.output}")


if __name__ == "__main__":
    main()

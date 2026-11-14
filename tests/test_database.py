import unittest
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from build_database import build_database, load_rows


class DatabaseTest(unittest.TestCase):
    def test_source_is_one_table_and_preserves_solution_and_ordered_taxonomy(self):
        row = {
            "id": "2026-05-1", "numer": "1", "arkusz_id": "2026-05", "arkusz": "Maj 2026",
            "rok": 2026, "miesiac": 5, "typ": "glowny", "formula": 2023, "punkty": 2,
            "kategorie": ["Ciągi", "Granice"], "tagi": ["Granica ciągu"],
            "polecenie": r"Oblicz \(x\).", "rozwiazanie": r"Pierwsza metoda. \(x=2\).",
            "zrodlo_arkusz": "https://arkusze.pl/a.pdf", "zrodlo_rozwiazanie": "https://arkusze.pl/r.pdf",
            "strona_zadania": 3, "strona_rozwiazania": 2,
            "sprawdzone_polecenie": 1, "sprawdzone_rozwiazanie": 0,
        }
        with TemporaryDirectory() as directory:
            path = Path(directory) / "catalog.sqlite"
            build_database(path, [row])
            self.assertEqual(load_rows(path), [row])

    def test_duplicate_number_in_a_sheet_raises_even_with_new_id(self):
        row = {
            "id": "paper-6.1", "numer": "6.1", "arkusz_id": "paper", "arkusz": "Maj 2026",
            "rok": 2026, "miesiac": 5, "typ": "glowny", "formula": 2023, "punkty": 2,
            "kategorie": ["Granice"], "tagi": [], "polecenie": "Zadanie.", "rozwiazanie": None,
            "zrodlo_arkusz": "https://arkusze.pl/a.pdf", "zrodlo_rozwiazanie": None,
            "strona_zadania": 2, "strona_rozwiazania": None,
            "sprawdzone_polecenie": 1, "sprawdzone_rozwiazanie": 0,
        }
        with TemporaryDirectory() as directory:
            path = Path(directory) / "catalog.sqlite"
            with self.assertRaisesRegex(ValueError, "powtórz"):
                build_database(path, [row, {**row, "id": "other"}])
            self.assertFalse(path.exists())


if __name__ == "__main__":
    unittest.main()

import assert from 'node:assert/strict';
import test from 'node:test';
import initSqlJs from 'sql.js';
import { Catalog } from '../docs/js/catalog.js';

const SQL = await initSqlJs();

test('catalog option counts predict the results of each additional filter', () => {
  const database = new SQL.Database();
  database.run(`CREATE TABLE zadania (id, rok, typ, kategorie, tagi);
    INSERT INTO zadania VALUES
      ('a', 2026, 'glowny', '["Ciągi"]', '["Rekurencja","Granica ciągu"]'),
      ('b', 2026, 'glowny', '["Ciągi","Granice"]', '["Granica ciągu"]'),
      ('c', 2025, 'dodatkowy', '["Planimetria"]', '["Skala podobieństwa"]')`);
  const catalog = new Catalog(database, {});
  const options = catalog.taskOptions({ category: 'Ciągi', tags: ['Rekurencja'] });
  assert.equal(options.total, 1);
  assert.equal(options.tags.get('Granica ciągu'), 1);
  assert.equal(options.tags.get('Skala podobieństwa') ?? 0, 0);
  assert.deepEqual([...options.categories], [['Ciągi', 1]]);
  database.close();
});

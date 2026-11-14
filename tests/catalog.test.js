import assert from 'node:assert/strict';
import test from 'node:test';
import initSqlJs from 'sql.js';
import { Catalog } from '../docs/js/catalog.js';

const SQL = await initSqlJs();

test('catalog option counts predict the results of each additional filter', () => {
  const database = new SQL.Database();
  database.run(`CREATE TABLE zadania (id, rok, typ, kategorie, tagi, punkty);
    INSERT INTO zadania VALUES
      ('a', 2026, 'glowny', '["Ciągi"]', '["Rekurencja","Granica ciągu","Monotoniczność ciągu"]', 3),
      ('b', 2026, 'glowny', '["Ciągi","Granice"]', '["Granica ciągu"]', 4),
      ('c', 2025, 'dodatkowy', '["Planimetria"]', '["Skala podobieństwa"]', 4)`);
  const catalog = new Catalog(database, {});
  const options = catalog.taskOptions({ category: 'Ciągi', tags: ['Rekurencja'] });
  assert.equal(options.total, 1);
  assert.equal(options.tags.get('Granica ciągu'), 1);
  assert.equal(options.tags.get('Skala podobieństwa') ?? 0, 0);
  assert.deepEqual([...options.categories], [['Ciągi', 1]]);
  assert.equal(options.tagsByCategory.get('Ciągi').get('Granica ciągu'), 1);
  assert.equal(options.tagsByCategory.get('Granice'), undefined);
  const alternatives = catalog.taskOptions({ category: 'Ciągi', tags: ['Granica ciągu'] });
  assert.equal(alternatives.tagsByCategory.get('Ciągi').get('Rekurencja'), 1);
  assert.equal(alternatives.tagsByCategory.get('Granice').get('Granica ciągu'), 1);
  assert.equal(alternatives.tagsByCategory.get('Planimetria'), undefined);
  const branch = catalog.taskOptions({ category: 'Ciągi', subcategory: 'Rekurencja' });
  assert.equal(branch.total, 1);
  assert.equal(branch.tags.get('Monotoniczność ciągu'), 1);
  assert.equal(branch.categories.get('Ciągi'), 2);
  assert.equal(branch.tagsByCategory.get('Planimetria').get('Skala podobieństwa'), 1);
  database.close();
});

test('one-point tasks are excluded from search and retain a separate list and direct links', () => {
  const database = new SQL.Database();
  database.run(`CREATE TABLE zadania (id, numer, arkusz_id, arkusz, rok, miesiac, typ, formula, punkty,
    kategorie, tagi, polecenie, zrodlo_arkusz, strona_zadania);
    INSERT INTO zadania VALUES
      ('a', '1', '2018-05', 'Maj 2018', 2018, 5, 'glowny', 2015, 1, '["Ciągi"]', '["Rekurencja"]', 'Treść', '', 2),
      ('b', '2', '2018-05', 'Maj 2018', 2018, 5, 'glowny', 2015, 3, '["Ciągi"]', '["Granica ciągu"]', 'Treść', '', 3),
      ('c', '1', 'zbior', 'Zbiór', 2023, NULL, 'zbior', 2023, NULL, '["Ciągi"]', '[]', 'Treść', '', 3)`);
  const catalog = new Catalog(database, {});
  assert.deepEqual(catalog.tasks().tasks.map(task => task.id), ['c', 'b']);
  assert.equal(catalog.tasks({ category: 'Ciągi', tags: ['Rekurencja'] }).total, 0);
  assert.deepEqual(catalog.tasks({ onePoint: true }).tasks.map(task => task.id), ['a']);
  assert.deepEqual(catalog.tasks({ paper: '2018-05' }).tasks.map(task => task.id), ['b']);
  assert.deepEqual(catalog.tasks({ paper: '2018-05', onePoint: true }).tasks.map(task => task.id), ['a']);
  assert.equal(catalog.taskOptions().categories.get('Ciągi'), 2);
  assert.equal(catalog.taskOptions().tags.get('Rekurencja'), undefined);
  assert.equal(catalog.task('a').punkty, 1);
  assert.equal(catalog.papers().find(paper => paper.rok === 2018).points, 4);
  assert.equal(catalog.papers().find(paper => paper.rok === 2018).onePoint, 1);
  database.close();
});

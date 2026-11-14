import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import initSqlJs from 'sql.js';
import { Catalog } from '../docs/js/catalog.js';
import { buildProfiles, frequencies } from '../docs/js/generator.js';

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

test('catalog sorts exam dates before pagination while keeping question numbers in order', () => {
  const database = new SQL.Database();
  database.run(`CREATE TABLE zadania (id, numer, arkusz_id, arkusz, rok, miesiac, typ, formula, punkty,
    kategorie, tagi, polecenie, zrodlo_arkusz, strona_zadania);
    INSERT INTO zadania VALUES
      ('jun-2', '2', '2018-06', 'Czerwiec 2018', 2018, 6, 'dodatkowy', 2015, 3, '[]', '[]', 'Treść', '', 2),
      ('may-10', '10', '2018-05', 'Maj 2018', 2018, 5, 'glowny', 2015, 3, '[]', '[]', 'Treść', '', 6),
      ('recent-1', '1', '2026-05', 'Maj 2026', 2026, 5, 'glowny', 2023, 3, '[]', '[]', 'Treść', '', 2),
      ('may-2', '2', '2018-05', 'Maj 2018', 2018, 5, 'glowny', 2015, 3, '[]', '[]', 'Treść', '', 3)`);
  const catalog = new Catalog(database, {});
  assert.deepEqual(catalog.tasks({ size: 2 }).tasks.map(task => task.id), ['recent-1', 'jun-2']);
  assert.deepEqual(catalog.tasks({ sort: 'najstarsze', size: 2 }).tasks.map(task => task.id), ['may-2', 'may-10']);
  assert.deepEqual(catalog.tasks({ sort: 'najstarsze', size: 2, page: 2 }).tasks.map(task => task.id), ['jun-2', 'recent-1']);
  assert.deepEqual(catalog.papers({ kind: 'glowny', sort: 'najstarsze' }).map(paper => paper.arkusz_id), ['2018-05', '2026-05']);
  assert.deepEqual(catalog.papers({ year: 2018, sort: 'najstarsze' }).map(paper => paper.arkusz_id), ['2018-05', '2018-06']);
  database.close();
});

test('published geometry categories describe the question and tags describe the work in each part', async () => {
  const database = new SQL.Database(await readFile(new URL('../docs/data/zadania.sqlite', import.meta.url)));
  const catalog = new Catalog(database, {});
  const triangle = catalog.task('2023-05-5');
  assert.deepEqual(triangle.kategorie, ['Planimetria']);
  assert.ok(triangle.tagi.includes('Odległość punktu od prostej'));
  assert.deepEqual(catalog.task('2026-06-12').kategorie, ['Geometria przestrzenna']);
  const rightTriangle = 'Własności trójkąta prostokątnego';
  assert.ok(catalog.task('2026-06-13.1').tagi.includes(rightTriangle));
  const optimization = catalog.task('2026-06-13.2');
  assert.deepEqual(optimization.kategorie, ['Optymalizacja funkcji']);
  assert.ok(!optimization.tagi.includes(rightTriangle));
  assert.ok(optimization.tagi.includes('Pochodna funkcji wymiernej'));
  const trapezoid = catalog.task('2018-05-15');
  assert.deepEqual(trapezoid.kategorie, ['Optymalizacja funkcji']);
  assert.ok(trapezoid.tagi.includes('Okrąg wpisany w czworokąt'));
  database.close();
});

test('the June 2023 parts are independent catalog tasks and solid geometry appears in all eight 2023–2026 papers', async () => {
  const database = new SQL.Database(await readFile(new URL('../docs/data/zadania.sqlite', import.meta.url)));
  const catalog = new Catalog(database, {});
  const june = catalog.tasks({ paper: '2023-06' }).tasks.slice(-2);
  assert.deepEqual(june.map(({ numer, punkty, kategorie }) => [numer, punkty, kategorie]), [
    ['13a', 3, ['Geometria przestrzenna']], ['13b', 3, ['Optymalizacja funkcji']],
  ]);
  assert.equal(june[0].polecenie.split('\n\n')[0], june[1].polecenie.split('\n\n')[0]);
  assert.ok(june.every(task => task.polecenie.includes('[[rysunek:2023-06-13|')));
  assert.equal(catalog.papers({ year: 2023, kind: 'dodatkowy' })[0].points, 50);
  const profiles = buildProfiles(catalog.candidates().filter(task => task.rok >= 2023 && task.rok <= 2026));
  const category = 'Geometria przestrzenna';
  assert.equal(profiles.length, 8);
  assert.deepEqual(frequencies(profiles, [category]), [{ category, papers: 8, average: 11 / 8 }]);
  database.close();
});

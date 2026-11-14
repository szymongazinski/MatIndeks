import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProfiles, generatePaper, generatorAvailability } from '../docs/js/generator.js';
import { suggestTags } from '../docs/js/catalog.js';

const parameter = 'Równania kwadratowe z parametrem';
const plane = 'Planimetria';
const sequences = 'Ciągi';
const trigonometry = 'Równania trygonometryczne';
const analytical = 'Geometria analityczna';
const spatial = 'Geometria przestrzenna';
const optimization = 'Optymalizacja funkcji';
const combinatorics = 'Kombinatoryka';
const probability = 'Prawdopodobieństwo';
const proof = 'Dowodzenie równań / nierówności';
const divisibility = 'Dowodzenie podzielności';
const exponential = 'Funkcja wykładnicza';
const logarithm = 'Własności logarytmu';
const polynomial = 'Własności wielomianów';
const limits = 'Granice';
const tangent = 'Styczna do wykresu funkcji';
const viète = "Wzory Viete'a - manipulacja rozkładem miejsc zerowych";
const similarity = 'Podobieństwo trójkątów';

function task(id, year, paper, category, points, tags = [], extra = {}) {
  return { id, rok: year, arkusz_id: paper, arkusz: paper, typ: 'glowny', formula: 2023,
    kategorie: [category], punkty: points, tagi: tags, ...extra };
}

const tasks = [
  task('a1', 2025, 'maj 2025', parameter, 20, [viète]),
  task('a2', 2025, 'maj 2025', plane, 30, [similarity]),
  task('b1', 2026, 'maj 2026', parameter, 30, [viète]),
  task('b2', 2026, 'maj 2026', sequences, 20),
  task('b3', 2026, 'próba 2026', plane, 20, [similarity, viète], { typ: 'diagnostyczny' }),
  task('c1', 2018, 'maj 2018', sequences, 50, [], { formula: 2015 }),
  task('d1', 2026, 'zbiór', plane, null, [similarity], { typ: 'zbior' }),
];

const mandatory = [parameter, sequences, trigonometry, analytical, spatial, optimization];
const papersPool = [...mandatory, plane, plane, plane, combinatorics, probability, proof, divisibility,
  exponential, logarithm, polynomial, limits, tangent, 'Różne', 'Równania / nierówności z wartością bezwzględną']
  .map((category, index) => task(String(index), 2026, 'próba 2026', category, 5));

test('the usual draw follows fixed topic quotas in the absence of any complete exam paper', () => {
  const result = generatePaper(papersPool, { random: () => .5 });
  const categories = result.tasks.map(item => item.kategorie[0]);
  for (const category of mandatory) assert.equal(categories.filter(value => value === category).length, 1);
  assert.equal(categories.filter(value => value === plane).length, 2);
  assert.equal(categories.filter(value => [combinatorics, probability].includes(value)).length, 1);
  assert.equal(categories.filter(value => [proof, divisibility].includes(value)).length, 1);
  assert.equal(categories.filter(value => [exponential, logarithm, polynomial, limits, tangent].includes(value)).length, 2);
  assert.equal(categories.length, 12);
  assert.deepEqual(result.missing, []);
});

test('profiles use complete main and additional papers in the latest supported formula', () => {
  const profiles = buildProfiles(tasks);
  assert.deepEqual(profiles.map(profile => profile.label), ['maj 2025', 'maj 2026']);
  assert.ok(profiles.every(profile => profile.categories.includes(parameter)));
});

test('year selection keeps required topics and caps the optional quotas to what the pool offers', () => {
  const restricted = papersPool.filter(item => item.id !== '8' && item.kategorie[0] !== tangent
    && item.kategorie[0] !== limits && item.kategorie[0] !== logarithm
    && ![proof, divisibility].includes(item.kategorie[0]));
  const older = papersPool.map(item => ({ ...item, id: 'old-' + item.id, rok: 2025 }));
  const result = generatePaper([...restricted, ...older], { years: [2026], random: () => .99 });
  assert.ok(result.tasks.every(item => item.rok === 2026));
  assert.equal(result.tasks.filter(item => item.kategorie[0] === plane).length, 2);
  assert.equal(result.tasks.filter(item => [exponential, polynomial].includes(item.kategorie[0])).length, 2);
  assert.deepEqual(result.missing, []);
});

test('required slots remain missing when they only occur among secondary categories', () => {
  const candidates = papersPool
    .filter(item => item.kategorie[0] !== sequences && !['7', '8'].includes(item.id));
  candidates.push(task('duplicate-type', 2026, 'próba', parameter, 5, [], { kategorie: [parameter, sequences, plane] }));
  const result = generatePaper(candidates, { random: () => .99 });
  assert.equal(result.tasks.filter(item => item.kategorie[0] === parameter).length, 1);
  assert.equal(result.tasks.filter(item => item.kategorie[0] === plane).length, 1);
  assert.deepEqual(result.missing, [sequences, plane]);
  const availability = generatorAvailability(candidates, {}, { years: [2026], tags: [] });
  assert.deepEqual(availability.missingRequired, [sequences, plane]);
});

test('the minimum draw has no short questions and the largest has three distinct short categories', () => {
  const minimal = generatePaper(papersPool, { random: () => 0 });
  assert.equal(minimal.tasks.filter(item => [exponential, logarithm, polynomial, limits, tangent].includes(item.kategorie[0])).length, 0);
  assert.equal(minimal.tasks.filter(item => item.kategorie[0] === plane).length, 2);
  const poolWithExtraLogarithms = [...papersPool, ...Array.from({ length: 4 }, (_, index) =>
    task('log-' + index, 2026, 'próba', logarithm, 5))];
  const large = generatePaper(poolWithExtraLogarithms, { random: () => .99 });
  const short = large.tasks.filter(item => [exponential, logarithm, polynomial, limits, tangent].includes(item.kategorie[0]));
  assert.equal(short.length, 3);
  assert.equal(new Set(short.map(item => item.kategorie[0])).size, 3);
  assert.equal(large.tasks.filter(item => item.kategorie[0] === plane).length, 3);
  assert.equal(large.tasks.filter(item => [proof, divisibility].includes(item.kategorie[0])).length, 0);
});

test('point selection finds an exact 50 and varies the task set across equally suitable choices', () => {
  const pool = papersPool.map(item => ({ ...item, punkty: 4 }));
  pool.push(task('parameter-a', 2026, 'próba', parameter, 6),
    task('parameter-b', 2026, 'próba', parameter, 6));
  const makeRandom = seed => {
    let calls = 0;
    return () => {
      if (calls++ < 3) return .5; // Same quotas for both runs.
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
  };
  const results = Array.from({ length: 8 }, (_, index) => generatePaper(pool, { random: makeRandom(index + 1) }));
  assert.ok(results.every(result => result.points === 50 && result.tasks.length === 12));
  assert.deepEqual(new Set(results.map(result => result.tasks.find(item => item.kategorie[0] === parameter).id)),
    new Set(['parameter-a', 'parameter-b']));
  const withoutExact = generatePaper(papersPool.map(item => ({ ...item, punkty: 4 })), { random: () => .5 });
  assert.equal(withoutExact.points, 48);
});

test('tag filters use all requested and none excluded, with a uniform sample without replacement', () => {
  const filtered = generatePaper(tasks, { include: [viète], exclude: [similarity], size: 10, random: () => 0 });
  assert.equal(filtered.mode, 'tags');
  assert.deepEqual(new Set(filtered.tasks.map(item => item.id)), new Set(['a1', 'b1']));
  assert.equal(filtered.requested, 10);
  const all = generatePaper(tasks, { include: [viète, similarity], years: [2026], random: () => 0 });
  assert.deepEqual(all.tasks.map(item => item.id), ['b3']);
});

test('autocomplete matches Polish letters even when they were typed without accents', () => {
  assert.deepEqual(suggestTags([similarity, viète, parameter], 'rownania kwad', []), [parameter]);
  assert.deepEqual(suggestTags([similarity, parameter], '', [similarity]), [parameter]);
});

test('available generator filters reflect the proposed selection and preserve a nonempty pool', () => {
  const options = generatorAvailability(tasks, { years: [2025, 2026], include: [viète], exclude: [similarity] },
    { years: [2025, 2026, 2018], tags: [viète, similarity] });
  assert.equal(options.total, 2);
  assert.equal(options.includeCounts.get(similarity), 0);
  assert.equal(options.excludeCounts.get(viète), 0);
  const narrowed = generatorAvailability(tasks, { years: [2018, 2026], include: [viète], exclude: [] },
    { years: [2026, 2018, 2025], tags: [viète, similarity] });
  assert.equal(narrowed.yearCounts.get(2026), 0);
  assert.equal(narrowed.yearCounts.get(2018), 2);
  assert.equal(narrowed.yearCounts.get(2025), 3);
  assert.equal(narrowed.includeCounts.get(similarity), 1);
  assert.equal(narrowed.excludeCounts.get(similarity), 1);
});

test('balanced availability counts only rule-eligible tasks but still suggests tags from the full pool', () => {
  const candidates = [...papersPool, task('other', 2025, 'próba', 'Różne', 2, [similarity])];
  const taxonomy = { years: [2025, 2026], tags: [similarity] };
  const all = generatorAvailability(candidates, {}, taxonomy);
  assert.equal(all.total, 18);
  assert.equal(all.yearCounts.get(2025), 0);
  assert.equal(all.includeCounts.get(similarity), 1);
  assert.deepEqual(all.missingRequired, []);
  const narrowed = generatorAvailability(candidates, { years: [2025] }, taxonomy);
  assert.equal(narrowed.total, 0);
  assert.equal(narrowed.yearCounts.get(2025), 18);
  assert.ok(narrowed.missingRequired.includes('Kombinatoryka lub Prawdopodobieństwo'));
  assert.equal(narrowed.missingRequired.filter(category => category === plane).length, 2);
  assert.equal(narrowed.includeCounts.get(similarity), 1);
});

test('identical problems across known papers are counted once in tagged and balanced pools', () => {
  const copies = [
    task('2019-06-6', 2019, '2019-06', combinatorics, 2, [viète], { numer: '6', polecenie: 'Sformułowanie A' }),
    task('2020-07-13', 2020, '2020-07', combinatorics, 4, [viète], { numer: '13', polecenie: 'Sformułowanie B' }),
    task('2018-06-8', 2018, '2018-06', plane, 3, [viète], { numer: '8', polecenie: 'Sformułowanie C' }),
    task('2020-04-8', 2020, '2020-04', plane, 3, [viète], { numer: '8', polecenie: 'Sformułowanie D' }),
  ];
  const tagged = generatePaper(copies, { include: [viète], random: () => 0 });
  assert.equal(tagged.tasks.length, 2);
  const balanced = generatePaper(copies, { random: () => .99 });
  assert.equal(balanced.tasks.filter(item => item.kategorie[0] === plane).length, 1);
  assert.equal(balanced.missing.filter(category => category === plane).length, 1);
  const options = generatorAvailability(copies, {}, { years: [2018, 2019, 2020], tags: [viète] });
  assert.equal(options.total, 2);
  assert.equal(options.includeCounts.get(viète), 2);
});

test('one-point tasks contribute to neither generator mode, tag availability nor topic slots', () => {
  const items = [
    task('abcd', 2018, 'maj 2018', plane, 1, [similarity], { formula: 2015 }),
    task('open', 2018, 'maj 2018', parameter, 49, [viète], { formula: 2015 }),
  ];
  const profiles = buildProfiles(items);
  assert.deepEqual(profiles[0].categories, [parameter]);
  assert.equal(profiles[0].points, 49);
  const options = generatorAvailability(items, {}, { years: [2018], tags: [similarity, viète] });
  assert.equal(options.total, 1);
  assert.equal(options.includeCounts.get(similarity), 0);
  assert.deepEqual(generatePaper(items, { include: [similarity] }).tasks, []);
  assert.deepEqual(generatePaper(items, { exclude: [viète] }).tasks, []);
  assert.deepEqual(generatePaper(items, { random: () => 0 }).tasks.map(task => task.id), ['open']);
});

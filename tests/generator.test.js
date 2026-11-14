import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProfiles, generatePaper, generatorAvailability } from '../docs/js/generator.js';
import { suggestTags } from '../docs/js/catalog.js';

const parameter = 'Równania kwadratowe z parametrem';
const plane = 'Planimetria';
const sequences = 'Ciągi';
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

test('profiles use complete main and additional papers in the latest supported formula', () => {
  const profiles = buildProfiles(tasks);
  assert.deepEqual(profiles.map(profile => profile.label), ['maj 2025', 'maj 2026']);
  assert.ok(profiles.every(profile => profile.categories.includes(parameter)));
});

test('year selection preserves sampled topic slots and still targets the original point total', () => {
  const result = generatePaper(tasks, buildProfiles(tasks), { years: [2026], random: () => 0 });
  assert.deepEqual(result.tasks.map(item => item.id), ['b1', 'b3']);
  assert.equal(result.points, 50);
  assert.deepEqual(result.missing, []);
  assert.equal(result.profile.label, 'maj 2025');
});

test('year filters with no eligible topic explicitly report the unfilled slots', () => {
  const result = generatePaper(tasks, buildProfiles(tasks), { years: [2018], random: () => 0 });
  assert.deepEqual(result.tasks, []);
  assert.deepEqual(result.missing, [parameter, plane]);
});

test('multi-category matching preserves a rare task for the slot that needs it', () => {
  const candidates = [
    task('both', 2026, 'próba', parameter, 20, [], { kategorie: [parameter, plane] }),
    task('alone', 2026, 'próba', parameter, 30),
  ];
  const result = generatePaper(candidates, buildProfiles(tasks), { random: () => 0 });
  assert.deepEqual(result.tasks.map(item => item.id), ['alone', 'both']);
  assert.deepEqual(result.missing, []);
});

test('tag filters use all requested and none excluded, with a uniform sample without replacement', () => {
  const profiles = buildProfiles(tasks);
  const filtered = generatePaper(tasks, profiles, { include: [viète], exclude: [similarity], size: 10, random: () => 0 });
  assert.equal(filtered.mode, 'tags');
  assert.deepEqual(new Set(filtered.tasks.map(item => item.id)), new Set(['a1', 'b1']));
  assert.equal(filtered.requested, 10);
  const all = generatePaper(tasks, profiles, { include: [viète, similarity], years: [2026], random: () => 0 });
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

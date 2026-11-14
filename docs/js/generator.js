import { compatibleMinimum, drawCompatiblePaper, findRepeatableTags } from './paper-constraints.js';

const examTypes = new Set(['glowny', 'dodatkowy']);
const eligible = task => task.punkty !== 1;

export const balancedRules = {
  required: ['Równania kwadratowe z parametrem', 'Ciągi', 'Równania trygonometryczne',
    'Geometria analityczna', 'Geometria przestrzenna', 'Optymalizacja funkcji'],
  plane: { category: 'Planimetria', weights: { 2: 85, 3: 15 } },
  choice: ['Kombinatoryka', 'Prawdopodobieństwo'],
  proof: { categories: ['Dowodzenie równań / nierówności', 'Dowodzenie podzielności'], chance: .65 },
  short: {
    categories: ['Funkcja wykładnicza', 'Własności logarytmu', 'Własności wielomianów',
      'Granice', 'Styczna do wykresu funkcji'],
    weights: { 0: 10, 1: 15, 2: 60, 3: 15 },
  },
  targetPoints: 50,
};

const { required, plane, choice, proof, short, targetPoints } = balancedRules;
const balancedCategories = new Set([...required, plane.category, ...choice, ...proof.categories, ...short.categories]);
const balancedCandidate = task => task.punkty > 1 && balancedCategories.has(task.kategorie[0]);

function groupBy(items, getKey) {
  const groups = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

export function buildProfiles(tasks) {
  const groups = groupBy(tasks.filter(task => examTypes.has(task.typ)), task => task.arkusz_id);
  const profiles = [];
  for (const [id, group] of groups) {
    const selected = group.filter(eligible);
    if (!selected.length || !selected.every(task => task.punkty > 0 && task.kategorie.length)) continue;
    if (group.reduce((total, task) => total + task.punkty, 0) !== 50) continue;
    const points = selected.reduce((total, task) => total + task.punkty, 0);
    const categories = selected.map(task => task.kategorie[0]);
    profiles.push({ id, label: group[0].arkusz, formula: group[0].formula, points,
      categories, pointValues: selected.map(task => task.punkty) });
  }
  const newest = Math.max(...profiles.map(profile => profile.formula));
  const current = profiles.filter(profile => profile.formula === newest);
  return current.length >= 2 ? current : profiles;
}

export function frequencies(profiles, categories) {
  return categories.map(category => {
    const counts = profiles.map(profile => profile.categories.filter(value => value === category).length);
    return {
      category,
      papers: counts.filter(Boolean).length,
      average: profiles.length ? counts.reduce((total, count) => total + count, 0) / profiles.length : 0,
    };
  });
}

function shuffled(values, random) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function problemKey(task) {
  if (task.numer != null && ['2018-06', '2020-04'].includes(task.arkusz_id)) return 'repeated:' + task.numer;
  if (task.id === '2020-07-13' || task.id === '2019-06-6') return 'repeated:2019-06-6';
  const text = task.polecenie?.replace(/\s+/g, ' ').trim();
  return text && text !== '[[zrodlo]]' ? 'text:' + text : 'id:' + task.id;
}

function uniqueProblems(tasks) {
  const seen = new Set();
  return tasks.filter(task => {
    const key = problemKey(task);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const matchesTags = (task, include, exclude) => include.every(tag => task.tagi.includes(tag))
  && exclude.every(tag => !task.tagi.includes(tag));

const withoutTags = (tasks, exclude) => exclude.length ? tasks.filter(task => matchesTags(task, [], exclude)) : tasks;

function fromYears(tasks, years) {
  const selected = new Set(years);
  return selected.size ? tasks.filter(task => selected.has(task.rok)) : tasks;
}

function fromCategories(tasks, categories) {
  const selected = new Set(categories);
  return tasks.filter(task => task.kategorie.some(category => selected.has(category)));
}

function balancedScope(tasks, years, latestFormulaOnly) {
  const formula = latestFormulaOnly ? Math.max(...tasks.map(task => task.formula)) : null;
  const matching = latestFormulaOnly ? tasks.filter(task => task.formula === formula && task.rok >= formula) : tasks;
  const allowedYears = latestFormulaOnly ? new Set(matching.map(task => task.rok)) : null;
  return {
    candidates: matching.filter(balancedCandidate),
    years: allowedYears ? years.filter(year => allowedYears.has(year)) : years,
    allowedYears,
  };
}

function requiredGroups(byCategory) {
  const categories = required.map(label => ({ label, count: 1, tasks: byCategory.get(label) ?? [] }));
  const planar = { label: plane.category, count: 2, tasks: byCategory.get(plane.category) ?? [] };
  const joint = { label: choice.join(' lub '), count: 1, tasks: choice.flatMap(label => byCategory.get(label) ?? []) };
  return [...categories, planar, joint];
}

function unfilled(groups) {
  return groups.flatMap(({ label, count, tasks }) => Array(Math.max(0, count - tasks.length)).fill(label));
}

function balancedLayout(pool) {
  const byCategory = groupBy(uniqueProblems(pool), task => task.kategorie[0]);
  return {
    groups: requiredGroups(byCategory),
    proofs: proof.categories.flatMap(label => byCategory.get(label) ?? []),
    shortCandidates: short.categories.map(label => byCategory.get(label)).filter(Boolean),
  };
}

function weightOptions(weights, limit) {
  return Object.entries(weights).map(([count, weight]) => [Number(count), weight])
    .filter(([count, weight]) => count <= limit && weight > 0);
}

function quotaOptions({ groups, proofs, shortCandidates }, random) {
  const ordered = values => random ? shuffled(values, random) : values;
  const singles = tasks => ordered(tasks).map(task => [task]);
  return [
    ...groups.map(({ tasks, count, label }) => ({
      candidates: singles(tasks),
      weights: label === plane.category ? weightOptions(plane.weights, tasks.length) : [[count, 1]],
    })),
    { candidates: singles(proofs), weights: weightOptions({ 0: 1 - proof.chance, 1: proof.chance }, proofs.length) },
    { candidates: ordered(shortCandidates).map(ordered), weights: weightOptions(short.weights, shortCandidates.length) },
  ];
}

function toggled(selection, value) {
  return selection.includes(value) ? selection.filter(item => item !== value) : [...selection, value];
}

function countsBy(values, count = () => 0) {
  return new Map(values.map(value => [value, count(value)]));
}

export function generatorAvailability(tasks, {
  mode = 'balanced', years = [], latestFormulaOnly = false, categories = [], include = [], exclude = [], limitTags = [],
} = {}, { years: allYears = [], tags = [], categories: allCategories = [] } = {}) {
  const keys = new Map(tasks.map(task => [task.id, problemKey(task)]));
  const count = rows => new Set(rows.map(task => keys.get(task.id))).size;
  if (mode === 'categories') {
    const candidates = tasks.filter(eligible);
    const matching = candidates.filter(task => matchesTags(task, include, exclude));
    const selected = fromCategories(matching, categories);
    return {
      total: count(selected),
      missingRequired: [],
      categoryTags: new Set(fromCategories(candidates, categories).flatMap(task => task.tagi)),
      categoryCounts: countsBy(allCategories, category => count(fromCategories(matching, toggled(categories, category)))),
      includeCounts: countsBy(tags, tag => count(selected.filter(task => task.tagi.includes(tag)))),
      excludeCounts: countsBy(tags, tag => count(selected.filter(task => !task.tagi.includes(tag)))),
      yearCounts: countsBy(allYears),
    };
  }

  const latest = balancedScope(tasks, years, true);
  const { candidates, years: selectedYears, allowedYears } = latestFormulaOnly ? latest : balancedScope(tasks, years, false);
  const constrained = exclude.length > 0 || limitTags.length > 0;
  const matching = withoutTags(candidates, exclude);
  const selected = fromYears(matching, selectedYears);
  const layout = balancedLayout(selected);
  const missingRequired = unfilled(layout.groups);
  const complete = !missingRequired.length && compatibleMinimum(layout.groups, limitTags);
  const canDraw = (pool, limits = limitTags) => {
    const groups = requiredGroups(groupBy(uniqueProblems(pool), task => task.kategorie[0]));
    return !unfilled(groups).length && compatibleMinimum(groups, limits);
  };
  const tagCounts = new Map();
  for (const task of uniqueProblems(selected)) {
    for (const tag of task.tagi) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const potentialRepeats = tags.filter(tag => tagCounts.get(tag) > 1 && !limitTags.includes(tag));
  const repeatableTags = complete ? findRepeatableTags(quotaOptions(layout), limitTags, targetPoints, potentialRepeats) : new Set();
  const latestCandidates = fromYears(withoutTags(latest.candidates, exclude), latest.years);
  return {
    total: count(selected),
    missingRequired,
    blockedByTags: !missingRequired.length && !complete,
    latestFormulaYears: latest.allowedYears,
    latestFormulaAvailable: !constrained || canDraw(latestCandidates),
    balancedTags: new Set(tagCounts.keys()),
    repeatableTags,
    categoryTags: new Set(),
    categoryCounts: countsBy(allCategories),
    includeCounts: countsBy(tags),
    excludeCounts: countsBy(tags, tag => {
      if (!tagCounts.has(tag)) return 0;
      const pool = withoutTags(selected, [tag]);
      return canDraw(pool) ? count(pool) : 0;
    }),
    limitCounts: countsBy(tags, tag => repeatableTags.has(tag) && canDraw(selected, [...limitTags, tag]) ? tagCounts.get(tag) : 0),
    yearCounts: countsBy(allYears, year => {
      if (allowedYears && !allowedYears.has(year)) return 0;
      const pool = fromYears(matching, toggled(selectedYears, year));
      return !constrained || canDraw(pool) ? count(pool) : 0;
    }),
  };
}

function weightedCount(weights, limit, random) {
  const possible = weightOptions(weights, limit);
  if (!possible.length) return 0;
  let ticket = random() * possible.reduce((total, [, weight]) => total + weight, 0);
  for (const [count, weight] of possible) {
    ticket -= weight;
    if (ticket < 0) return count;
  }
  return possible.at(-1)[0];
}

function choicesByPoints(candidateGroups, countNeeded) {
  const byCount = Array.from({ length: countNeeded + 1 }, () => new Map());
  byCount[0].set(0, []);
  for (const candidates of candidateGroups) {
    for (let count = countNeeded; count > 0; count--) {
      for (const [points, chosen] of byCount[count - 1]) {
        for (const task of candidates) {
          const total = points + task.punkty;
          if (!byCount[count].has(total)) byCount[count].set(total, [...chosen, task]);
        }
      }
    }
  }
  return byCount[countNeeded];
}

function chooseTasks(groups, random) {
  let choices = new Map([[0, []]]);
  for (const { candidates, count } of groups) {
    const next = new Map();
    for (const [points, selected] of choicesByPoints(candidates, count)) {
      for (const [previous, groups] of choices) {
        const total = points + previous;
        if (!next.has(total)) next.set(total, [...groups, ...selected]);
      }
    }
    choices = next;
  }
  const totals = [...choices.keys()];
  const distance = Math.min(...totals.map(points => Math.abs(points - targetPoints)));
  const closest = totals.filter(points => Math.abs(points - targetPoints) === distance);
  const points = closest[Math.floor(random() * closest.length)];
  return { tasks: choices.get(points), points };
}

function drawBalanced(pool, limitTags, random) {
  const layout = balancedLayout(pool);
  const { groups, proofs, shortCandidates } = layout;
  const missing = unfilled(groups);
  if (limitTags.length) {
    const result = !missing.length && compatibleMinimum(groups, limitTags)
      ? drawCompatiblePaper(quotaOptions(layout, random), limitTags, targetPoints, random) : null;
    return { mode: 'balanced', ...(result ?? { tasks: [], points: 0 }), missing, blockedByTags: !missing.length && !result };
  }
  const planimetry = groups.find(group => group.label === plane.category);
  planimetry.count = weightedCount(plane.weights, planimetry.tasks.length, random) || planimetry.count;
  const shortCount = weightedCount(short.weights, shortCandidates.length, random);
  const includeProof = random() < proof.chance;

  const selections = groups.map(({ tasks, count }) => ({
    count: Math.min(count, tasks.length),
    candidates: shuffled(tasks, random).map(task => [task]),
  }));
  if (includeProof && proofs.length) selections.push({ count: 1, candidates: shuffled(proofs, random).map(task => [task]) });
  if (shortCount) selections.push({
    count: shortCount,
    candidates: shuffled(shortCandidates, random).map(tasks => shuffled(tasks, random)),
  });
  return { mode: 'balanced', ...chooseTasks(selections, random), missing };
}

export function generatePaper(tasks, {
  mode = 'balanced', years = [], latestFormulaOnly = false, categories = [], include = [], exclude = [],
  limitTags = [], size, random = Math.random,
} = {}) {
  if (mode === 'categories') {
    const pool = fromCategories(tasks, categories).filter(task => eligible(task) && matchesTags(task, include, exclude));
    const requested = Number.isInteger(size) && size >= 1 ? size : 12;
    const chosen = shuffled(uniqueProblems(pool), random).slice(0, requested);
    return { mode: 'categories', tasks: chosen, requested,
      points: chosen.every(task => task.punkty != null) ? chosen.reduce((sum, task) => sum + task.punkty, 0) : null };
  }

  const { candidates, years: selectedYears } = balancedScope(tasks, years, latestFormulaOnly);
  return drawBalanced(withoutTags(fromYears(candidates, selectedYears), exclude), limitTags, random);
}

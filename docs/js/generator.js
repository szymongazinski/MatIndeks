const examTypes = new Set(['glowny', 'dodatkowy']);
const eligible = task => task.punkty !== 1;

// Topics explicitly asked about in a subpart that CKE scores as part of a larger task.
const examSubpartTopics = new Map([
  ['2023-06-13', ['Geometria przestrzenna']], // Part a) asks for the prism's volume as a function of its height.
]);

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
    const categories = selected.flatMap(task =>
      [...new Set([task.kategorie[0], ...(examSubpartTopics.get(task.id) ?? [])])]);
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

function fromYears(tasks, years) {
  const selected = new Set(years);
  return selected.size ? tasks.filter(task => selected.has(task.rok)) : tasks;
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

export function generatorAvailability(tasks, { years = [], include = [], exclude = [] }, taxonomy) {
  const tagsActive = include.length || exclude.length;
  const matching = tasks.filter(task => eligible(task) && matchesTags(task, include, exclude));
  const taggedScope = fromYears(matching, years);
  const candidates = tagsActive ? matching : matching.filter(balancedCandidate);
  const keys = new Map(matching.map(task => [task.id, problemKey(task)]));
  const count = rows => new Set(rows.map(task => keys.get(task.id))).size;
  const yearCounts = new Map(taxonomy.years.map(year => {
    const nextYears = years.includes(year) ? years.filter(value => value !== year) : [...years, year];
    return [year, count(fromYears(candidates, nextYears))];
  }));
  const includeCounts = new Map();
  const excludeCounts = new Map();
  for (const tag of taxonomy.tags) {
    includeCounts.set(tag, count(taggedScope.filter(task => task.tagi.includes(tag))));
    excludeCounts.set(tag, count(taggedScope.filter(task => !task.tagi.includes(tag))));
  }
  const selected = fromYears(candidates, years);
  const missingRequired = tagsActive ? [] : unfilled(requiredGroups(groupBy(uniqueProblems(selected), task => task.kategorie[0])));
  return { yearCounts, includeCounts, excludeCounts, total: count(selected), missingRequired };
}

function weightedCount(weights, limit, random) {
  const possible = Object.entries(weights).map(([count, weight]) => [Number(count), weight])
    .filter(([count]) => count <= limit);
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

function drawBalanced(pool, random) {
  const byCategory = groupBy(uniqueProblems(pool.filter(balancedCandidate)), task => task.kategorie[0]);
  const groups = requiredGroups(byCategory);
  const missing = unfilled(groups);
  const planimetry = groups.find(group => group.label === plane.category);
  planimetry.count = weightedCount(plane.weights, planimetry.tasks.length, random) || planimetry.count;
  const shortCandidates = short.categories.map(label => byCategory.get(label)).filter(Boolean);
  const shortCount = weightedCount(short.weights, shortCandidates.length, random);
  const includeProof = random() < proof.chance;
  const proofs = proof.categories.flatMap(label => byCategory.get(label) ?? []);

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

export function generatePaper(tasks, { years = [], include = [], exclude = [], size, random = Math.random } = {}) {
  const pool = fromYears(tasks, years).filter(task => eligible(task) && matchesTags(task, include, exclude));
  if (include.length || exclude.length) {
    const requested = Number.isInteger(size) && size >= 1 ? size : 12;
    const chosen = shuffled(uniqueProblems(pool), random).slice(0, requested);
    return { mode: 'tags', tasks: chosen, requested,
      points: chosen.every(task => task.punkty != null) ? chosen.reduce((sum, task) => sum + task.punkty, 0) : null };
  }

  return drawBalanced(pool, random);
}

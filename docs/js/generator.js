const examTypes = new Set(['glowny', 'dodatkowy']);

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
    if (!group.every(task => task.punkty > 0 && task.kategorie.length)) continue;
    const points = group.reduce((total, task) => total + task.punkty, 0);
    if (points !== 50) continue;
    profiles.push({ id, label: group[0].arkusz, formula: group[0].formula, points,
      categories: group.map(task => task.kategorie[0]), pointValues: group.map(task => task.punkty) });
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

export function generatorAvailability(tasks, { years = [], include = [], exclude = [] }, taxonomy) {
  const tagsActive = include.length || exclude.length;
  const matching = tasks.filter(task => matchesTags(task, include, exclude));
  const taggedScope = fromYears(matching, years);
  const candidates = tagsActive ? matching : matching.filter(task => task.punkty > 0);
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
  return { yearCounts, includeCounts, excludeCounts, total: count(fromYears(candidates, years)) };
}

function choicesByPoints(tasks, required) {
  const byCount = Array.from({ length: required + 1 }, () => new Map());
  byCount[0].set(0, []);
  for (const task of tasks) {
    for (let count = required; count > 0; count--) {
      for (const [points, chosen] of byCount[count - 1]) {
        const total = points + task.punkty;
        if (!byCount[count].has(total)) byCount[count].set(total, [...chosen, task]);
      }
    }
  }
  return byCount[required];
}

function matchPrimary(profile, pool) {
  const byCategory = groupBy(pool, task => task.kategorie[0]);
  const requirements = groupBy(profile.categories, category => category);
  for (const [category, entries] of requirements) {
    if ((byCategory.get(category)?.length ?? 0) < entries.length) return null;
  }

  let choices = new Map([[0, []]]);
  for (const [category, entries] of requirements) {
    const next = new Map();
    for (const [points, selected] of choicesByPoints(byCategory.get(category), entries.length)) {
      for (const [previous, groups] of choices) {
        const total = points + previous;
        if (!next.has(total)) next.set(total, [...groups, [category, selected]]);
      }
    }
    choices = next;
  }
  const closest = [...choices.keys()].sort((left, right) =>
    Math.abs(left - profile.points) - Math.abs(right - profile.points))[0];
  const selection = new Map(choices.get(closest));
  return profile.categories.map(category => selection.get(category).shift());
}

function matchAnyCategory(profile, pool) {
  const options = profile.categories.map((category, index) => {
    const target = profile.pointValues[index];
    return pool.filter(task => task.kategorie.includes(category)).sort((left, right) =>
      Number(left.kategorie[0] !== category) - Number(right.kategorie[0] !== category)
      || Math.abs(left.punkty - target) - Math.abs(right.punkty - target));
  });
  const assignment = new Map();
  const selection = new Array(options.length).fill(null);

  function assign(index, tried) {
    for (const task of options[index]) {
      if (tried.has(task.id)) continue;
      tried.add(task.id);
      const previous = assignment.get(task.id);
      if (previous !== undefined && !assign(previous, tried)) continue;
      assignment.set(task.id, index);
      selection[index] = task;
      return true;
    }
    return false;
  }

  const order = [...options.keys()].sort((left, right) => options[left].length - options[right].length);
  for (const index of order) assign(index, new Set());
  return selection;
}

export function generatePaper(tasks, profiles, { years = [], include = [], exclude = [], size, random = Math.random } = {}) {
  const pool = fromYears(tasks, years).filter(task => matchesTags(task, include, exclude));
  if (include.length || exclude.length) {
    const requested = Number.isInteger(size) && size >= 1 ? size : 12;
    const chosen = shuffled(uniqueProblems(pool), random).slice(0, requested);
    return { mode: 'tags', tasks: chosen, requested,
      points: chosen.every(task => task.punkty != null) ? chosen.reduce((sum, task) => sum + task.punkty, 0) : null };
  }

  const profile = profiles[Math.floor(random() * profiles.length)];
  if (!profile) return { mode: 'balanced', tasks: [], missing: [], profile: null };
  const scored = shuffled(uniqueProblems(pool.filter(task => task.punkty > 0)), random);
  const selection = matchPrimary(profile, scored) ?? matchAnyCategory(profile, scored);
  const chosen = selection.filter(Boolean);
  return { mode: 'balanced', tasks: chosen, profile,
    secondary: selection.some((task, index) => task && task.kategorie[0] !== profile.categories[index]),
    missing: profile.categories.filter((_, index) => !selection[index]),
    points: chosen.reduce((sum, task) => sum + task.punkty, 0) };
}

function tagBits(tags) {
  return new Map([...new Set(tags)].map((tag, index) => [tag, 1n << BigInt(index)]));
}

function tagMask(tags, bits) {
  return tags.reduce((mask, tag) => mask | (bits.get(tag) ?? 0n), 0n);
}

// Compatibility needs only the mandatory slots. The optional slots all allow zero.
export function compatibleMinimum(groups, limits) {
  if (!limits.length) return true;
  const bits = tagBits(limits);
  const choices = groups.map(({ tasks, count }) => {
    const masks = tasks.map(task => tagMask(task.tagi, bits));
    if (masks.filter(mask => mask === 0n).length >= count) return [0n];
    const available = new Set();
    for (const [index, left] of masks.entries()) {
      if (count === 1) {
        available.add(left);
        continue;
      }
      // The only mandatory group with multiple slots takes two distinct planar tasks.
      for (const right of masks.slice(index + 1)) {
        if (!(left & right)) available.add(left | right);
      }
    }
    const options = [...available];
    return options.filter(mask => !options.some(other => other !== mask && (other & mask) === other));
  }).sort((left, right) => left.length - right.length);
  const rejected = choices.map(() => new Set());
  function fill(index, used) {
    if (index === choices.length) return true;
    if (rejected[index].has(used)) return false;
    for (const mask of choices[index]) {
      if (!(used & mask) && fill(index + 1, used | mask)) return true;
    }
    rejected[index].add(used);
    return false;
  }
  return fill(0, 0n);
}

const empty = { points: 0, used: 0n, seen: 0n, repeated: 0n, tasks: [] };
const initial = () => new Map([['0/0', empty]]);

function addCombination(states, left, right, relevant, collect) {
  if (left.used & right.used) return;
  const points = left.points + right.points;
  const used = (left.used | right.used) & relevant;
  const key = points + '/' + used;
  const seen = left.seen | right.seen;
  const repeated = left.repeated | right.repeated | (left.seen & right.seen);
  const existing = states.get(key);
  if (existing) {
    // Each bit asks whether that tag occurs in any assignment represented by this state.
    existing.seen |= seen;
    existing.repeated |= repeated;
  } else {
    states.set(key, { points, used, seen, repeated, tasks: collect ? [...left.tasks, ...right.tasks] : [] });
  }
}

function groupChoices(candidates, weights, used, collect) {
  const max = Math.max(...weights.map(([count]) => count));
  const byCount = [initial(), ...Array.from({ length: max }, () => new Map())];
  for (const alternatives of candidates) {
    for (let count = max; count > 0; count--) {
      for (const left of byCount[count - 1].values()) {
        for (const right of alternatives) addCombination(byCount[count], left, right, used, collect);
      }
    }
  }
  return byCount;
}

function paperShapes(groups, limitTags, { track = [], collect = false } = {}) {
  const limited = tagBits(limitTags);
  const tracked = tagBits(track);
  const encoded = groups.map(({ candidates, weights }) => {
    let used = 0n;
    const choices = candidates.map(alternatives => alternatives.map(task => {
      const mask = tagMask(task.tagi, limited);
      used |= mask;
      return { points: task.punkty, used: mask, seen: tagMask(task.tagi, tracked), repeated: 0n, tasks: collect ? [task] : [] };
    }));
    return { used, weights, choices: groupChoices(choices, weights, used, collect) };
  });

  let shapes = [{ weight: 1, groups: [] }];
  for (const [index, group] of encoded.entries()) {
    let shared = 0n;
    for (const other of encoded) if (other !== group) shared |= other.used & group.used;
    const options = group.weights.flatMap(([count, weight]) => {
      const compact = new Map();
      // Limits exclusive to this group have already been checked within it.
      for (const choice of group.choices[count].values()) addCombination(compact, empty, choice, shared, collect);
      return compact.size ? [{ count, weight, choices: [...compact.values()] }] : [];
    });
    shapes = shapes.flatMap(shape => options.map(({ count, weight, choices }) => ({
      weight: shape.weight * weight,
      groups: count ? [...shape.groups, { index, choices, used: shared }] : shape.groups,
    })));
  }
  return shapes;
}

function occurrences(choice, bit) {
  if (choice.repeated & bit) return 2;
  return choice.seen & bit ? 1 : 0;
}

function prepareSearch(shape, bit = 0n) {
  const groups = shape.groups.map(group => ({
    ...group, tagged: bit !== 0n && group.choices.some(choice => choice.seen & bit),
  })).sort((left, right) => Number(right.tagged) - Number(left.tagged) || left.choices.length - right.choices.length);
  const masks = Array(groups.length + 1).fill(0n);
  for (let index = groups.length - 1; index >= 0; index--) masks[index] = masks[index + 1] | groups[index].used;
  return { ...shape, groups, masks };
}

function scoreBounds(groups, bit) {
  const suffix = Array.from({ length: groups.length + 1 }, () => new Map());
  suffix.at(-1).set(0, 0);
  for (let index = groups.length - 1; index >= 0; index--) {
    const counts = new Map();
    for (const choice of groups[index].choices) {
      counts.set(choice.points, Math.max(counts.get(choice.points) ?? 0, occurrences(choice, bit)));
    }
    for (const [points, count] of counts) {
      for (const [rest, more] of suffix[index + 1]) {
        const total = points + rest;
        suffix[index].set(total, Math.max(suffix[index].get(total) ?? 0, Math.min(2, count + more)));
      }
    }
  }
  return suffix;
}

function assignmentSearch({ groups, masks }, bit = 0n) {
  const bounds = scoreBounds(groups, bit);
  const failed = groups.map(() => new Set());
  function reach(index, points, used, needed, picked) {
    if ((bounds[index].get(points) ?? -1) < needed) return false;
    if (index === groups.length) return true;
    const key = points + '/' + used + '/' + needed;
    if (failed[index].has(key)) return false;
    const { choices } = groups[index];
    for (const choice of choices) {
      if (used & choice.used) continue;
      const rest = points - choice.points;
      const more = Math.max(0, needed - occurrences(choice, bit));
      if (!reach(index + 1, rest, (used | choice.used) & masks[index + 1], more, picked)) continue;
      picked[groups[index].index] = choice.tasks;
      return true;
    }
    failed[index].add(key);
    return false;
  }
  return {
    scores: [...bounds[0].keys()],
    take(points, needed = 0) {
      const picked = [];
      return reach(0, points, 0n, needed, picked) ? picked.flat() : null;
    },
  };
}

function bestAssignments(shape, targetPoints) {
  const { scores, take } = assignmentSearch(shape);
  const distance = points => Math.abs(points - targetPoints);
  scores.sort((a, b) => distance(a) - distance(b));
  const best = [];
  for (const points of scores) {
    if (best.length && distance(points) > distance(best[0].points)) break;
    const tasks = take(points);
    if (tasks) best.push({ tasks, points });
  }
  return best;
}

function permitsTwo(groups, bit) {
  const earlier = new Set();
  for (const { choices } of groups) {
    const here = new Set();
    for (const choice of choices) {
      if (choice.repeated & bit) return true;
      if (choice.seen & bit) here.add(choice.used);
    }
    for (const used of here) {
      for (const previous of earlier) if (!(previous & used)) return true;
    }
    for (const used of here) earlier.add(used);
  }
  return false;
}

export function findRepeatableTags(groups, limits, targetPoints, tags) {
  const repeatable = new Set();
  if (!tags.length) return repeatable;
  const unconfirmed = tagBits(tags);
  const shapes = paperShapes(groups, limits, { track: tags });
  for (const shape of shapes.reverse()) {
    const possible = [...unconfirmed].filter(([, bit]) => permitsTwo(shape.groups, bit));
    if (!possible.length) continue;
    const best = bestAssignments(prepareSearch(shape), targetPoints);
    if (!best.length) continue;
    for (const [tag, bit] of possible) {
      const { take } = assignmentSearch(prepareSearch(shape, bit), bit);
      if (!best.some(({ points }) => take(points, 2))) continue;
      unconfirmed.delete(tag);
      repeatable.add(tag);
    }
    if (!unconfirmed.size) break;
  }
  return repeatable;
}

export function drawCompatiblePaper(groups, limits, targetPoints, random) {
  const shapes = paperShapes(groups, limits, { collect: true });
  // Sample quotas by their usual weights, retrying only when a quota is incompatible with the limits.
  while (shapes.length) {
    let ticket = random() * shapes.reduce((total, shape) => total + shape.weight, 0);
    const index = shapes.findIndex(shape => (ticket -= shape.weight) < 0);
    const [shape] = shapes.splice(index, 1);
    const best = bestAssignments(prepareSearch(shape), targetPoints);
    if (best.length) return best[Math.floor(random() * best.length)];
  }
  return null;
}

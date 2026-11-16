const paperKinds = ['glowny', 'dodatkowy', 'przykladowy', 'diagnostyczny', 'zbior'];
export const kindLabels = {
  glowny: 'Główny', dodatkowy: 'Dodatkowy', przykladowy: 'Przykładowy',
  diagnostyczny: 'Diagnostyczny', zbior: 'Zbiór zadań',
};

export function normalize(text) {
  return text.toLocaleLowerCase('pl').normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l');
}

export function suggestTags(tags, search, selected = []) {
  const terms = normalize(search).trim().split(/\s+/).filter(Boolean);
  return tags.filter(tag => !selected.includes(tag) && terms.every(term => normalize(tag).includes(term)));
}

function paperOrder(sort) {
  const direction = sort === 'najstarsze' ? 'ASC' : 'DESC';
  return `rok ${direction}, coalesce(miesiac, 0) ${direction}, arkusz_id`;
}

const questionOrder = 'cast(numer AS INTEGER), numer';

function readTask(row) {
  return { ...row, kategorie: JSON.parse(row.kategorie), tagi: JSON.parse(row.tagi) };
}

function filtersFor({ category, tags = [], paper, onePoint = false } = {}) {
  const filters = [onePoint ? 'punkty = 1' : 'punkty IS NOT 1'];
  const params = [];
  if (category) {
    filters.push('? IN (SELECT value FROM json_each(kategorie))');
    params.push(category);
  }
  if (paper) {
    filters.push('arkusz_id = ?');
    params.push(paper);
  }
  for (const tag of tags) {
    filters.push('? IN (SELECT value FROM json_each(tagi))');
    params.push(tag);
  }
  return { where: `WHERE ${filters.join(' AND ')}`, params };
}

export class Catalog {
  constructor(database, taxonomy) {
    this.database = database;
    this.taxonomy = taxonomy;
    const columns = new Set(this.query('PRAGMA table_info(zadania)').map(row => row.name));
    this.publicColumns = `id, numer, arkusz_id, arkusz, rok, miesiac, typ, formula, punkty,
      kategorie, tagi, polecenie, zrodlo_arkusz, strona_zadania,
      ${columns.has('sprawdzone_polecenie') ? 'sprawdzone_polecenie' : '1 AS sprawdzone_polecenie'}`;
    this.solutionFlag = columns.has('sprawdzone_rozwiazanie') ? 'sprawdzone_rozwiazanie' : '1 AS sprawdzone_rozwiazanie';
    this.years = this.query('SELECT DISTINCT rok FROM zadania ORDER BY rok DESC').map(row => row.rok);
  }

  query(sql, params = []) {
    const statement = this.database.prepare(sql);
    try {
      statement.bind(params);
      const rows = [];
      while (statement.step()) rows.push(statement.getAsObject());
      return rows;
    } finally {
      statement.free();
    }
  }

  tasks({ category, tags = [], paper, onePoint = false, size = 15, page = 1, sort } = {}) {
    const { where, params } = filtersFor({ category, tags, paper, onePoint });
    const [{ total }] = this.query(`SELECT count(*) AS total FROM zadania ${where}`, params);
    const pages = Math.max(1, Math.ceil(total / size));
    const currentPage = Math.min(pages, Math.max(1, page));
    const tasks = this.query(`SELECT ${this.publicColumns} FROM zadania ${where}
      ORDER BY ${paperOrder(sort)}, ${questionOrder} LIMIT ? OFFSET ?`,
      [...params, size, (currentPage - 1) * size]).map(readTask);
    return { tasks, total, page: currentPage, pages };
  }

  taskOptions({ category, tags = [], subcategory } = {}) {
    const { where, params } = filtersFor({ tags });
    const rows = this.query(`SELECT kategorie, tagi FROM zadania ${where}`, params);
    const categoryCounts = new Map();
    const tagCounts = new Map();
    const tagsByCategory = new Map();
    let total = 0;
    for (const row of rows.map(readTask)) {
      for (const value of row.kategorie) {
        categoryCounts.set(value, (categoryCounts.get(value) ?? 0) + 1);
        if (!tagsByCategory.has(value)) tagsByCategory.set(value, new Map());
        const group = tagsByCategory.get(value);
        for (const tag of row.tagi) group.set(tag, (group.get(tag) ?? 0) + 1);
      }
      if ((category && !row.kategorie.includes(category)) || (subcategory && !row.tagi.includes(subcategory))) continue;
      total++;
      for (const tag of row.tagi) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    return { total, allCategories: rows.length, categories: categoryCounts, tags: tagCounts, tagsByCategory };
  }

  papers({ year, kind, sort } = {}) {
    return this.query(`SELECT arkusz_id, arkusz, rok, miesiac, typ, formula, zrodlo_arkusz,
      count(*) AS total, sum(punkty) AS points, sum(punkty IS 1) AS onePoint FROM zadania
      WHERE (? IS NULL OR rok = ?) AND (? IS NULL OR typ = ?)
      GROUP BY arkusz_id ORDER BY ${paperOrder(sort)}`,
    [year ?? null, year ?? null, paperKinds.includes(kind) ? kind : null, paperKinds.includes(kind) ? kind : null]);
  }

  task(id) {
    const row = this.query(`SELECT ${this.publicColumns} FROM zadania WHERE id = ?`, [id])[0];
    return row ? readTask(row) : null;
  }

  solution(id) {
    return this.query(`SELECT rozwiazanie, zrodlo_rozwiazanie, strona_rozwiazania, ${this.solutionFlag}
      FROM zadania WHERE id = ?`, [id])[0];
  }

  candidates() {
    return this.query(`SELECT ${this.publicColumns} FROM zadania ORDER BY ${paperOrder()}, ${questionOrder}`).map(readTask);
  }
}

async function fetchAsset(path) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error(`${response.status} ${path}`);
  return response;
}

export async function loadCatalog() {
  const [SQL, bytes, taxonomy, subcategories] = await Promise.all([
    window.initSqlJs({ locateFile: name => new URL(`../vendor/sqljs/${name}`, import.meta.url).href }),
    fetchAsset('../data/zadania.sqlite?v=9').then(response => response.arrayBuffer()),
    fetchAsset('../data/slowniki.json').then(response => response.json()),
    fetchAsset('../data/podkategorie.json?v=3').then(response => response.json()),
  ]);
  return new Catalog(new SQL.Database(new Uint8Array(bytes)), { ...taxonomy, podkategorie: subcategories });
}

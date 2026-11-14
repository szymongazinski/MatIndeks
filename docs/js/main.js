import { kindLabels, loadCatalog } from './catalog.js';
import { buildProfiles, frequencies, generatePaper, generatorAvailability } from './generator.js';
import { countText, element, paperDescription, sourceLink, TagPicker, taskCard } from './ui.js';

const find = id => document.getElementById(id);
const viewNames = ['zadania', 'arkusze', 'arkusz', 'zadanie', 'generator'];
const pointsText = points => points == null ? '—' : points + ' pkt';
const tagPreferenceKey = 'matindeks-pokazuj-tagi';

function href(view, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const part of [].concat(value ?? [])) if (part) query.append(key, part);
  }
  const search = query.toString();
  return '#' + view + (search ? '?' + search : '');
}

function readRoute() {
  const hash = location.hash.slice(1);
  const [path, search] = hash.split('?', 2);
  return { view: viewNames.includes(path) ? path : 'zadania', params: new URLSearchParams(search) };
}

function navigate(target) {
  if (target !== location.hash) location.hash = target;
}

const links = {
  task: id => href('zadanie', { id }),
  paper: id => href('arkusz', { id }),
  category: category => href('zadania', { kategoria: category }),
  tag: tag => href('zadania', { tag }),
};

function message(text) {
  return element('p', { class: 'empty-state' }, text);
}

function activatePreference() {
  const setting = find('show-tags');
  try {
    setting.checked = localStorage.getItem(tagPreferenceKey) !== 'nie';
  } catch {
    setting.checked = true;
  }
  const showTags = () => document.body.classList.toggle('hide-task-tags', !setting.checked);
  showTags();
  setting.addEventListener('change', () => {
    showTags();
    try {
      localStorage.setItem(tagPreferenceKey, setting.checked ? 'tak' : 'nie');
    } catch {
      // Keep the setting active for the current page when storage is unavailable.
    }
  });
}

function configure(catalog) {
  let lastView;
  let lastListKey;
  let lastViewHash;
  const taxonomy = catalog.taxonomy;
  const categoryPanel = find('category-panel');
  if (window.matchMedia('(max-width: 680px)').matches) categoryPanel.open = false;

  const catalogTags = new TagPicker(find('catalog-tag-filter'), 'Szukaj według tagów', taxonomy.tagi, tags => {
    const { params } = readRoute();
    navigate(href('zadania', { kategoria: params.get('kategoria'), tag: tags }));
  }, { showListButton: true });

  function selectCategory(current, values, tags, options) {
    return values.map(category => {
      const active = (category ?? null) === current;
      const count = category == null ? options.allCategories : (options.categories.get(category) ?? 0);
      return element('a', { href: count ? href('zadania', { kategoria: category, tag: tags }) : null,
        'aria-current': active ? 'true' : null, 'aria-disabled': count ? null : 'true',
        role: count ? null : 'link', class: 'category-link' },
        element('span', {}, category ?? 'Wszystkie zadania'), element('span', { class: 'category-count' }, String(count)));
    });
  }

  function drawTasks(params) {
    const requestedCategory = params.get('kategoria');
    const category = taxonomy.kategorie.includes(requestedCategory) ? requestedCategory : null;
    const tags = [...new Set(params.getAll('tag').filter(tag => taxonomy.tagi.includes(tag)))];
    const page = Number.parseInt(params.get('strona'), 10) || 1;
    const listKey = JSON.stringify([category, tags]);
    const { tasks, total, page: activePage, pages } = catalog.tasks({ category, tags, page });
    const pageLink = number => href('zadania', { kategoria: category, tag: tags, strona: number > 1 ? number : null });

    if (lastListKey !== listKey || lastView !== 'zadania') {
      const options = catalog.taskOptions({ category, tags });
      catalogTags.setSelected(tags);
      catalogTags.setAvailability(options.tags);
      find('categories').replaceChildren(...selectCategory(category, [null, ...taxonomy.kategorie], tags, options));
    }
    if (lastListKey !== listKey && lastView === 'zadania' && matchMedia('(max-width: 680px)').matches) {
      categoryPanel.open = false;
    }
    lastListKey = listKey;
    find('category-title').textContent = category ?? 'Wszystkie zadania';
    find('clear-filters').hidden = !category && tags.length === 0;
    find('result-count').textContent = countText(total);
    find('catalog-tasks').replaceChildren(...(tasks.length ? tasks.map(task => taskCard(catalog, task, links))
      : [message('Brak zadań spełniających wybrane kryteria.')]));
    const pagination = find('pagination');
    pagination.hidden = pages <= 1;
    pagination.replaceChildren(
      activePage > 1 ? element('a', { href: pageLink(activePage - 1) }, '← Poprzednia') : element('span'),
      element('span', { class: 'muted' }, `Strona ${activePage} z ${pages}`),
      activePage < pages ? element('a', { href: pageLink(activePage + 1) }, 'Następna →') : element('span'),
    );
  }

  const allPapers = catalog.papers();
  const paperById = new Map(allPapers.map(paper => [paper.arkusz_id, paper]));
  const archiveYear = find('archive-year');
  const archiveKind = find('archive-kind');
  archiveYear.append(...catalog.years.map(year => element('option', { value: year }, String(year))));
  archiveKind.append(...Object.entries(kindLabels).map(([kind, label]) => element('option', { value: kind }, label)));
  const updateArchive = () => navigate(href('arkusze', { rok: archiveYear.value, typ: archiveKind.value }));
  archiveYear.addEventListener('change', updateArchive);
  archiveKind.addEventListener('change', updateArchive);

  function drawArchive(params) {
    const year = Number.parseInt(params.get('rok'), 10);
    const kind = params.get('typ');
    archiveYear.value = catalog.years.includes(year) ? String(year) : '';
    archiveKind.value = Object.hasOwn(kindLabels, kind) ? kind : '';
    for (const option of archiveYear.options) {
      option.disabled = Boolean(option.value) && option.value !== archiveYear.value
        && !allPapers.some(paper => paper.rok === Number(option.value) && (!archiveKind.value || paper.typ === archiveKind.value));
    }
    for (const option of archiveKind.options) {
      option.disabled = Boolean(option.value) && option.value !== archiveKind.value
        && !allPapers.some(paper => paper.typ === option.value && (!archiveYear.value || paper.rok === year));
    }
    const papers = catalog.papers({ year: archiveYear.value ? year : null, kind: archiveKind.value });
    const headings = ['Arkusz', 'Rodzaj', 'Zadania', 'Punkty'];
    const rows = papers.map(paper => element('tr', {},
      element('th', { scope: 'row' }, element('a', { href: links.paper(paper.arkusz_id) }, paper.arkusz)),
      element('td', {}, paperDescription(paper)),
      element('td', { class: 'table-number' }, String(paper.total)),
      element('td', { class: 'table-number' }, pointsText(paper.points))));
    const table = element('table', { class: 'archive-table', 'aria-label': 'Arkusze maturalne' },
      element('thead', {}, element('tr', {}, headings.map((title, index) =>
        element('th', { scope: 'col', class: index > 1 ? 'table-number' : null }, title)))),
      element('tbody', {}, rows));
    find('archive-papers').replaceChildren(papers.length ? element('div', { class: 'table-wrap' }, table)
      : message('Brak arkuszy dla wybranego roku i rodzaju.'));
  }

  function drawPaper(params) {
    const id = params.get('id');
    const paper = paperById.get(id);
    find('paper-title').textContent = paper?.arkusz ?? 'Arkusz niedostępny';
    const list = find('paper-tasks');
    find('paper-info').replaceChildren();
    if (!paper) {
      list.replaceChildren(message('Wybierz arkusz z katalogu.'));
      return;
    }
    find('paper-info').append(element('span', {}, [paperDescription(paper), countText(paper.total),
      paper.points == null ? null : pointsText(paper.points)].filter(Boolean).join(' · ')),
    sourceLink(paper.zrodlo_arkusz, null, 'Oryginalny arkusz (PDF)'));
    const { tasks } = catalog.tasks({ paper: id, size: paper.total });
    list.replaceChildren(...tasks.map(task => taskCard(catalog, task, links, { showPaper: false })));
  }

  function drawSingleTask(params) {
    const task = catalog.task(params.get('id'));
    find('task-title').textContent = task ? 'Zadanie ' + task.numer : 'Zadanie niedostępne';
    find('task-paper').replaceChildren(...(task ? [element('a', { href: links.paper(task.arkusz_id) }, task.arkusz)] : []));
    find('single-task').replaceChildren(task ? taskCard(catalog, task, links, { showPaper: false, showReview: true })
      : message('Wybierz zadanie z katalogu.'));
  }

  let candidates;
  let profiles;
  const years = find('generator-years');
  const form = find('generator-form');
  const results = find('generator-results');
  const size = find('generator-size');
  const submit = form.querySelector('button[type="submit"]');
  let lastDrawFilter;
  const include = new TagPicker(find('include-tag-filter'), 'Uwzględnij tagi', taxonomy.tagi, updateGeneratorOptions);
  const exclude = new TagPicker(find('exclude-tag-filter'), 'Wyklucz tagi', taxonomy.tagi, updateGeneratorOptions);
  const yearBoxes = catalog.years.map(year => element('input', { type: 'checkbox', name: 'rok', value: year }));
  years.append(...yearBoxes.map(input => element('label', { class: 'year-option' }, input, ' ' + input.value)));
  const selectedYears = () => yearBoxes.filter(input => input.checked).map(input => Number(input.value));
  const currentFilter = () => ({ years: selectedYears(), include: include.selected, exclude: exclude.selected });
  years.addEventListener('change', updateGeneratorOptions);
  size.addEventListener('change', updateGeneratorOptions);

  function updateGeneratorOptions() {
    if (!candidates) return;
    const filter = currentFilter();
    const availability = generatorAvailability(candidates, filter, { years: catalog.years, tags: taxonomy.tagi });
    include.setAvailability(availability.includeCounts);
    exclude.setAvailability(availability.excludeCounts);
    for (const input of yearBoxes) {
      const remaining = availability.yearCounts.get(Number(input.value));
      input.disabled = remaining === 0;
      input.parentElement.title = remaining ? countText(remaining) + ' po zmianie wyboru' : 'Brak pasujących zadań';
    }
    const tagsSelected = filter.include.length + filter.exclude.length > 0;
    find('sample-size').hidden = !tagsSelected;
    size.disabled = !tagsSelected;
    const limit = Math.min(Math.max(1, availability.total), 50);
    size.max = limit;
    if (Number(size.value) > limit) size.value = limit;
    submit.disabled = !availability.total || (!profiles.length && !tagsSelected);
    find('generator-pool').textContent = 'Dostępna pula · ' + countText(availability.total);
    const options = { ...filter, size: tagsSelected ? size.valueAsNumber : undefined };
    if (!results.hidden && !submit.disabled && (size.disabled || size.validity.valid)
        && JSON.stringify(options) !== lastDrawFilter) drawSample(options);
  }

  function drawGenerator() {
    if (candidates) return;
    candidates = catalog.candidates();
    profiles = buildProfiles(candidates);
    updateGeneratorOptions();
    const formula = profiles.length && profiles.every(profile => profile.formula === profiles[0].formula)
      ? ` w formule ${profiles[0].formula}` : '';
    const summary = `Liczba arkuszy z terminów głównego i dodatkowego${formula} — ${profiles.length}.`;
    const panel = find('frequency-panel');
    panel.append(element('h2', {}, 'Rozkład kategorii'), element('p', { class: 'muted' }, profiles.length
      ? 'Generator losuje rozkład jednego z arkuszy CKE. Zawężenie lat zmienia pulę zadań.'
      : 'Rozkład pojawi się po wczytaniu pełnych arkuszy CKE.'));
    if (!profiles.length) return;
    const percentage = new Intl.NumberFormat('pl', { style: 'percent', maximumFractionDigits: 1 });
    const average = new Intl.NumberFormat('pl', { maximumFractionDigits: 2 });
    const rows = frequencies(profiles, taxonomy.kategorie).sort((left, right) => right.papers - left.papers).map(row =>
      element('tr', {}, element('th', { scope: 'row' }, row.category),
        element('td', { class: 'table-number' }, percentage.format(row.papers / profiles.length)),
        element('td', { class: 'table-number' }, average.format(row.average))));
    panel.append(element('details', { class: 'frequency-details' }, element('summary', {}, 'Sprawdź częstość występowania'),
      element('p', { class: 'field-note' }, summary, ' W analizie liczy się główna kategoria zadania.'),
      element('div', { class: 'table-wrap' }, element('table', { class: 'frequency-table', 'aria-label': 'Częstość występowania kategorii' },
        element('thead', {}, element('tr', {}, ['Kategoria', '% arkuszy', 'Śr. zadań'].map(label => element('th', { scope: 'col' }, label)))),
        element('tbody', {}, rows)))));
  }

  form.addEventListener('reset', event => {
    event.preventDefault();
    for (const input of yearBoxes) input.checked = false;
    size.value = size.defaultValue;
    include.reset();
    exclude.reset();
    results.hidden = true;
    results.replaceChildren();
    lastDrawFilter = null;
    updateGeneratorOptions();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (submit.disabled) return;
    drawSample({ ...currentFilter(), size: size.disabled ? undefined : size.valueAsNumber }, true);
  });

  function drawSample(options, focus = false) {
    const result = generatePaper(candidates, profiles, options);
    lastDrawFilter = JSON.stringify(options);
    const heading = element('h2', { tabindex: '-1' }, 'Wylosowany arkusz');
    const details = [countText(result.tasks.length), result.points == null ? null : pointsText(result.points),
      result.profile ? 'Rozkład: ' + result.profile.label : null].filter(Boolean).join(' · ');
    const notices = [];
    if (result.mode === 'balanced') {
      if (!result.profile) notices.push('Brak pełnych arkuszy potrzebnych do wyznaczenia rozkładu.');
      if (result.missing.length) {
        const shortage = new Map();
        for (const category of result.missing) shortage.set(category, (shortage.get(category) ?? 0) + 1);
        notices.push('W wybranych latach brakuje zadań do wypełnienia rozkładu: ' + [...shortage].map(([category, count]) =>
          category + (count > 1 ? ` (${count})` : '')).join(', ') + '.');
      }
      if (result.secondary) notices.push('Część zadań pasuje do rozkładu przez swoją dodatkową kategorię.');
    } else if (result.tasks.length < result.requested) {
      notices.push(result.tasks.length ? 'W puli jest mniej zadań niż wybrano.' : 'Brak zadań dla wybranych lat i tagów.');
    }
    results.replaceChildren(element('div', { class: 'results-head' }, element('div', {}, heading,
      element('p', { class: 'muted results-count' }, details))),
    ...notices.map(note => element('p', { class: 'empty-state' }, note)),
    element('div', { class: 'task-list' }, result.tasks.map((task, index) => taskCard(catalog, task, links, { heading: 'Zadanie ' + (index + 1) }))));
    results.hidden = false;
    if (focus) heading.focus();
  }

  function render() {
    const { view, params } = readRoute();
    const nextHash = location.hash;
    find('loading').hidden = true;
    for (const name of viewNames) find('view-' + name).hidden = name !== view;
    const activeNav = view === 'arkusz' ? 'arkusze' : view === 'zadanie' ? 'zadania' : view;
    for (const link of document.querySelectorAll('[data-nav]')) {
      if (link.dataset.nav === activeNav) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    if (view === 'zadania') drawTasks(params);
    if (view === 'arkusze') drawArchive(params);
    if (view === 'arkusz') drawPaper(params);
    if (view === 'zadanie') drawSingleTask(params);
    if (view === 'generator') drawGenerator();
    if (lastView && nextHash !== lastViewHash) {
      if (view !== lastView || !document.activeElement.closest('.catalog-filter')) window.scrollTo({ top: 0 });
      if (view !== lastView) find('view-' + view).querySelector('h1').focus({ preventScroll: true });
    }
    lastView = view;
    lastViewHash = nextHash;
  }

  for (const view of viewNames) find('view-' + view).querySelector('h1').tabIndex = -1;
  window.addEventListener('hashchange', render);
  render();
}

activatePreference();
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  find('tresc').focus();
});

try {
  configure(await loadCatalog());
} catch (error) {
  find('loading').replaceChildren(element('h1', {}, 'Nie udało się wczytać bazy zadań'),
    element('p', {}, 'Odśwież stronę, aby spróbować ponownie.'),
    element('button', { type: 'button', class: 'button button-primary', id: 'retry' }, 'Odśwież stronę'));
  find('retry').addEventListener('click', () => location.reload());
  console.error(error);
}

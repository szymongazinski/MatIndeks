import { kindLabels, suggestTags } from './catalog.js?v=8';

export function element(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value == null || value === false) continue;
    node.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child != null) node.append(child);
  }
  return node;
}

export function countText(count) {
  const plural = count !== 1 && count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14);
  return `${count} ${count === 1 ? 'zadanie' : plural ? 'zadania' : 'zadań'}`;
}

export function sourceLink(url, page, label) {
  if (!url) return null;
  const target = new URL(url, location.href);
  if (!['https:', 'http:'].includes(target.protocol)) return null;
  if (page > 0) target.hash = 'page=' + page;
  return element('a', { href: target.href, target: '_blank', rel: 'noopener noreferrer' }, label);
}

const tokens = /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\[\[(?:rysunek:([a-z0-9_-]+(?:\.[a-z0-9_-]+)*)(?:\|([^\]]+))?|(zrodlo))\]\]|\*\*([^*\n]+)\*\*|(\r?\n[^\S\r\n]*\r?\n(?:[^\S\r\n]*\r?\n)*)/gi;

export function fitMath(root) {
  const formulas = root.querySelectorAll('.math-inline > .katex, .math-display .katex-display > .katex');
  const resized = [];
  for (const formula of formulas) formula.style.removeProperty('--math-scale');
  for (const formula of formulas) {
    const available = formula.closest('.math-paragraph').clientWidth - 3;
    if (available <= 0) continue;
    // KaTeX allows line breaks between these spans, so only shrink a span that cannot fit on its own.
    const chunks = formula.querySelectorAll(':scope > .katex-html > :is(.katex-base, .katex-tag)');
    const widest = Math.max(0, ...Array.from(chunks, chunk => Math.max(chunk.offsetWidth, chunk.scrollWidth)));
    if (widest > available) resized.push([formula, available / (widest + 1)]);
  }
  for (const [formula, scale] of resized) formula.style.setProperty('--math-scale', scale);
}

let figureViewer;

function openFigure(url, description) {
  if (!figureViewer) {
    const close = element('button', { type: 'submit', class: 'button button-quiet', autofocus: true }, 'Zamknij');
    figureViewer = element('dialog', { class: 'figure-viewer', 'aria-label': 'Powiększony rysunek' },
      element('form', { method: 'dialog' }, close), element('img', { alt: '' }));
    figureViewer.addEventListener('click', event => {
      if (event.target === figureViewer) figureViewer.close();
    });
    document.body.append(figureViewer);
  }
  const preview = figureViewer.querySelector('img');
  preview.alt = description;
  preview.src = url;
  figureViewer.showModal();
}

export function renderText(text, source, page, sourceLabel) {
  const content = element('div', { class: 'math-text' });
  const body = text.trim();
  let block = element('div', { class: 'math-paragraph' });
  let offset = 0;
  for (const token of body.matchAll(tokens)) {
    const [literal, inline, display, imageId, caption, reference, bold, paragraphBreak] = token;
    block.append(body.slice(offset, token.index));
    offset = token.index + literal.length;
    if (paragraphBreak) {
      content.append(block);
      block = element('div', { class: 'math-paragraph' });
    } else if (imageId) {
      const url = './rysunki/' + imageId + '.png?v=2';
      const description = caption || 'Rysunek do zadania';
      const image = element('img', { srcset: url + ' 2x', alt: description, loading: 'lazy', decoding: 'async' });
      const zoom = element('button', { class: 'figure-zoom', type: 'button', 'aria-haspopup': 'dialog',
        'aria-label': caption ? 'Powiększ rysunek. ' + caption : 'Powiększ rysunek', title: 'Powiększ rysunek' }, image);
      zoom.addEventListener('click', () => openFigure(url, description));
      const figure = element('figure', { class: 'task-figure' }, zoom);
      image.addEventListener('error', () => {
        const link = sourceLink(source, page, 'Rysunek w pliku źródłowym');
        figure.replaceChildren(link ?? caption ?? 'Rysunek do zadania');
      }, { once: true });
      block.append(figure);
    } else if (reference) {
      block.append(sourceLink(source, page, sourceLabel) ?? 'Źródło');
    } else if (bold) {
      block.append(element('strong', {}, bold));
    } else {
      const formula = element(display != null ? 'div' : 'span', { class: display != null ? 'math-display' : 'math-inline' });
      const tex = display ?? inline;
      window.katex.render(tex, formula, { displayMode: display != null, throwOnError: false, strict: 'ignore', trust: false });
      block.append(formula);
    }
  }
  block.append(body.slice(offset));
  content.append(block);
  return content;
}

export function taskCard(catalog, task, links, { heading, showPaper = true, showReview = false } = {}) {
  const headingText = heading ?? 'Zadanie ' + task.numer;
  const title = element('h3', { class: 'task-title' },
    element('a', { href: links.task(task.id), 'aria-label': 'Otwórz: ' + headingText + ', ' + task.arkusz }, headingText));
  const paper = showPaper ? element('a', { class: 'task-paper', href: links.paper(task.arkusz_id) },
    task.arkusz, heading ? ' · zad. ' + task.numer : '') : null;
  const points = task.punkty == null ? null : element('span', { class: 'points' }, task.punkty + ' pkt');
  const header = element('div', { class: 'task-header' }, title, paper, points);
  const statementSource = 'Otwórz treść zadania w PDF';
  const body = task.polecenie?.trim()
    ? renderText(task.polecenie, task.zrodlo_arkusz, task.strona_zadania, statementSource)
    : element('div', { class: 'math-text' }, sourceLink(task.zrodlo_arkusz, task.strona_zadania, statementSource));
  if (task.sprawdzone_polecenie === 0 && body.querySelector('.katex-error') && !body.querySelector('a')) {
    body.append(element('p', { class: 'math-paragraph' }, sourceLink(task.zrodlo_arkusz, task.strona_zadania, statementSource)));
  }
  const term = (label, className, target) => task.punkty === 1
    ? element('span', { class: className }, label)
    : element('a', { class: className, href: target(label) }, label);
  const categories = task.kategorie.map(category => term(category, 'task-category', links.category));
  const tags = task.tagi.map(tag => term(tag, 'task-tag', links.tag));
  const terms = element('div', { class: 'task-terms' }, element('div', { class: 'task-categories' }, categories),
    tags.length ? element('div', { class: 'task-tags' }, tags) : null);
  const label = element('summary', {}, 'Pokaż rozwiązanie');
  const solution = element('details', { class: 'task-solution' }, label);
  solution.addEventListener('toggle', () => {
    label.textContent = solution.open ? 'Ukryj rozwiązanie' : 'Pokaż rozwiązanie';
    if (!solution.open) return;
    if (solution.children.length > 1) {
      fitMath(solution);
      return;
    }
    const row = catalog.solution(task.id);
    const url = row?.zrodlo_rozwiazanie;
    const page = row?.strona_rozwiazania;
    const source = sourceLink(url, page, 'Źródło rozwiązania (PDF)');
    const text = row?.rozwiazanie?.trim();
    const content = text
      ? renderText(text, url, page, 'Rozwiązanie w pliku źródłowym')
      : element('p', {}, source ? 'Zobacz rozwiązanie w pliku źródłowym.' : 'Rozwiązanie jest niedostępne.');
    const note = row?.sprawdzone_rozwiazanie === 0 && text ? element('span', { class: 'editorial-note' }, 'Transkrypcja automatyczna') : null;
    solution.append(element('div', { class: 'solution-body' }, content,
      source || note ? element('div', { class: 'solution-source' }, source, note) : null));
    fitMath(content);
  });
  const statementNote = showReview && task.sprawdzone_polecenie === 0 && task.polecenie?.trim()
    ? element('span', { class: 'editorial-note' }, 'Transkrypcja automatyczna') : null;
  return element('article', { class: 'task', 'data-task': task.id }, header, body, terms, solution,
    element('div', { class: 'task-source' }, sourceLink(task.zrodlo_arkusz, task.strona_zadania, 'Źródło zadania (PDF)'), statementNote));
}

export function paperDescription(paper) {
  if (paper.typ === 'zbior') return kindLabels.zbior;
  return kindLabels[paper.typ] + (paper.formula ? ' · formuła ' + paper.formula : '');
}

export class TagPicker {
  constructor(container, label, tags, onChange, { showListButton = false, showCounts = true } = {}) {
    this.root = container;
    this.tags = tags;
    this.showCounts = showCounts;
    this.onChange = onChange;
    this.selected = [];
    this.active = -1;
    this.matches = [];
    this.availability = null;
    this.omitted = [];
    const id = container.id;
    this.input = element('input', { id: id + '-input', type: 'search', role: 'combobox',
      'aria-expanded': 'false', 'aria-controls': id + '-options', 'aria-autocomplete': 'list',
      autocomplete: 'off', placeholder: 'Wpisz nazwę tagu' });
    this.options = element('div', { id: id + '-options', role: 'listbox', class: 'tag-options',
      hidden: true, 'aria-label': label });
    this.listButton = showListButton
      ? element('button', { type: 'button', class: 'button button-quiet tag-list-button',
          'aria-controls': this.options.id, 'aria-expanded': 'false' }, 'Lista tagów') : null;
    this.noResults = element('p', { role: 'status', hidden: true, class: 'tag-empty' }, 'Brak pasujących tagów.');
    this.chips = element('div', { class: 'chosen-tags', hidden: true });
    container.append(element('label', { for: this.input.id }, label),
      element('div', { class: 'tag-input-wrap' }, element('div', { class: 'tag-input-row' }, this.input, this.listButton),
        element('div', { class: 'tag-popup', hidden: true }, this.options, this.noResults)), this.chips);
    this.popup = this.options.parentElement;
    container.classList.add('tag-picker');
    this.input.addEventListener('input', () => this.open());
    this.input.addEventListener('focus', () => this.open());
    this.input.addEventListener('click', () => {
      if (this.popup.hidden) this.open();
    });
    this.input.addEventListener('keydown', event => this.handleKey(event));
    this.listButton?.addEventListener('click', () => {
      if (!this.popup.hidden && this.listOpen) {
        this.close();
        return;
      }
      this.input.value = '';
      this.input.focus();
      this.open(true);
    });
    document.addEventListener('pointerdown', event => {
      if (!container.contains(event.target)) this.close();
    });
    container.addEventListener('focusout', event => {
      if (!container.contains(event.relatedTarget)) this.close();
    });
  }

  open(listOpen = false) {
    this.listOpen = listOpen;
    this.matches = suggestTags(this.tags, this.input.value, [...this.selected, ...this.omitted]);
    this.active = -1;
    this.options.replaceChildren(...this.matches.map((tag, index) => {
      const count = this.availability ? this.availability.get(tag) ?? 0 : null;
      const unavailable = count === 0;
      const option = element('div', { id: this.options.id + '-' + index, role: 'option',
        'aria-selected': 'false', 'aria-disabled': unavailable ? 'true' : null, class: 'tag-option' },
      element('span', {}, tag), this.showCounts && count != null ? element('span', { class: 'tag-count' }, countText(count)) : null);
      option.addEventListener('pointerdown', event => event.preventDefault());
      if (!unavailable) option.addEventListener('click', () => this.choose(tag));
      return option;
    }));
    this.popup.hidden = false;
    this.options.hidden = this.matches.length === 0;
    this.noResults.hidden = this.matches.length > 0;
    this.input.setAttribute('aria-expanded', 'true');
    this.input.removeAttribute('aria-activedescendant');
    this.listButton?.setAttribute('aria-expanded', 'true');
    this.options.scrollTop = 0;
  }

  close() {
    this.popup.hidden = true;
    this.listOpen = false;
    this.active = -1;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
    this.listButton?.setAttribute('aria-expanded', 'false');
  }

  choose(tag) {
    if (this.availability && !this.availability.get(tag)) return;
    this.setSelected([...this.selected, tag]);
    this.input.value = '';
    this.input.focus();
    this.close();
    this.onChange([...this.selected]);
  }

  setSelected(values) {
    this.selected = values;
    this.chips.hidden = values.length === 0;
    this.chips.replaceChildren(...values.map(tag => {
      const remove = element('button', { type: 'button', class: 'chosen-tag', 'aria-label': 'Usuń tag: ' + tag },
        tag, element('span', { 'aria-hidden': 'true' }, '×'));
      remove.addEventListener('click', () => {
        this.setSelected(this.selected.filter(value => value !== tag));
        this.input.focus();
        this.close();
        this.onChange([...this.selected]);
      });
      return remove;
    }));
  }

  setAvailability(counts, omitted = []) {
    this.availability = counts;
    this.omitted = omitted;
    if (!this.popup.hidden) this.open(this.listOpen);
  }

  reset() {
    this.input.value = '';
    this.setSelected([]);
    this.close();
  }

  handleKey(event) {
    if (event.key === 'Escape' && !this.popup.hidden) {
      event.preventDefault();
      this.close();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.popup.hidden) this.open();
      const enabled = [...this.options.children].flatMap((option, index) => option.hasAttribute('aria-disabled') ? [] : [index]);
      if (!enabled.length) return;
      this.options.children[this.active]?.setAttribute('aria-selected', 'false');
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const previous = enabled.indexOf(this.active);
      const next = previous < 0 ? (step === 1 ? 0 : enabled.length - 1) : (previous + step + enabled.length) % enabled.length;
      this.active = enabled[next];
      const option = this.options.children[this.active];
      this.input.setAttribute('aria-activedescendant', option.id);
      option.setAttribute('aria-selected', 'true');
      option.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && !this.popup.hidden) {
      event.preventDefault();
      const enabled = this.matches.filter(tag => !this.availability || this.availability.get(tag));
      const tag = this.active >= 0 ? this.matches[this.active] : enabled.length === 1 ? enabled[0] : null;
      if (tag) this.choose(tag);
    }
  }
}

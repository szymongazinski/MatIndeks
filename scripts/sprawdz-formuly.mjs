import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';

const project = fileURLToPath(new URL('..', import.meta.url));
const formulaPattern = /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
const fields = ['polecenie', 'rozwiazanie'];
let problems = 0;
let formulas = 0;

for (const file of ['arkusze.json', 'zbior.json']) {
  const rows = JSON.parse(fs.readFileSync(path.join(project, 'content', file), 'utf8'));
  for (const row of rows) {
    const id = row.id ?? 'zbior-2023-' + row.numer;
    for (const field of fields) {
      const value = row[field] ?? '';
      for (const match of value.matchAll(formulaPattern)) {
        formulas++;
        try {
          katex.renderToString(match[1] ?? match[2], {
            throwOnError: true, strict: 'ignore', displayMode: match[2] != null, trust: false,
          });
        } catch (error) {
          problems++;
          console.error(id, field, error.message);
        }
      }
      if (/\\[()[\]]/.test(value.replace(formulaPattern, ''))) {
        problems++;
        console.error(id, field, 'Niedomknięty zapis LaTeX.');
      }
    }
  }
}

console.log('Wyrażenia LaTeX:', formulas, '| błędy:', problems);
process.exitCode = problems ? 1 : 0;

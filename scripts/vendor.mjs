import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

async function copy(packagePath, files, target) {
  const destination = path.join(root, 'docs', 'vendor', target);
  await mkdir(destination, { recursive: true });
  for (const name of files) {
    await copyFile(path.join(root, 'node_modules', packagePath, name), path.join(destination, path.basename(name)));
  }
}

const katexFonts = await readdir(path.join(root, 'node_modules', 'katex', 'dist', 'fonts'));
await Promise.all([
  copy('sql.js', ['dist/sql-wasm.js', 'dist/sql-wasm.wasm', 'LICENSE'], 'sqljs'),
  copy('katex', ['dist/katex.min.js', 'dist/katex.min.css', 'LICENSE'], 'katex'),
  copy('katex/dist/fonts', katexFonts.filter(name => /\.woff2?$/.test(name)), 'katex/fonts'),
  copy('@fontsource-variable/source-sans-3', ['LICENSE', 'files/source-sans-3-latin-wght-normal.woff2',
    'files/source-sans-3-latin-ext-wght-normal.woff2'], 'source-sans-3'),
]);

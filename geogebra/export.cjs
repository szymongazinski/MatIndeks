const { createServer } = require('node:http');
const { readFile, mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { once } = require('node:events');
const { chromium } = require(process.env.MATINDEKS_PLAYWRIGHT || 'playwright-core');

async function main() {
  const out = path.join(__dirname, 'eksport');
  const source = path.join(__dirname, 'konstrukcje');
  const applet = await readFile(path.join(__dirname, 'applet.html'));
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(applet);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.MATINDEKS_CHROMIUM || undefined,
      headless: true,
    });
    const page = await browser.newPage({ viewport: { width: 1100, height: 950 } });
    page.on('pageerror', error => process.stderr.write(`${error.message}\n`));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => Boolean(window.figureApi), null, { timeout: 60_000 });
    for (const script of ['konstrukcja.js', 'zbior.js', 'arkusze.js', 'rozwiazania.js', '2020-lipiec.js', '2021-maj.js', '2017-czerwiec.js', 'starsze-arkusze.js']) {
      await page.addScriptTag({ path: path.join(__dirname, script) });
    }
    const keys = process.argv.slice(2);
    const figures = await page.evaluate(wanted => {
      const ids = wanted.length ? wanted : Object.keys(window.figureDefinitions);
      return ids.map(id => {
        if (!window.figureDefinitions[id]) throw new Error(`Brak konstrukcji: ${id}`);
        return id;
      });
    }, keys);
    await Promise.all([mkdir(out, { recursive: true }), mkdir(source, { recursive: true })]);

    for (const id of figures) {
      await page.evaluate(key => window.drawFigure(window.figureApi, key), id);
      const rendered = await page.evaluate(async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return {
          png: window.figureApi.getPNGBase64(1.5, false),
          ggb: await new Promise(resolve => window.figureApi.getBase64(resolve)),
          objects: window.figureApi.getObjectNumber(),
          version: window.figureApi.getVersion(),
        };
      });
      const png = Buffer.from(rendered.png.replace(/^data:[^,]*,/, ''), 'base64');
      const ggb = Buffer.from(rendered.ggb, 'base64');
      if (rendered.objects < 2 || png.subarray(1, 4).toString() !== 'PNG' || ggb.subarray(0, 2).toString() !== 'PK') {
        throw new Error(`Nieprawidłowy eksport: ${id}`);
      }
      await Promise.all([
        writeFile(path.join(out, `${id}.png`), png),
        writeFile(path.join(source, `${id}.ggb`), ggb),
      ]);
      console.log(`${id} · GeoGebra ${rendered.version} · ${rendered.objects} obiektów`);
    }
  } finally {
    await browser?.close();
    server.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

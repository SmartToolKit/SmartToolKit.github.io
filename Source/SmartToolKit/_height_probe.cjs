const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 4660;
const profile = path.join(os.tmpdir(), 'height-probe-' + process.pid);

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--user-data-dir=' + profile,
  `--remote-debugging-port=${PORT}`,
  'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJson = url => new Promise((res, rej) => {
  http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej);
});

const PAGES = [
  ['calendar', '/calendar'],
  ['national-code', '/national-code'],
  ['image-slicer', '/image-slicer'],
  ['json-viewer', '/json-viewer'],
  ['sql-query-formatter', '/sql-query-formatter'],
  ['color-picker', '/color-picker'],
];

(async () => {
  for (let i = 0; i < 30; i++) { try { await getJson(`http://localhost:${PORT}/json/version`); break; } catch { await sleep(500); } }
  await sleep(400);
  const target = await new Promise((res, rej) => {
    const r = http.request({ host: 'localhost', port: PORT, path: '/json/new?about:blank', method: 'PUT' }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => res(JSON.parse(d))); });
    r.on('error', rej); r.end();
  });

  const WebSocket = require('ws');
  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 50 * 1024 * 1024 });
  let id = 0; const pending = new Map();
  const send = (m, p = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
  ws.on('message', raw => { const m = JSON.parse(raw.toString()); if (m.id && pending.has(m.id)) { const q = pending.get(m.id); pending.delete(m.id); m.error ? q.reject(new Error(JSON.stringify(m.error))) : q.resolve(m.result); } });
  await new Promise(r => ws.on('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });

  const probe = `JSON.stringify((() => {
    const page = document.querySelector('.item-details-page');
    const footer = document.querySelector('app-footer footer');
    const header = document.querySelector('app-header');
    const cs = page ? getComputedStyle(page) : null;
    const r = page ? page.getBoundingClientRect() : null;
    const fr = footer ? footer.getBoundingClientRect() : null;
    return {
      pageHeight: r ? Math.round(r.height) : null,
      viewport: window.innerHeight,
      minHeight: cs ? cs.minHeight : null,
      paddingTop: cs ? cs.paddingTop : null,
      paddingBottom: cs ? cs.paddingBottom : null,
      footerTop: fr ? Math.round(fr.top) : null,
      footerFullyVisible: fr ? fr.top >= 0 : null,
      headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null
    };
  })())`;

  console.log('page'.padEnd(22), 'pageH'.padStart(6), 'minHeight'.padStart(10), 'padTop'.padStart(7), 'padBot'.padStart(7), 'footerTop'.padStart(9), 'footerVisible');
  for (const [name, url] of PAGES) {
    await send('Page.navigate', { url: 'http://localhost:4200' + url });
    await sleep(url === '/calendar' ? 12000 : 6000);
    const v = JSON.parse((await send('Runtime.evaluate', { expression: probe, returnByValue: true })).result.value);
    console.log(
      name.padEnd(22),
      String(v.pageHeight).padStart(6),
      String(v.minHeight).padStart(10),
      String(v.paddingTop).padStart(7),
      String(v.paddingBottom).padStart(7),
      String(v.footerTop).padStart(9),
      String(v.footerFullyVisible).padStart(14)
    );
  }

  ws.close();
  try { chrome.kill(); } catch {}
  try { require('node:fs').rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(0);
})().catch(e => { console.log('ERROR', e.message); process.exit(1); });
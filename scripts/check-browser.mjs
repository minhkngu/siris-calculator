// Run after npm run build. Set PLAYWRIGHT_MODULE to an installed playwright module.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sessionKey = 'hotel-price-calculator:session:v1';
const fixture = {
  branches: [{ id: 'branch-1', name: 'Siris Test', address: 'Đà Nẵng' }],
  roomTypes: [{ id: 'room-1', branchId: 'branch-1', name: 'Deluxe', weekdayPrice: 1000000, weekendPrice: 1500000 }],
  stayDiscounts: [{ id: 'discount-1', name: 'Long stay', minNights: 3, discountAmount: 10, isPercentage: true }],
  dateAdjustments: [],
  items: [{ id: 'item-1', item_name: 'Khăn tắm', kind: 'Cái', quantity: 2, unit_price: 100000 }],
};
const requests = [];
const failures = new Set();
let live = false;
let liveGet;
const servers = [];
async function serve(directory) {
  const root = resolve(directory);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/hotel-data') {
        const scope = url.searchParams.get('scope') ?? 'all';
        requests.push(scope);
        if (live) {
          const response = await liveGet(new Request(url));
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(await response.text());
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 180));
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'application/json');
        if (failures.has(scope)) {
          res.writeHead(502); res.end(JSON.stringify({ error: 'Lỗi thử nghiệm' })); return;
        }
        const keys = Object.keys(fixture).filter(key => scope === 'all' || (scope === 'items' ? key === 'items' : key !== 'items'));
        res.end(JSON.stringify(Object.fromEntries(keys.map(key => [key, fixture[key]]))));
        return;
      }
      const file = resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
      if (!file.startsWith(root + '/')) { res.writeHead(403); res.end(); return; }
      await stat(file);
      const content = await readFile(file);
      const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' }[extname(file)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Content-Encoding': 'gzip', 'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable' });
      res.end(gzipSync(content));
    } catch {
      res.writeHead(404); res.end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
try {
  const after = await serve('dist');
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assets = [];
  page.on('request', req => { if (req.url().endsWith('.js')) assets.push(req.url()); });
  await page.goto(after);
  await page.getByRole('heading', { name: 'Phần mềm nội bộ Siris Residences' }).waitFor();
  await page.locator('#single-room-quote').waitFor();
  assert.deepEqual(requests, ['room']);
  assert(!assets.some(url => /CalendarPicker|MultiRoomSelector|ItemCompensation|motionFeatures/.test(url)));
  const quote = await page.locator('#single-room-quote').inputValue();
  assert(quote.includes('Deluxe'));
  await page.getByText('Bao gồm VAT', { exact: true }).click();
  const vatQuote = await page.locator('#single-room-quote').inputValue();
  assert.notEqual(vatQuote, quote);
  await page.getByRole('button', { name: /Nhận phòng/ }).click();
  await page.locator('.rdp-root').waitFor();
  assert(assets.some(url => /CalendarPicker/.test(url)));
  await page.screenshot({ path: '/tmp/hotel-calendar-after.png' });
  await page.keyboard.press('Escape');
  // Close the calendar by selecting an available day.
  await page.locator('.rdp-day_button').first().click();
  await page.getByRole('button', { name: 'Nhiều phòng', exact: true }).click();
  await page.getByRole('button', { name: /Thêm phòng/ }).waitFor();
  assert(assets.some(url => /MultiRoomSelector/.test(url)));
  await page.getByRole('button', { name: /Thêm phòng/ }).click();
  await page.waitForFunction(key => JSON.parse(sessionStorage.getItem(key)).multiRooms.length === 2, sessionKey);
  await page.getByRole('button', { name: 'Bồi thường vật dụng', exact: true }).click();
  await page.getByText('Khăn tắm', { exact: true }).waitFor();
  assert.deepEqual(requests, ['room', 'items']);
  await page.getByText('Khăn tắm', { exact: true }).click();
  // Quantity controls appear only after selecting the item.
  const plus = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
  await plus.last().click();
  await page.waitForFunction(key => JSON.parse(sessionStorage.getItem(key)).selectedQuantities['item-1'] === 2, sessionKey);
  requests.length = 0;
  await page.reload();
  await page.getByText('Khăn tắm', { exact: true }).waitFor();
  assert.deepEqual(requests, ['items']);
  assert.equal(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).selectedQuantities['item-1'], sessionKey), 2);
  await page.getByRole('button', { name: 'Tính tiền phòng', exact: true }).click();
  await page.getByRole('button', { name: /Thêm phòng/ }).waitFor();
  assert.equal(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).multiRooms.length, sessionKey), 2);
  await page.getByRole('button', { name: 'Phòng đơn', exact: true }).click();
  await page.locator('#single-room-quote').waitFor();
  await page.waitForFunction(key => JSON.parse(sessionStorage.getItem(key)).roomMode === 'single', sessionKey);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: '/tmp/hotel-room-after.png' });
  const restoredQuote = await page.locator('#single-room-quote').inputValue();
  requests.length = 0;
  await page.reload();
  await page.locator('#single-room-quote').waitFor();
  assert.deepEqual(requests, ['room']);
  assert.equal(await page.locator('#single-room-quote').inputValue(), restoredQuote);
  await page.getByRole('button', { name: 'Bồi thường vật dụng', exact: true }).click();
  await page.getByText('Khăn tắm', { exact: true }).waitFor();
  assert.equal(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).selectedQuantities['item-1'], sessionKey), 2);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Tính tiền phòng', exact: true }).click();
  await page.locator('#single-room-quote').waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => Promise.allSettled(document.getAnimations().map(animation => animation.finished)));
  await page.screenshot({ path: '/tmp/hotel-mobile-after.png' });
  assert.deepEqual(errors, []);
  await context.close();

  // Independent errors, retry only the failed group, and rapid switching.
  requests.length = 0;
  failures.add('items');
  const errorContext = await browser.newContext();
  const errorPage = await errorContext.newPage();
  await errorPage.goto(after);
  await errorPage.getByRole('button', { name: 'Bồi thường vật dụng', exact: true }).click();
  await errorPage.getByText('Lỗi thử nghiệm', { exact: true }).waitFor();
  await errorPage.getByRole('button', { name: 'Tính tiền phòng', exact: true }).click();
  await errorPage.locator('#single-room-quote').waitFor();
  await errorPage.getByRole('button', { name: 'Bồi thường vật dụng', exact: true }).click();
  await errorPage.getByText('Lỗi thử nghiệm', { exact: true }).waitFor();
  failures.clear();
  await errorPage.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await errorPage.getByText('Khăn tắm', { exact: true }).waitFor();
  assert.equal(requests.filter(scope => scope === 'room').length, 1);
  await errorContext.close();
  failures.add('room');
  const roomErrorContext = await browser.newContext();
  const roomErrorPage = await roomErrorContext.newPage();
  await roomErrorPage.goto(after);
  await roomErrorPage.getByText('Lỗi thử nghiệm', { exact: true }).waitFor();
  await roomErrorPage.getByRole('button', { name: 'Bồi thường vật dụng', exact: true }).click();
  await roomErrorPage.getByText('Khăn tắm', { exact: true }).waitFor();
  await roomErrorContext.close();
  failures.clear();

  // Lazy module failure remains inside the feature and offers a reload.
  const chunkContext = await browser.newContext();
  const chunkPage = await chunkContext.newPage();
  await chunkPage.route('**/CalendarPicker-*.js', route => route.abort());
  await chunkPage.goto(after);
  await chunkPage.locator('#single-room-quote').waitFor();
  await chunkPage.getByRole('button', { name: /Nhận phòng/ }).click();
  await chunkPage.getByRole('button', { name: 'Tải lại trang', exact: true }).waitFor();
  assert(await chunkPage.getByRole('button', { name: 'Bồi thường vật dụng', exact: true }).isVisible());
  await chunkContext.close();
  const motionContext = await browser.newContext();
  const motionPage = await motionContext.newPage();
  await motionPage.route('**/motionFeatures-*.js', route => route.abort());
  await motionPage.goto(after);
  await motionPage.locator('#single-room-quote').waitFor();
  await motionPage.getByRole('button', { name: /Siris Test.*Đà Nẵng/ }).click();
  await motionPage.getByRole('button', { name: 'Tải lại trang', exact: true }).waitFor();
  await motionContext.close();
  console.log('Browser flows passed: lazy assets, calendar, VAT, multi-room, quantities, restore, independent errors, lazy failure.');

  if (process.env.PERF_BEFORE_DIR) {
    const before = await serve(process.env.PERF_BEFORE_DIR);
    if (process.env.PERF_LIVE === '1') {
      ({ GET: liveGet } = await import(pathToFileURL(resolve('api/hotel-data.js'))));
      live = true;
    }
    const results = {};
    for (const [label, url] of [['before', before], ['after', after]]) {
      results[label] = { cold: [], reload: [] };
      for (let i = 0; i < 5; i += 1) {
        const ctx = await browser.newContext();
        const pg = await ctx.newPage();
        const cdp = await ctx.newCDPSession(pg);
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 200000, uploadThroughput: 100000 });
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        for (const mode of ['cold', 'reload']) {
          if (mode === 'cold') await pg.goto(url); else await pg.reload();
          await pg.locator('#single-room-quote').waitFor({ timeout: 90000 });
          const timing = await pg.evaluate(() => {
            const api = performance.getEntriesByType('resource').find(entry => entry.name.includes('/api/hotel-data'));
            const scripts = performance.getEntriesByType('resource').filter(entry => entry.initiatorType === 'script' || entry.name.endsWith('.js'));
            return { readyMs: Math.round(performance.now()), apiMs: Math.round(api.duration), jsTransferBytes: scripts.reduce((sum, entry) => sum + entry.transferSize, 0) };
          });
          results[label][mode].push(timing);
          console.log(JSON.stringify({ label, mode, run: i + 1, ...timing }));
        }
        await ctx.close();
      }
    }
    await writeFile('/tmp/hotel-performance.json', JSON.stringify({ live, network: '100ms latency, 1.6Mbps down, CPU x4', results }, null, 2));
  }
} finally {
  await browser.close();
  for (const server of servers) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

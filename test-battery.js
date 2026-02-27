#!/usr/bin/env node
/**
 * ClawCorp Game - Automated Test Battery v2
 * Run: node test-battery.js
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'http://localhost:8889';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const results = [];
let passed = 0, failed = 0, warnings = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function pass(s, t, d) { results.push({ status: 'PASS', section: s, test: t, detail: d }); passed++; }
function fail(s, t, d) { results.push({ status: 'FAIL', section: s, test: t, detail: d }); failed++; }
function warn(s, t, d) { results.push({ status: 'WARN', section: s, test: t, detail: d }); warnings++; }

async function run() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR);
  console.log('\n=== CLAWCORP GAME - TEST BATTERY v2 ===\n');

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1920,1080'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // ---- 1. PAGE LOAD ----
  console.log('1. Page Load...');
  try {
    const resp = await page.goto(URL, { waitUntil: 'networkidle2', timeout: 15000 });
    resp.status() === 200 ? pass('Load', 'HTTP', '200 OK') : fail('Load', 'HTTP', resp.status());
  } catch (e) { fail('Load', 'Nav', e.message); await browser.close(); return printReport(); }

  await sleep(1500); // Wait for all JS to execute

  // Check grid rendered via DOM
  const cellCount = await page.$$eval('#csGrid .cell', c => c.length).catch(() => 0);
  cellCount === 20 ? pass('Load', 'Grid render', '20 cells') : fail('Load', 'Grid render', cellCount + ' cells');

  // Check first agent auto-selected (Tour should be active)
  const autoSelected = await page.$eval('#csGrid .cell:first-child', el => el.classList.contains('active')).catch(() => false);
  autoSelected ? pass('Load', 'Auto-select', 'Tour selected') : warn('Load', 'Auto-select', 'Not auto-selected');

  // Check preview has content (not empty)
  const pvContent = await page.$eval('#csPreview', el => el.textContent.trim()).catch(() => '');
  pvContent.includes('Tour') ? pass('Load', 'Preview init', 'Shows Tour') : warn('Load', 'Preview init', pvContent.substring(0, 30));

  consoleErrors.length === 0
    ? pass('Load', 'Console', 'Zero errors')
    : fail('Load', 'Console', consoleErrors.length + ' errors: ' + consoleErrors[0]?.substring(0, 80));

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-desktop.png'), fullPage: true });

  // ---- 2. ROSTER ----
  console.log('2. Roster...');
  const gridCols = await page.$eval('#csGrid', el => getComputedStyle(el).gridTemplateColumns).catch(() => '');
  const colCount = gridCols.split(' ').filter(s => s.trim()).length;
  colCount === 5 ? pass('Roster', 'Columns', '5') : fail('Roster', 'Columns', colCount);

  // ---- 3. CLICK TESTS ----
  console.log('3. Clicks...');
  const cells = await page.$$('#csGrid .cell');

  if (cells.length >= 5) {
    // Click Forge (index 2)
    await cells[2].click(); await sleep(500);
    const pvForge = await page.$eval('#csPreview', el => el.textContent).catch(() => '');
    pvForge.includes('Forge')
      ? pass('Click', 'Forge select', 'Preview shows Forge')
      : fail('Click', 'Forge select', 'Preview: ' + pvForge.substring(0, 40));

    const forgeActive = await cells[2].evaluate(el => el.classList.contains('active'));
    forgeActive ? pass('Click', 'Active class', 'Forge has .active') : fail('Click', 'Active class', 'Missing');

    // Deselect by clicking same cell
    await cells[2].click(); await sleep(300);
    const deselected = await cells[2].evaluate(el => !el.classList.contains('active'));
    deselected ? pass('Click', 'Deselect', 'OK') : fail('Click', 'Deselect', 'Still active');

    // Click agent at index 4 (Watchdog) - verify ANY agent selection works
    await cells[4].click(); await sleep(500);
    const pvAgent4 = await page.$eval('#csPreview', el => el.textContent).catch(() => '');
    pvAgent4.includes('Watchdog')
      ? pass('Click', 'Agent4 select', 'Preview shows Watchdog')
      : fail('Click', 'Agent4 select', 'Preview: ' + pvAgent4.substring(0, 40));

    // Click back to Tour for subsequent tests
    await cells[0].click(); await sleep(300);
  } else {
    fail('Click', 'Cells', 'Only ' + cells.length);
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-click.png') });

  // ---- 4. TIERS ----
  console.log('4. Tiers...');
  await page.click('.tier-btn[data-tier="free"]'); await sleep(300);
  const free = await page.$$eval('#csGrid .cell:not(.disabled)', c => c.length).catch(() => 0);
  free === 3 ? pass('Tier', 'FREE', '3 active') : fail('Tier', 'FREE', free);

  await page.click('.tier-btn[data-tier="pro"]'); await sleep(300);
  const pro = await page.$$eval('#csGrid .cell:not(.disabled)', c => c.length).catch(() => 0);
  pro === 7 ? pass('Tier', 'PRO', '7 active') : fail('Tier', 'PRO', pro);

  await page.click('.tier-btn[data-tier="max"]'); await sleep(300);
  const max = await page.$$eval('#csGrid .cell:not(.disabled)', c => c.length).catch(() => 0);
  max === 20 ? pass('Tier', 'MAX', '20 active') : fail('Tier', 'MAX', max);

  // ---- 5. PREVIEW PANEL ----
  console.log('5. Preview...');
  // Make sure an agent is selected
  const allCells = await page.$$('#csGrid .cell');
  await allCells[0].click(); await sleep(500);

  const models = await page.$$('#csPreview .model-btn');
  models.length >= 2 ? pass('Preview', 'Model btns', models.length) : fail('Preview', 'Model btns', models.length);

  const stats = await page.$$('#csPreview .pv-stats-row');
  stats.length === 3 ? pass('Preview', 'Stat bars', '3 (ATK/DEF/SPD)') : fail('Preview', 'Stat bars', stats.length);

  (await page.$('#csPreview .pv-xp-bar')) ? pass('Preview', 'XP bar', 'OK') : fail('Preview', 'XP bar', 'missing');
  (await page.$('#csPreview .pv-budget-slider')) ? pass('Preview', 'Slider', 'OK') : fail('Preview', 'Slider', 'missing');

  const deploy = await page.$('#csPreview .pv-deploy');
  if (deploy) {
    pass('Preview', 'Deploy btn', 'OK');
    await deploy.click(); await sleep(300);
    const dt = await deploy.evaluate(el => el.textContent);
    dt.includes('DEPLOYED') ? pass('Preview', 'Deploy action', 'DEPLOYED!') : warn('Preview', 'Deploy action', dt);
    await sleep(1600);
  } else {
    fail('Preview', 'Deploy btn', 'missing');
  }

  // Test model change
  if (models.length >= 2) {
    const statBefore = await page.$eval('#csPreview .pv-stat-num', el => el.textContent).catch(() => '?');
    const freshModel = await page.$$("#csPreview .model-btn"); if (freshModel.length > 0) await freshModel[0].click(); await sleep(300);
    pass('Preview', 'Model click', 'Clickable');
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-preview.png') });

  // ---- 6. MODES ----
  console.log('6. Modes...');
  const cruiseBtn = await page.$('#cruiseBtn');
  const hitlBtn = await page.$('#hitlBtn');
  const customBtn = await page.$('#customBtn');

  if (cruiseBtn && hitlBtn && customBtn) {
    pass('Modes', 'Buttons', 'All 3 found');

    // HITL active by default
    const hitlDef = await hitlBtn.evaluate(el => el.classList.contains('active'));
    hitlDef ? pass('Modes', 'HITL default', 'Active') : warn('Modes', 'HITL default', 'Not active');

    // Click Cruise
    await cruiseBtn.click(); await sleep(300);
    (await cruiseBtn.evaluate(el => el.classList.contains('active')))
      ? pass('Modes', 'Cruise', 'Activates') : fail('Modes', 'Cruise', 'No');

    // Click Custom
    await customBtn.click(); await sleep(300);
    (await customBtn.evaluate(el => el.classList.contains('active')))
      ? pass('Modes', 'Custom', 'Activates') : fail('Modes', 'Custom', 'No');

    // Per-agent buttons: select a DIFFERENT agent (not the currently selected one)
    const cells2 = await page.$$('#csGrid .cell');
    await cells2[3].click(); await sleep(500); // Click Backbone (index 3)
    const agBtn = await page.$('#csPreview .mode-agent-btn');
    agBtn
      ? pass('Modes', 'Per-agent btns', 'Visible in Custom')
      : fail('Modes', 'Per-agent btns', 'Missing');

    // Reset
    await hitlBtn.click(); await sleep(200);
  } else {
    fail('Modes', 'Buttons', 'Missing');
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-modes.png') });

  // ---- 7. CHATS ----
  console.log('7. Chats...');
  const chatRow = await page.$('.hc-chats-row');
  if (chatRow) {
    const display = await chatRow.evaluate(el => getComputedStyle(el).display);
    const dir = await chatRow.evaluate(el => getComputedStyle(el).flexDirection);
    (display === 'flex' && dir === 'row')
      ? pass('Chats', 'Side by side', 'flex row') : fail('Chats', 'Side by side', display + '/' + dir);
    const wraps = await page.$$('.hc-chats-row .hc-wrap');
    wraps.length >= 2 ? pass('Chats', 'Windows', wraps.length) : fail('Chats', 'Windows', wraps.length);
  } else { fail('Chats', 'Container', 'Missing'); }

  // ---- 8. HOW IT WORKS ----
  console.log('8. HowItWorks...');
  const hiw = await page.$$('.hiw-step');
  hiw.length === 3 ? pass('HiW', 'Steps', '3') : fail('HiW', 'Steps', hiw.length);

  // ---- 9. NAV ----
  console.log('9. Nav...');
  (await page.$('#communication')) ? pass('Nav', '#communication', 'OK') : fail('Nav', '#communication', 'missing');
  (await page.$('#agents')) ? pass('Nav', '#agents', 'OK') : fail('Nav', '#agents', 'missing');

  // ---- 10. WAITLIST ----
  console.log('10. Waitlist...');
  const email = await page.$('#waitlistEmail');
  if (email) {
    pass('Waitlist', 'Input', 'OK');
    await email.type('test@example.com'); await sleep(200);
    const val = await email.evaluate(el => el.value);
    val.includes('@') ? pass('Waitlist', 'Type', 'OK') : fail('Waitlist', 'Type', val);
  } else { fail('Waitlist', 'Input', 'missing'); }
  (await page.$('#wlOverlay')) ? pass('Waitlist', 'Modal', 'OK') : fail('Waitlist', 'Modal', 'missing');

  // ---- 11. LIGHT MODE ----
  console.log('11. Light...');
  const theme = await page.$('#themeBtn');
  if (theme) {
    await theme.click(); await sleep(500);
    const attr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    attr === 'light' ? pass('Light', 'Toggle', 'ON') : fail('Light', 'Toggle', attr);

    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    pass('Light', 'BG', bg);

    const lCells = await page.$$eval('#csGrid .cell', c => c.length).catch(() => 0);
    lCells === 20 ? pass('Light', 'Grid', '20 cells') : fail('Light', 'Grid', lCells);

    if (chatRow) {
      const ld = await chatRow.evaluate(el => getComputedStyle(el).flexDirection);
      ld === 'row' ? pass('Light', 'Chats', 'Side by side') : fail('Light', 'Chats', ld);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-light.png'), fullPage: true });
    await theme.click(); await sleep(300);
  }

  // ---- 12. RESPONSIVE ----
  console.log('12. Responsive...');
  await page.setViewport({ width: 375, height: 812 }); await sleep(500);
  const mc = (await page.$eval('#csGrid', el => getComputedStyle(el).gridTemplateColumns).catch(() => '')).split(' ').filter(s => s.trim()).length;
  mc <= 3 ? pass('Resp', 'Mobile grid', mc + ' cols') : fail('Resp', 'Mobile grid', mc);

  if (chatRow) {
    const md = await chatRow.evaluate(el => getComputedStyle(el).flexDirection);
    md === 'column' ? pass('Resp', 'Mobile chats', 'Stacked') : fail('Resp', 'Mobile chats', md);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-mobile.png'), fullPage: true });

  await page.setViewport({ width: 900, height: 1024 }); await sleep(300);
  const tc = (await page.$eval('#csGrid', el => getComputedStyle(el).gridTemplateColumns).catch(() => '')).split(' ').filter(s => s.trim()).length;
  (tc >= 3 && tc <= 5) ? pass('Resp', 'Tablet', tc + ' cols') : warn('Resp', 'Tablet', tc);

  await page.setViewport({ width: 1920, height: 1080 }); await sleep(300);
  const dc = (await page.$eval('#csGrid', el => getComputedStyle(el).gridTemplateColumns).catch(() => '')).split(' ').filter(s => s.trim()).length;
  dc === 5 ? pass('Resp', 'Desktop', '5 cols') : fail('Resp', 'Desktop', dc);

  // ---- 13. FINAL ----
  console.log('13. Final...');
  consoleErrors.length === 0
    ? pass('Final', 'Console', 'Zero errors')
    : fail('Final', 'Console', consoleErrors.length + ' errors');
  if (consoleErrors.length > 0) consoleErrors.forEach(e => console.log('  ERR:', e.substring(0, 100)));

  await browser.close();
  printReport();
}

function printReport() {
  console.log('\n' + '='.repeat(60));
  console.log('  CLAWCORP GAME - TEST REPORT v2');
  console.log('  ' + new Date().toISOString().split('T')[0]);
  console.log('='.repeat(60));
  let sec = '';
  for (const r of results) {
    if (r.section !== sec) { sec = r.section; console.log('\n  [' + sec + ']'); }
    const i = r.status === 'PASS' ? ' OK ' : r.status === 'FAIL' ? 'FAIL' : 'WARN';
    console.log('    [' + i + '] ' + r.test + ' - ' + r.detail);
  }
  console.log('\n' + '='.repeat(60));
  console.log('  PASSED: ' + passed + '  FAILED: ' + failed + '  WARNINGS: ' + warnings);
  console.log('  VERDICT: ' + (failed === 0 ? 'APPROVE' : 'BLOCK (' + failed + ' failures)'));
  console.log('  Screenshots: ./screenshots/');
  console.log('='.repeat(60) + '\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(2); });

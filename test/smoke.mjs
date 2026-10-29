#!/usr/bin/env node
/**
 * Headless smoke test for the single-file game. No npm packages.
 *
 *   node test/smoke.mjs
 *
 * Uses the system Chrome DevTools protocol. Set CHROME_PATH if chrome
 * is not on the default path.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = 'file://' + join(root, 'index.html');
const port = 9300 + Math.floor(Math.random() * 500);
const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

function chromeBin() {
  const cands = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  return cands.find(p => existsSync(p));
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.next = 0;
    this.pending = new Map();
    this.errors = [];
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        this.errors.push(d.exception?.description || d.text || 'exception');
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        this.errors.push(msg.params.args.map(a => a.value ?? a.description ?? '').join(' '));
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true
    });
    if (result.exceptionDetails) {
      const d = result.exceptionDetails;
      throw new Error(d.exception?.description || d.text || 'eval failed');
    }
    return result.result?.value;
  }
}

async function connect(port) {
  let wsUrl = '';
  for (let i = 0; i < 50 && !wsUrl; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      wsUrl = list.find(t => t.type === 'page')?.webSocketDebuggerUrl || '';
    } catch { /* chrome still booting */ }
    if (!wsUrl) await delay(100);
  }
  if (!wsUrl) throw new Error('Chrome DevTools endpoint did not come up');
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', () => reject(new Error('devtools websocket failed')));
  });
  return new CDP(ws);
}

async function waitFor(cdp, expr, ms = 5000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await cdp.eval(expr)) return;
    await delay(40);
  }
  throw new Error('timed out waiting for ' + expr);
}

const bin = chromeBin();
if (!bin) {
  console.error('smoke: no Chrome/Chromium binary found');
  process.exit(1);
}
const profile = await mkdtemp(join(tmpdir(), 'folwark-smoke-'));
const chrome = spawn(bin, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

try {
  const cdp = await connect(port);
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
  });
  await cdp.send('Page.navigate', { url: pageUrl });
  await waitFor(cdp, `!!document.getElementById('beginBtn')`);
  await cdp.eval(`document.activeElement && document.activeElement.blur()`);

  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space' });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space' });
  await delay(400);
  const titled = await cdp.eval(`({
    week: window.F.state().week,
    intro: !document.getElementById('intro').classList.contains('off')
  })`);
  check(titled.week === 0 && titled.intro, 'Space on the title screen must not start the week');

  await cdp.eval(`document.getElementById('beginBtn').click()`);
  await waitFor(cdp, `!!document.querySelector('#mBody button[data-sp="pig"]')`);
  const meters = await cdp.eval(`(() => {
    const row = (sp, label) => {
      const btn = document.querySelector('#mBody button[data-sp="' + sp + '"]');
      const line = [...btn.querySelectorAll('.srow')].find(r => r.querySelector('em').textContent === label);
      return line.querySelectorAll('.st.on').length;
    };
    return {
      n: document.querySelectorAll('#mBody button[data-sp]').length,
      pigPol: row('pig', 'Politics'), pigPow: row('pig', 'Power'),
      dogPol: row('dog', 'Politics'), henBr: row('hen', 'Breeds')
    };
  })()`);
  check(meters.n === 8, 'choose screen should offer 8 species');
  check(meters.pigPol === 5 && meters.pigPow === 2, 'pig ratings should be politics 5, power 2');
  check(meters.dogPol === 1 && meters.henBr === 5, 'dog politics and hen breeds should not all be full stars');

  await cdp.eval(`document.querySelector('#mBody button[data-sp="pig"]').click()`);
  await waitFor(cdp, `!document.getElementById('modal').classList.contains('on')`);
  const started = await cdp.eval(`(() => {
    const s = window.F.state();
    const leader = window.F.roster().find(a => a.role === 'leader');
    return {
      s, leaderSpecies: leader && leader.species, perks: leader && leader.perks.length,
      journal: document.getElementById('feedJ').innerText,
      official: document.getElementById('feedO').innerText,
      regime: document.getElementById('regimeChip').textContent,
      bad: window.F.problems()
    };
  })()`);
  check(started.leaderSpecies === 'pig', 'choosing pig should put a pig in the farmhouse');
  check(started.s.rulers === 'pigs', 'the constitution should follow the pigs');
  check(/rebellion/i.test(started.journal), 'the journal should record the rebellion');
  check(started.official.length > 20, 'the official history should have an opening line');
  check(started.perks >= 1, 'the leader should be born with a perk');
  check(started.regime.length > 3, 'the regime should be named');
  check(started.bad.length === 0, 'start state has bad numbers: ' + started.bad.join('; '));

  await cdp.eval(`(() => {
    window.F.set('elections', 0.9);
    window.F.set('repression', 0.1);
  })()`);
  const managed = await cdp.eval(`document.getElementById('regimeChip').textContent`);
  check(managed === 'MANAGED DEMOCRACY', 'high elections and low repression under pig rule should be managed democracy, got ' + managed);

  await cdp.eval(`document.querySelector('#constChips button[data-r="any"]').click()`);
  const amended = await cdp.eval(`({
    rulers: window.F.state().rulers,
    note: document.getElementById('constNote').textContent
  })`);
  check(amended.rulers === 'any', 'constitution chip should switch to any animal');
  check(/turmoil/i.test(amended.note), 'amending should start weeks of turmoil');
  await cdp.eval(`document.querySelector('#constChips button[data-r="dogs"]').click()`);
  const blocked = await cdp.eval(`window.F.state().rulers`);
  check(blocked === 'any', 'a second amendment during turmoil should be ignored');

  await cdp.eval(`document.querySelector('.tabs button[data-tab="decrees"]').click()`);
  await cdp.eval(`[...document.querySelectorAll('#decrees button')].find(b => /Amnesty/i.test(b.innerText)).click()`);
  const amnesty = await cdp.eval(`document.getElementById('feedJ').innerText`);
  check(/amnesty/i.test(amnesty), 'amnesty should be written in the journal');

  await cdp.eval(`[...document.querySelectorAll('#decrees button')].find(b => /Snap election/i.test(b.innerText)).click()`);
  const election = await cdp.eval(`({
    title: document.getElementById('mTitle').textContent,
    body: document.getElementById('mBody').innerText
  })`);
  check(/election/i.test(election.title), 'snap election should open the ballot, got ' + election.title);
  check(/%/.test(election.body), 'a contested count should show a percentage');
  await cdp.eval(`document.querySelector('#mBtns button').click()`);

  await cdp.eval(`document.querySelector('.tabs button[data-tab="herd"]').click()`);
  const herd = await cdp.eval(`(() => {
    const rows = [...document.querySelectorAll('#herd .hrow')];
    return {
      rows: rows.length,
      imgs: rows.filter(r => (r.querySelector('img')?.src || '').startsWith('data:')).length,
      alive: window.F.state().alive
    };
  })()`);
  check(herd.rows === herd.alive && herd.imgs === herd.rows, 'every living animal should have a portrait in the herd');

  await cdp.eval(`document.getElementById('leaderPic').click()`);
  const papers = await cdp.eval(`document.getElementById('mBody').innerText`);
  check(/thirst/i.test(papers) && /perk/i.test(papers), 'the leader papers should show thirst and perks');
  await cdp.eval(`document.querySelector('#mBtns button').click()`);

  await cdp.eval(`document.querySelector('.tabs button[data-tab="market"]').click()`);
  const traded = await cdp.eval(`(() => {
    const before = window.F.state().meat;
    const btn = [...document.querySelectorAll('#market button')].find(b => /Buy meat/i.test(b.innerText));
    if (!btn || btn.disabled) return { disabled: true, before };
    btn.click();
    return { disabled: false, before, after: window.F.state().meat, bad: window.F.problems() };
  })()`);
  check(!traded.disabled && traded.after > traded.before, 'the gate should sell meat for grain');
  check(!traded.bad || traded.bad.length === 0, 'trade left bad numbers');

  await cdp.eval(`document.querySelector('.tabs button[data-tab="build"]').click()`);
  await cdp.eval(`[...document.querySelectorAll('#builds button')].find(b => /Windmill/i.test(b.innerText)).click()`);
  const placing = await cdp.eval(`!!document.querySelector('#builds button.placing')`);
  check(placing, 'choosing the windmill should arm placement');
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  const cancelled = await cdp.eval(`!document.querySelector('#builds button.placing')`);
  check(cancelled, 'Escape should cancel placement');

  await cdp.eval(`[...document.querySelectorAll('#builds button')].find(b => /Windmill/i.test(b.innerText)).click()`);
  const map = await cdp.eval(`(() => {
    const r = document.getElementById('map').getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  })()`);
  let placed = false;
  for (let gy = 0.28; gy <= 0.62 && !placed; gy += 0.08) {
    for (let gx = 0.52; gx <= 0.74 && !placed; gx += 0.06) {
      const x = map.x + map.w * gx;
      const y = map.y + map.h * gy;
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      placed = await cdp.eval(`window.F.state().building === 'windmill'`);
    }
  }
  check(placed, 'clicking open ground should start the windmill');
  const built = await cdp.eval(`window.F.step(8)`);
  check(built.errs.length === 0, 'week step errors: ' + (built.errs || []).join(' | '));
  check(built.built.includes('windmill'), 'the windmill should finish after its weeks of labor');
  check(built.bad.length === 0, 'after the build: ' + built.bad.join('; '));

  await cdp.eval(`document.querySelector('.tabs button[data-tab="rule"]').click()`);
  await cdp.eval(`[...document.querySelectorAll('#court button')].find(b => /scapegoat/i.test(b.innerText)).click()`);
  const court = await cdp.eval(`({
    title: document.getElementById('mTitle').textContent,
    n: document.querySelectorAll('#mBtns button').length
  })`);
  check(/blame/i.test(court.title) && court.n >= 2, 'naming a scapegoat should offer the species');
  await cdp.eval(`document.querySelector('#mBtns button:last-child').click()`);

  const spring = await cdp.eval(`(() => {
    const left = 11 - window.F.state().week;
    const r = window.F.step(Math.max(0, left));
    return { week: r.week, water: r.water, errs: r.errs, bad: r.bad };
  })()`);
  const summer = await cdp.eval(`(() => {
    const r = window.F.step(23 - window.F.state().week);
    return { week: r.week, season: r.season, water: r.water, errs: r.errs, bad: r.bad, alive: r.alive };
  })()`);
  const winter = await cdp.eval(`(() => {
    const r = window.F.step(47 - window.F.state().week);
    const young = window.F.roster().filter(a => a.age < 50 && ['horse','donkey','cow','goat','sheep','hen'].includes(a.species));
    return { week: r.week, water: r.water, errs: r.errs, bad: r.bad, alive: r.alive, young: young.length,
      food: r.food, grass: r.grass, meat: r.meat };
  })()`);
  check(spring.errs.length + summer.errs.length + winter.errs.length === 0, 'season steps threw');
  check(spring.bad.length + summer.bad.length + winter.bad.length === 0, 'NaN or negative stocks across the year');
  check(summer.season === 'Summer' && summer.water < spring.water, 'summer should drain the waterhole (' + spring.water + ' → ' + summer.water + ')');
  check(winter.water > summer.water, 'the hole should refill after summer (' + summer.water + ' → ' + winter.water + ')');
  check(winter.young > 0, 'horses, grazers or hens should be born within a year');
  check(winter.alive >= 8 && winter.alive <= 46, 'population should stay inside the cap, got ' + winter.alive);
  check(winter.food >= 0 && winter.grass >= 0 && winter.meat >= 0, 'stocks went negative');

  const both = await cdp.eval(`({
    j: document.getElementById('feedJ').innerText.length,
    o: document.getElementById('feedO').innerText.length,
    foodW: document.getElementById('chFood').width,
    moodW: document.getElementById('chMood').width
  })`);
  check(both.j > 30 && both.o > 30, 'journal and official history should both keep writing');
  check(both.foodW > 20 && both.moodW > 20, 'the mood charts should have painted');

  const pausedAt = await cdp.eval(`window.F.state().week`);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space' });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space' });
  await delay(500);
  const paused = await cdp.eval(`({
    week: window.F.state().week,
    water: window.F.state().water,
    paused: document.getElementById('spPause').classList.contains('paused')
  })`);
  check(paused.paused && paused.week === pausedAt, 'Space should freeze the week');

  await cdp.eval(`document.getElementById('spPlus').click()`);
  await cdp.eval(`document.getElementById('spPlus').click()`);
  const advanced = await (async () => {
    const start = await cdp.eval(`window.F.state().week`);
    const t = Date.now();
    while (Date.now() - t < 1600) {
      const open = await cdp.eval(`document.getElementById('modal').classList.contains('on')`);
      if (open) await cdp.eval(`document.querySelector('#mBtns button') && document.querySelector('#mBtns button').click()`);
      await delay(80);
    }
    const end = await cdp.eval(`window.F.state()`);
    return { start, end: end.week, bad: await cdp.eval(`window.F.problems()`) };
  })();
  check(advanced.end > advanced.start, 'the clock should advance at a higher speed');
  check(advanced.bad.length === 0, 'realtime play left bad numbers: ' + advanced.bad.join('; '));

  await cdp.send('Page.navigate', { url: pageUrl });
  await waitFor(cdp, `!!document.getElementById('beginBtn')`);
  await cdp.eval(`document.getElementById('beginBtn').click()`);
  await waitFor(cdp, `!!document.querySelector('#mBody button[data-sp="dog"]')`);
  await cdp.eval(`document.querySelector('#mBody button[data-sp="dog"]').click()`);
  await waitFor(cdp, `!document.getElementById('modal').classList.contains('on')`);
  const dogs = await cdp.eval(`(() => {
    window.F.decree('vote');
    const open = document.getElementById('modal').classList.contains('on');
    const body = document.getElementById('mBody').innerText;
    const title = document.getElementById('mTitle').textContent;
    document.querySelector('#mBtns button')?.click();
    window.F.decree('depose');
    const after = window.F.state();
    return { open, title, body, leader: after.leader, alive: after.alive, rulers: after.rulers, bad: window.F.problems() };
  })()`);
  check(dogs.rulers === 'dogs', 'choosing a dog should set the constitution to the dogs');
  check(/election/i.test(dogs.title) && /%/.test(dogs.body), 'a dog ballot should be contested, got ' + dogs.title + ' / ' + dogs.body.slice(0, 140));
  check(dogs.leader && dogs.alive >= 8, 'deposing the dog leader should pass the farmhouse on');
  check(dogs.bad.length === 0, 'dog rule left bad numbers: ' + dogs.bad.join('; '));
  check(cdp.errors.length === 0, 'console errors: ' + cdp.errors.join(' | '));

  if (failures.length) {
    console.error('smoke failed:');
    for (const f of failures) console.error('  - ' + f);
    process.exitCode = 1;
  } else {
    console.log('smoke ok — choose, levers, constitution, decrees, election, herd, build, market, court, a full year, pause, dog ballot');
  }
} catch (err) {
  console.error('smoke crashed: ' + (err && err.stack || err));
  process.exitCode = 1;
} finally {
  await new Promise(resolve => {
    chrome.once('exit', resolve);
    chrome.kill('SIGKILL');
    setTimeout(resolve, 1500);
  });
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADEQUATE, BASES, CATEGORIES, EEA, NOTICE, POINTS, RULES, SAFEGUARDS, SOURCES, pointPage, source } from '../src/index.js';
import { configOf } from './helpers.js';

// The public pages the checks rest on: every page of src/data.js is listed in research/sources.md and in
// docs/rules-and-sources.md, every rule names points that exist, and no point is a long quote.

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const read = (rel) => readFile(resolve(root, rel), 'utf8');

test('data: every page has an id, a title and an https address, and every point names a page', () => {
  assert.equal(new Set(SOURCES.map((s) => s.id)).size, SOURCES.length);
  for (const s of SOURCES) {
    assert.match(s.url, /^https:\/\/[a-z0-9.-]+\//, s.id);
    assert.ok(s.title.length > 10, s.id);
  }
  for (const [key, p] of Object.entries(POINTS)) {
    assert.ok(source(p.source), `${key}: ${p.source}`);
    assert.equal(pointPage(key).id, p.source);
    assert.ok(p.text.length < 300, `${key} is short`);
    assert.ok(!/"[^"]{20,}"/.test(p.text), `${key} is written in this project's own words, with no long quotation`);
  }
  for (const s of SOURCES) assert.ok(Object.values(POINTS).some((p) => p.source === s.id), `${s.id} is used by a point`);
  for (const n of [4, 5, 6, 7, 9, 10, 28, 30, 44, 45, 46, 49]) assert.ok(SOURCES.some((s) => s.url === `https://gdpr-info.eu/art-${n}-gdpr/`), `Article ${n}`);
});

test('data: the six lawful bases, the special categories and the criminal offence data, and the kinds of safeguard', () => {
  assert.deepEqual(BASES.map((b) => b.point), ['6(1)(a)', '6(1)(b)', '6(1)(c)', '6(1)(d)', '6(1)(e)', '6(1)(f)']);
  assert.equal(CATEGORIES.filter((c) => c.article === 9).length, 8);
  assert.deepEqual(CATEGORIES.filter((c) => c.article === 10).map((c) => c.name), ['criminal convictions and offences']);
  assert.ok(SAFEGUARDS.every((s) => /^Article \d/.test(s.point)));
  assert.ok(EEA.every((c) => /^[A-Z]{2}$/.test(c.code)) && ADEQUATE.every((c) => /^[A-Z]{2}$/.test(c.code)));
});

test('data: every rule names points that exist, the ids and keys are unique, and every rule says what to change', () => {
  for (const r of RULES) {
    assert.ok(r.basis.length > 0, r.id);
    for (const k of r.basis) assert.ok(POINTS[k], `${r.id}: ${k}`);
    assert.match(r.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(typeof r.rule(configOf()), 'string');
    assert.equal(typeof r.rule({ ...configOf(), requireConsentReference: true, locationAliases: { x: 'DE' } }), 'string');
    assert.ok(r.own.length > 20, r.id);
    assert.ok(r.fix.length > 10, r.id);
    assert.ok(r.title.length > 10, r.id);
  }
  assert.equal(new Set(RULES.map((r) => r.id)).size, RULES.length);
  assert.equal(new Set(RULES.filter((r) => r.key).map((r) => r.key)).size, RULES.filter((r) => r.key).length);
  const used = new Set(RULES.flatMap((r) => r.basis));
  for (const k of Object.keys(POINTS).filter((x) => !used.has(x))) assert.ok(['csvInjection', 'githubAnnotations'].includes(k), `${k} is used by no rule`);
  assert.ok(NOTICE.startsWith('This check reads the data map as it is written.'));
  assert.ok(NOTICE.includes('not legal advice'));
  assert.ok(NOTICE.includes('docs/limits.md'));
});

test('research/sources.md: lists every page with its address, in its own words', async () => {
  const note = await read('research/sources.md');
  for (const s of SOURCES) assert.ok(note.includes(s.url), s.url);
  assert.ok(note.includes('Each page was fetched and read before it was listed.'));
  const quotes = note.match(/"[^"]{60,}"/g) ?? [];
  assert.deepEqual(quotes, [], 'no long quotation');
  assert.ok(!note.includes('\r'));
});

test('docs/rules-and-sources.md: every rule with its points and its fix, and every page', async () => {
  const doc = await read('docs/rules-and-sources.md');
  for (const r of RULES) {
    assert.ok(doc.includes(`### \`${r.id}\``), r.id);
    for (const k of r.basis) assert.ok(doc.includes(POINTS[k].text.slice(1)), `${r.id}: ${k}`);
    assert.ok(doc.includes(r.fix.slice(1)), `${r.id}: fix`);
  }
  for (const s of SOURCES) assert.ok(doc.includes(s.url), s.url);
  for (const b of BASES) assert.ok(doc.includes(`| \`${b.name}\` |`), b.name);
});

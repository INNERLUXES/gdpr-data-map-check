import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLEAN, EXPECTED, MESSY, UNWANTED, run } from '../tools/example.mjs';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const saved = (name) => readFile(resolve(root, 'examples/output', name), 'utf8');

test('examples: the messy data map fails with the report that is saved in examples/output', async () => {
  const r = await run(MESSY);
  assert.equal(r.code, 1);
  assert.equal(r.err, '');
  assert.equal(r.out, await saved('messy.txt'));
  for (const e of EXPECTED) assert.ok(r.out.includes(e), e);
  for (const u of UNWANTED) assert.ok(!r.out.includes(u), u);
});

test('examples: the clean data map passes with the report that is saved', async () => {
  const r = await run(CLEAN);
  assert.equal(r.code, 0);
  assert.equal(r.out, await saved('clean.txt'));
  assert.match(r.out, /\nfindings: 0\n/);
  assert.equal((await run([...CLEAN, '--fail-on', 'info'])).code, 0);
  assert.equal((await run([...CLEAN, '--config', 'examples/config.json'])).code, 0, 'the clean map passes the stricter configuration too');
});

test('examples: --explain, JSON, CSV, the GitHub commands and the defaults are the reports that are saved', async () => {
  assert.equal((await run([...MESSY, '--explain'])).out, await saved('messy-explain.txt'));
  assert.equal((await run([...MESSY, '--json', '--explain'])).out, await saved('messy.json'));
  assert.equal((await run([...MESSY, '--format', 'csv'])).out, await saved('messy-problems.csv'));
  assert.equal((await run([...MESSY, '--format', 'github'])).out, await saved('messy-github.txt'));
  assert.equal((await run(['--print-defaults'])).out, await saved('defaults.json'));
});

test('examples: the rules that fire on the messy data map, each on the line built for it', async () => {
  const report = JSON.parse((await run([...MESSY, '--json'])).out);
  const lines = (await readFile(resolve(root, 'examples/messy/data-map.csv'), 'utf8')).split('\n');
  // The line of the first row whose field is this one.
  const at = (field) => `examples/messy/data-map.csv:${lines.findIndex((l) => l.split(',')[2] === field) + 1}`;
  const byRule = {};
  for (const f of report.findings) (byRule[f.rule] ??= []).push(f.at);
  assert.deepEqual(byRule, {
    'missing-lawful-basis': [at('date of birth')],
    'special-category-without-condition': [at('sick notes')],
    'open-ended-retention': [at('face photo')],
    'missing-purpose': [at('call notes')],
    'transfer-without-safeguard': [at('call notes'), at('phone number')],
    'unknown-lawful-basis': [at('customer id')],
    'unknown-safeguard': [at('device id')],
    'invalid-record': [at('fax')],
    'unclear-retention': [at('date of birth')],
    'adequacy-unconfirmed': [at('marketing opt-in')],
    'consent-without-reference': [at('marketing opt-in')],
    'processor-without-agreement': [at('card token')],
    'duplicate-row': [`examples/messy/data-map.csv:${lines.findIndex((l) => l.endsWith(',second export')) + 1}`],
    'criminal-offence-data': [at('background check')],
    'missing-owner': [at('phone number')],
    'missing-category': [at('ip address')],
    'missing-location': [at('ip address')],
    'derogation-transfer': [at('gift note address')]
  });
  assert.deepEqual(report.map.systems.map((s) => s.system), ['shop', 'hr', 'support', 'analytics', 'marketing']);
});

test('examples: the same files written with CRLF line ends give the same output', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'gdpr-data-map-check-crlf-'));
  try {
    await cp(resolve(root, 'examples'), resolve(dir, 'examples'), { recursive: true });
    const walk = async (sub) => {
      for (const e of await readdir(resolve(dir, sub), { withFileTypes: true })) {
        const rel = `${sub}/${e.name}`;
        if (e.isDirectory()) {
          if (e.name !== 'output') await walk(rel);
        } else if (!e.name.endsWith('.md')) {
          const t = (await readFile(resolve(dir, rel), 'utf8')).split('\r\n').join('\n');
          await writeFile(resolve(dir, rel), t.split('\n').join('\r\n'));
        }
      }
    };
    await walk('examples');
    assert.equal((await run([...MESSY, '--explain'], dir)).out, await saved('messy-explain.txt'));
    assert.equal((await run(CLEAN, dir)).out, await saved('clean.txt'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

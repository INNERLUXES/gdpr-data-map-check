// Shared test helpers: data maps built inline, checked in memory or written into a temporary folder that is removed
// after the test. Paths are built with resolve() from forward-slash names, so the same test runs on Linux, macOS and
// Windows. The line a test expects is found with lineOf(), which counts lines the way the tool does, so a test never
// holds a line number worked out by hand for one system only. No test reads the clock, the time zone or the locale.

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { FIELDS, buildReport, csvField, defaultConfig, fileKind, lineStarts, main, positionOf, readConfig, readDataMap } from '../src/index.js';

export async function withFiles(files, fn) {
  const dir = await mkdtemp(resolve(tmpdir(), 'gdpr-data-map-check-'));
  try {
    for (const [rel, content] of Object.entries(files)) {
      await mkdir(dirname(resolve(dir, rel)), { recursive: true });
      await writeFile(resolve(dir, rel), content);
    }
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function offsetOf(text, needle, n) {
  let at = -1;
  for (let i = 0; i < n; i += 1) {
    at = text.indexOf(needle, at + 1);
    if (at < 0) throw new Error(`${needle} is not in the text ${n} times`);
  }
  return at;
}

// The line (from 1) of the n-th place where needle starts in text.
export const lineOf = (text, needle, n = 1) => positionOf(lineStarts(text), offsetOf(text, needle, n)).line;

// The column (from 1) of the n-th place where needle starts in text.
export const columnOf = (text, needle, n = 1) => positionOf(lineStarts(text), offsetOf(text, needle, n)).column;

// The configuration of a configuration object, through the real reader, or the defaults.
export const configOf = (object = null) => (object === null ? defaultConfig() : readConfig(JSON.stringify(object), 'config.json'));

// The header every data map of the tests uses, one column per field in the order of FIELDS.
export const HEADER = 'system,store,field,category,subjects,purpose,lawful basis,special condition,retention,processor,agreement,location,recipient location,safeguard,consent reference,owner';

// A record with nothing to report: every test changes only the fields it is about.
export const GOOD = { system: 'app', store: 'users', field: 'email', category: 'contact', subjects: 'customers', purpose: 'sign in', lawfulBasis: 'contract', specialCondition: '', retention: '1 year', processor: '', agreement: '', location: 'DE', recipientLocation: '', safeguard: '', consentReference: '', owner: 'team' };

// One CSV row of a record: the good record with these fields changed.
export const row = (changes = {}) => FIELDS.map((f) => csvField({ ...GOOD, ...changes }[f])).join(',');

// A CSV data map with the header and one row per object of changes.
export const csv = (...records) => `${HEADER}\n${records.map(row).join('\n')}\n`;

// A JSON data map of these records.
export const json = (...records) => `${JSON.stringify({ records }, null, 2)}\n`;

// The report object of data maps checked in memory: an object of path to text, with a configuration object or none.
export function reportOf(sources, config = null, { minSeverity = 'info', failOn = 'error' } = {}) {
  const cfg = configOf(config);
  const files = Object.entries(sources).map(([file, text]) => readDataMap(text, file, fileKind(file)));
  return buildReport({ input: { paths: Object.keys(sources) }, files, config: cfg, minSeverity, failOn, version: 'test' });
}

// The report object of one CSV data map of these records, each written as an object of changes to the good record.
export const checkOf = (records, config = null, options = {}) => reportOf({ 'map.csv': csv(...records) }, config, options);

// The findings of a report, of one rule or of all.
export const findingsOf = (r, rule) => r.findings.filter((f) => !rule || f.rule === rule);

// The rule ids of the findings of a report, in order.
export const rulesOf = (r) => r.findings.map((f) => f.rule);

// The rule ids of the findings of a report, sorted.
export const sortedRules = (r) => rulesOf(r).sort();

// Writes the files and runs the command line with these arguments (paths relative to the folder).
export async function run(files, args = [], limits) {
  return withFiles(files, async (dir) => {
    let out = '';
    let err = '';
    const code = await main(args, { out: (t) => { out += t; }, err: (t) => { err += t; } }, limits, dir);
    return { code, out, err, dir };
  });
}

// Runs the command line with exactly these arguments, in a folder.
export async function cli(argv, dir) {
  let out = '';
  let err = '';
  const code = await main(argv, { out: (t) => { out += t; }, err: (t) => { err += t; } }, undefined, dir);
  return { code, out, err };
}

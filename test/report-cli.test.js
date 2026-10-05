import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { KIND_NAMES, NOTICE, USAGE, VERSION, escapeData, escapeProperty, parseArgs, toGithub, toJson, toText } from '../src/index.js';
import { HEADER, checkOf, cli, columnOf, csv, json, reportOf, run, withFiles } from './helpers.js';

const CLEAN = { 'map.csv': csv({}, { field: 'phone' }) };
const WARN = { 'map.csv': csv({ owner: '' }, { field: 'phone' }) };
const BROKEN = { 'map.csv': 'field,purpose\n"open\n' };

test('cli: exit 0 below the fail-on level, 1 at or above it, from the flag or the configuration', async () => {
  const clean = await run(CLEAN, ['map.csv']);
  assert.equal(clean.code, 0, clean.err);
  assert.match(clean.out, /^gdpr-data-map-check: map\.csv\ninput: map\.csv \(1 file: 1 CSV data map; 2 records\)\nconfig: built-in defaults: 13 lawful basis aliases, 27 category aliases, 0 location aliases; consent reference not required; minimum severity info; fail on error\nrules: missing-purpose \(error\); /);
  assert.match(clean.out, /\nmap: 2 records in 1 system: 0 special category, 0 criminal offence, 0 transfers out of the EU\/EEA, 0 with a processor or recipient\nlawful bases: contract 2\nfindings: 0\n/);
  assert.match(clean.out, /RESULT: PASS - no finding at or above error\n$/);
  assert.equal(clean.err, '');
  const warn = await run(WARN, ['map.csv']);
  assert.equal(warn.code, 0, 'a warning does not fail the run by default');
  assert.equal((await run(WARN, ['map.csv', '--fail-on', 'warning'])).code, 1);
  assert.equal((await run(CLEAN, ['map.csv', '--fail-on', 'info'])).code, 0, 'nothing at all to report');
  const configured = await run({ ...WARN, 'c.json': '{"failOn": "warning"}' }, ['map.csv', '--config', 'c.json']);
  assert.equal(configured.code, 1);
  assert.match(configured.out, /RESULT: FAIL - 1 finding at or above warning \(1 warning\)\n$/);
  assert.equal((await run({ ...WARN, 'c.json': '{"failOn": "warning"}' }, ['map.csv', '--config', 'c.json', '--fail-on', 'error'])).code, 0, 'the flag wins over the configuration');
  const broken = await run(BROKEN, ['map.csv']);
  assert.equal(broken.code, 1, 'a file that cannot be parsed fails the run at the default level');
  assert.match(broken.out, /ERROR {4}unparsable-file +map\.csv:2\n {11}line 2, column 1: a quoted field that is not closed; a field that starts with a double quote must end with one; nothing in the file is read/);
});

test('cli: several data maps are read together, CSV and JSON, as one map', async () => {
  const files = { 'a.csv': csv({ system: 'crm' }), 'b.json': json({ system: 'erp', field: 'iban', category: 'financial', purpose: 'payouts', lawfulBasis: 'contract', retention: '10 years', location: 'NL', owner: 'f' }, { system: 'crm', field: 'phone', category: 'contact', purpose: 'calls', lawfulBasis: 'consent', retention: '1 year', location: 'US', safeguard: 'SCCs', owner: 's' }) };
  const r = await run(files, ['a.csv', 'b.json', '--json']);
  assert.equal(r.code, 0, r.err);
  const out = JSON.parse(r.out);
  assert.deepEqual(out.input.paths, ['a.csv', 'b.json']);
  assert.deepEqual(out.input.files, [{ file: 'a.csv', kind: 'csv', read: true, rows: 1, records: 1 }, { file: 'b.json', kind: 'json', read: true, rows: 2, records: 2 }]);
  assert.deepEqual(out.input.byKind, { csv: 1, json: 1 });
  assert.deepEqual(out.map.systems.map((s) => [s.system, s.records, s.transfers]), [['crm', 2, 1], ['erp', 1, 0]]);
});

test('cli: exit 2 for usage errors, with the usage and nothing on standard output', async () => {
  for (const [args, message] of [
    [[], /give the data map to check: one or more \.csv or \.json files/],
    [['map.csv', 'map.csv'], /map\.csv is named twice/],
    [['map.csv', '--bogus'], /unknown argument --bogus/],
    [['map.csv', '--format', 'xml'], /unknown format xml \(text, json, csv or github\)/],
    [['map.csv', '--format', 'json', '--format', 'text'], /--format was given twice/],
    [['map.csv', '--json', '--format', 'csv'], /--json and --format csv ask for two formats; give one/],
    [['map.csv', '--min-severity', 'notice'], /--min-severity: unknown level notice \(info, warning, error\)/],
    [['map.csv', '--fail-on', 'fatal'], /--fail-on: unknown level fatal/],
    [['map.csv', '--fail-on', 'error', '--fail-on', 'info'], /--fail-on was given twice/],
    [['map.csv', '--config'], /--config needs a value/],
    [['map.csv', '--config', '--json'], /--config needs a value/],
    [['map.csv', '--explain', '--format', 'github'], /--explain adds the sources of each finding to the text and JSON reports; the github format has no place for them/],
    [['map.csv', '--explain', '--format', 'csv'], /the csv format has no place for them/],
    [['-'], /reading from standard input is not supported/],
    [['map.csv', '--config', '-'], /reading from standard input is not supported/],
    [['https://example.com/map.csv'], /give a local path; the tool never fetches a URL/],
    [['map.csv', '--config', 'file://c.json'], /give a local path/]
  ]) {
    const r = await run(CLEAN, args);
    assert.equal(r.code, 2, args.join(' '));
    assert.match(r.err, message, args.join(' '));
    assert.ok(r.err.includes('Usage: gdpr-data-map-check'), args.join(' '));
    assert.equal(r.out, '');
  }
  assert.throws(() => parseArgs(Array.from({ length: 101 }, (_, i) => `p${i}.csv`)), /more than 100 files/);
});

test('cli: exit 2 for input errors, with the problems and no result', async () => {
  for (const [files, args, message] of [
    [CLEAN, ['missing.csv'], /missing\.csv: no such file/],
    [{ ...CLEAN, 'dir/x.csv': 'field\n' }, ['dir'], /dir: is a folder; give the data map file itself/],
    [{ 'map.txt': 'field\n' }, ['map.txt'], /map\.txt: not a kind of file the tool reads \(a name ending in \.csv or \.json\)/],
    [{ '.csv': 'field\n' }, ['.csv'], /\.csv: not a kind of file the tool reads/],
    [CLEAN, ['map.csv', './map.csv'], /map\.csv: is named twice/],
    [{ ...CLEAN, 'c.json': '{"failOm": "info"}' }, ['map.csv', '--config', 'c.json'], /c\.json: line 1: "failOm" is not a key of the configuration; did you mean "failOn"\?/],
    [CLEAN, ['map.csv', '--config', 'nope.json'], /nope\.json: no such file/],
    [{ ...CLEAN, 'd/c.json': '{}' }, ['map.csv', '--config', 'd'], /d: is a folder; give the data map file itself/]
  ]) {
    const r = await run(files, args);
    assert.equal(r.code, 2, `${args.join(' ')}: ${r.err}`);
    assert.match(r.err, /^gdpr-data-map-check: no result, the input has (?:a problem|problems):\n/);
    assert.match(r.err, message);
    assert.equal(r.out, '');
  }
});

test('cli: a binary, UTF-16 or invalid UTF-8 file, or one over its limit, is an error finding, and the rest is still read', async () => {
  const r = await run({ ...WARN, 'j.csv': Buffer.from([0x66, 0, 0x64]), 'k.json': Buffer.from([0xff, 0xfe, 0x5b, 0]), 'l.csv': Buffer.from([0x66, 0x64, 0xe9, 0x0a]) }, ['map.csv', 'j.csv', 'k.json', 'l.csv']);
  assert.equal(r.code, 1);
  assert.match(r.out, /j\.csv:1\n {11}the file cannot be read: holds binary data \(a null byte\); only text is read; export the sheet as CSV; nothing in it is checked/);
  assert.match(r.out, /the file cannot be read: is UTF-16; only UTF-8 is read/);
  assert.match(r.out, /the file cannot be read: is not valid UTF-8; only UTF-8 text is read/);
  assert.match(r.out, /the field "email" of app\/users has no owner/);
  const big = await run(CLEAN, ['map.csv'], { maxFileBytes: 10 });
  assert.match(big.out, /the file cannot be read: \d+ bytes is over the 10 byte limit/);
  const one = CLEAN['map.csv'].length;
  const total = await run({ 'x.csv': CLEAN['map.csv'], 'y.csv': CLEAN['map.csv'] }, ['x.csv', 'y.csv'], { maxTotalBytes: one });
  assert.equal(total.code, 2);
  assert.match(total.err, /y\.csv: the files read so far hold more than [\d,]+ bytes, the limit of one run/);
});

test('cli: --help, --version and --print-defaults', async () => {
  const help = await cli(['--help'], '.');
  assert.equal(help.code, 0);
  assert.equal(help.out, USAGE);
  for (const s of ['--fail-on', '--min-severity', '--format', 'github', 'csv', 'missing-owner (rules.missingOwner)', 'unparsable-file (always error)', 'not legal advice', 'Exit codes: 0 no finding at or above the fail-on level']) assert.ok(USAGE.includes(s), s);
  const version = await cli(['--version'], '.');
  assert.equal(version.out, `${VERSION}\n`);
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  const defaults = await cli(['--print-defaults'], '.');
  assert.equal(defaults.code, 0);
  assert.deepEqual(Object.keys(JSON.parse(defaults.out)), ['name', 'rules', 'lawfulBasisAliases', 'categoryAliases', 'locationAliases', 'requireConsentReference', 'minSeverity', 'failOn']);
});

test('text: the systems, the transfers, the findings with the fix, and --explain', () => {
  const r = checkOf([{ system: 'crm', category: 'health' }, { system: 'crm', field: 'phone', location: 'Japan', safeguard: 'adequacy' }, { system: 'erp', store: '', field: 'iban', recipientLocation: 'US; India', safeguard: 'SCCs' }]);
  const out = toText(r);
  assert.ok(out.includes('Systems (2)\n\n  system  records  special  criminal  transfers  findings\n  crm     2        1        0         1          1\n  erp     1        0        0         1          0\n\n'));
  assert.ok(out.includes('Transfers out of the EU/EEA (2)\n\n  system  store  field  to            safeguard  at\n  crm     users  phone  Japan (JP)    adequacy   map.csv:3\n  erp     -      iban   US and India  SCCs       map.csv:4\n\n'));
  assert.match(out, /\n {2}ERROR {4}special-category-without-condition {2}map\.csv:2\n {11}the field "email" of crm\/users is special category data \(health\) and names no condition of Article 9\(2\)\n {11}fix: name the condition of Article 9\(2\)/);
  assert.ok(out.includes(NOTICE));
  assert.ok(out.includes('not legal advice'));
  assert.ok(!out.includes('basis:'));
  const explained = toText(r, { explain: true });
  assert.match(explained, /\n {11}rule: a record whose category is one of the eight special categories of Article 9\(1\), or one of the 22 aliases for them, with an empty special category condition\n {11}basis: processing data that reveals racial or ethnic origin.+ \(Art\. 9 GDPR, Processing of special categories of personal data \(gdpr-info\.eu\), https:\/\/gdpr-info\.eu\/art-9-gdpr\/\)\n/);
  assert.match(explained, /the tool's own choice: a category is special when its name/);
  const empty = toText(reportOf({ 'x.csv': 'field\n' }));
  assert.ok(empty.includes('Systems (0)\n\n  none\n'));
  assert.ok(empty.includes('Transfers out of the EU/EEA (0)\n\n  none\n'));
  assert.ok(empty.includes('Findings (0)\n\n  none\n'));
  assert.ok(empty.includes('lawful bases: none\n'));
  assert.deepEqual(KIND_NAMES.json, ['JSON data map', 'JSON data maps']);
  assert.ok(toText(checkOf([{ system: '' }])).includes('\n  (no system)  1 '));
});

test('json: the whole report, without the sources unless --explain', () => {
  const r = checkOf([{ owner: '' }, { field: 'phone', location: 'US', safeguard: 'SCCs' }]);
  const out = JSON.parse(toJson(r));
  assert.deepEqual(Object.keys(out), ['tool', 'version', 'input', 'config', 'map', 'findings', 'totals', 'result', 'notes', 'notice']);
  assert.deepEqual(Object.keys(out.findings[0]), ['rule', 'level', 'file', 'line', 'column', 'at', 'system', 'store', 'field', 'found', 'fix']);
  assert.deepEqual(Object.keys(out.map), ['records', 'systems', 'byBasis', 'byCategory', 'special', 'criminal', 'processors', 'transfers']);
  assert.deepEqual(out.map.transfers[0], { system: 'app', store: 'users', field: 'phone', file: 'map.csv', line: 3, to: ['US'], safeguard: 'SCCs' });
  assert.ok(JSON.parse(toJson(r, { explain: true })).findings[0].basis.length > 0);
  assert.deepEqual(out.result, { pass: true, failOn: 'error', failing: 0, byLevel: { error: 0, warning: 1, info: 0 }, text: 'PASS - no finding at or above error (1 warning)' });
  assert.equal(out.tool, 'gdpr-data-map-check');
});

test('github: one workflow command per finding, with its properties and message escaped, then a summary line', () => {
  const row = 'app,users,email,contact,c,p,"100%\n::error",,1 year,,,DE,,,,';
  const r = reportOf({ 'a,b:c.csv': `${HEADER}\n${row}\n` });
  const lines = toGithub(r).trimEnd().split('\n');
  assert.equal(lines.length, 3, 'the line break in the lawful basis starts no command');
  assert.equal(lines[0], `::error file=a%2Cb%3Ac.csv,line=2,col=${columnOf(row, '"100%')},title=gdpr-data-map-check unknown-lawful-basis::the field "email" of app/users has the lawful basis "100%25 ::error", which is not one of the six of Article 6(1) or a known alias; fix: write one of the six lawful bases, or add the words your team uses to lawfulBasisAliases in the configuration`);
  assert.match(lines[1], /^::warning file=a%2Cb%3Ac\.csv,line=3,col=\d+,title=gdpr-data-map-check missing-owner::the field "email" of app\/users has no owner; fix: /);
  assert.equal(lines[2], 'gdpr-data-map-check: a,b:c.csv: 1 record, 1 system, 2 findings; RESULT: FAIL - 1 finding at or above error (1 error, 1 warning)');
  const info = toGithub(checkOf([{ location: 'MA', safeguard: 'derogation' }]));
  assert.match(info, /^::notice file=map\.csv,line=2,col=\d+,title=gdpr-data-map-check derogation-transfer::/);
  assert.equal(escapeData('a%\r\nb'), 'a%25%0D%0Ab');
  assert.equal(escapeProperty('a:b,c'), 'a%3Ab%2Cc');
});

test('cli: a run writes nothing to disk', async () => {
  await withFiles(WARN, async (dir) => {
    const before = await readdir(resolve(dir), { recursive: true });
    for (const format of ['text', 'json', 'csv', 'github']) assert.equal((await cli(['map.csv', '--format', format], dir)).code, 0);
    assert.deepEqual(await readdir(resolve(dir), { recursive: true }), before);
  });
});

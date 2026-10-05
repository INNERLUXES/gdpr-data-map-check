// Runs the README examples, checks that they report what the README shows, and writes the reports of the two made-up
// data maps to examples/output. CI runs it and then fails if those files changed, so the example output in the
// repository is always the real output.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from '../src/index.js';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');

// The arguments of the examples; every path is relative to the root of the repository.
export const MESSY = ['examples/messy/data-map.csv', '--config', 'examples/config.json'];
export const CLEAN = ['examples/clean/data-map.json'];

// Runs the tool on files of the repository; the paths shown in the report are relative to the root of the repository.
export async function run(argv, base = root) {
  let out = '';
  let err = '';
  const code = await main(argv, { out: (t) => { out += t; }, err: (t) => { err += t; } }, undefined, base);
  return { code, out, err };
}

// What the README says of the messy data map: the counts, one finding of every rule that fires, the notes and the
// result.
export const EXPECTED = [
  'input: examples/messy/data-map.csv (1 file: 1 CSV data map; 18 records)',
  'config: examples/config.json (Brindlewick data map): 13 lawful basis aliases, 27 category aliases, 1 location alias; consent reference required; minimum severity info; fail on warning',
  'map: 17 records in 5 systems: 3 special category, 1 criminal offence, 7 transfers out of the EU/EEA, 10 with a processor or recipient',
  'lawful bases: consent 2, contract 5, legal obligation 3, legitimate interests 5, none 1, unknown 1',
  'findings: 19 (9 error, 9 warning, 1 info)',
  'the field "date of birth" of shop/customers has no lawful basis',
  'the field "sick notes" of hr/staff is special category data (health) and names no condition of Article 9(2)',
  'the field "face photo" of hr/staff is kept "forever", with no end',
  'the field "call notes" of support/tickets has no purpose',
  'goes to Germny (not a place the tool knows, so taken as outside the EU/EEA, did you mean "Germany"?), outside the EU/EEA, with no transfer safeguard',
  'the field "phone number" of support/tickets goes to India (not a place the tool knows, so taken as outside the EU/EEA), outside the EU/EEA, with no transfer safeguard',
  'has the lawful basis "goodwill", which is not one of the six of Article 6(1) or a known alias',
  'names the transfer safeguard "Privacy Shield", which is not an adequacy decision',
  'this row has 3 fields and the header has 17; the row is not checked',
  'has the retention "until the account is closed", in which the tool finds no period',
  'goes to US on an adequacy decision, which covers only organisations certified under the EU-US Data Privacy Framework',
  'the field "marketing opt-in" of shop/customers rests on consent and names no consent mechanism',
  'the field "card token" of shop/orders goes to the processor or recipient "Paybridge", and no agreement is named',
  'the field "card token" of shop/orders is listed again with the same purpose; the first record is at examples/messy/data-map.csv:6',
  'the field "background check" of hr/staff is data on criminal convictions and offences',
  'the field "phone number" of support/tickets has no owner',
  'the field "ip address" of analytics/events has no category',
  'the field "ip address" of analytics/events has no storage location',
  'the field "gift note address" of shop/customers goes to Morocco on a derogation of Article 49',
  'note: examples/messy/data-map.csv: 1 column the tool does not read was left out: "notes"',
  'It is an engineering aid, not legal advice',
  'RESULT: FAIL - 18 findings at or above warning (9 error, 9 warning, 1 info)'
];
// A transfer with SCCs, a delivery address in Germany with a basis written as Art. 6(1)(b) and a retention that says
// permanently next to a period, trade union data with its Article 9 condition, a UK transfer on an adequacy decision,
// sick notes kept internally, the cloud region the configuration names as Germany and consent with its reference are
// not reported.
export const UNWANTED = ['RESULT: PASS', '"delivery address" of shop/customers', '"union dues"', 'the field "email" of shop/customers', 'goes to UK', '"Postmarkly"', 'eu-central-1', '"interests" of marketing/leads', '"internal"'];

const problems = [];
function expect(name, result, code, expected, unwanted, stream = 'out') {
  const text = result[stream];
  const missing = expected.filter((e) => !text.includes(e));
  const wrong = unwanted.filter((e) => text.includes(e));
  if (result.code !== code || missing.length || wrong.length) {
    problems.push(`${name}: unexpected report (exit code ${result.code}, expected ${code}; missing: ${missing.join(' / ') || 'none'}; should not appear: ${wrong.join(' / ') || 'none'})${result.err ? `\n${result.err}` : ''}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const messy = await run(MESSY);
  process.stdout.write(messy.out);
  expect('messy data map', messy, 1, EXPECTED, UNWANTED);

  const clean = await run(CLEAN);
  expect('clean data map', clean, 0, ['input: examples/clean/data-map.json (1 file: 1 JSON data map; 5 records)', 'map: 5 records in 3 systems: 1 special category, 0 criminal offence, 2 transfers out of the EU/EEA, 2 with a processor or recipient', 'findings: 0', 'note: examples/clean/data-map.json: 1 key the tool does not read was left out: "library"', 'RESULT: PASS - no finding at or above error'], ['  WARNING  ', '  ERROR  ', 'RESULT: FAIL']);

  // Without the configuration the cloud region is not a place the tool knows, consent needs no reference, and only
  // errors fail the run.
  expect('messy, built-in configuration', await run(['examples/messy/data-map.csv']), 1, ['config: built-in defaults:', 'eu-central-1 and Singapore', 'RESULT: FAIL - 9 findings at or above error'], ['consent-without-reference  ']);
  // The clean data map passes when every level fails the run.
  expect('clean, fail on info', await run([...CLEAN, '--fail-on', 'info']), 0, ['RESULT: PASS - no finding at or above info'], []);
  // Only the errors can be shown.
  expect('messy, errors only', await run([...MESSY, '--min-severity', 'error']), 1, ['findings: 9 (9 error); 10 below error not shown'], ['  WARNING  ']);
  // A file of no kind the tool reads stops the run.
  expect('messy, a README named', await run(['examples/messy/README.md']), 2, ['examples/messy/README.md: not a kind of file the tool reads'], [], 'err');

  // The README shows the whole report of the messy data map, the --explain lines of one finding, the GitHub
  // annotations of two findings, the start of the CSV problem list and the report of the clean data map.
  const readme = (await readFile(resolve(root, 'README.md'), 'utf8')).split('\r\n').join('\n');
  if (!readme.includes(messy.out)) problems.push('README: the sample output of the messy data map differs from a real run');
  if (!readme.includes(clean.out)) problems.push('README: the sample output of the clean data map differs from a real run');

  await mkdir(resolve(root, 'examples/output'), { recursive: true });
  await writeFile(resolve(root, 'examples/output/messy.txt'), messy.out);
  await writeFile(resolve(root, 'examples/output/clean.txt'), clean.out);
  const explain = await run([...MESSY, '--explain']);
  if (explain.code !== 1) problems.push(`explain: exit code ${explain.code}, expected 1`);
  const lines = explain.out.split('\n');
  const at = lines.findIndex((l) => l.includes('special-category-without-condition') && l.includes('data-map.csv:'));
  const sample = lines.slice(at, at + 8).join('\n');
  if (at < 0 || !readme.includes(sample)) problems.push('README: the --explain sample of the special category finding differs from a real run');
  await writeFile(resolve(root, 'examples/output/messy-explain.txt'), explain.out);
  const github = await run([...MESSY, '--format', 'github']);
  if (github.code !== 1) problems.push(`github: exit code ${github.code}, expected 1`);
  const picked = github.out.split('\n').filter((x) => x.includes('title=gdpr-data-map-check special-category-without-condition::') || (x.includes('title=gdpr-data-map-check transfer-without-safeguard::') && x.includes('India')));
  if (picked.length !== 2) problems.push('github: the sample lines are not in the output');
  for (const l of picked) if (!readme.includes(l)) problems.push('README: the GitHub sample differs from a real run');
  await writeFile(resolve(root, 'examples/output/messy-github.txt'), github.out);
  const csv = await run([...MESSY, '--format', 'csv']);
  if (csv.code !== 1) problems.push(`csv: exit code ${csv.code}, expected 1`);
  const head = csv.out.split('\r\n').slice(0, 4).join('\n');
  if (!readme.includes(head)) problems.push('README: the CSV sample differs from a real run');
  await writeFile(resolve(root, 'examples/output/messy-problems.csv'), csv.out);
  const json = await run([...MESSY, '--json', '--explain']);
  if (json.code !== 1) problems.push(`json: exit code ${json.code}, expected 1`);
  await writeFile(resolve(root, 'examples/output/messy.json'), json.out);
  const defaults = await run(['--print-defaults']);
  if (defaults.code !== 0) problems.push(`--print-defaults: exit code ${defaults.code}, expected 0`);
  await writeFile(resolve(root, 'examples/output/defaults.json'), defaults.out);

  if (problems.length) {
    for (const p of problems) console.error(`example: ${p}`);
    process.exit(1);
  }
}

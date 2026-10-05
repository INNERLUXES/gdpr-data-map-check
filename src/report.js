// The reports: text for a terminal, JSON for other tools, and GitHub workflow commands that turn each finding into an
// annotation on the file, line and column. The CSV problem list is in src/csv.js. Every text from the input (a file
// name, a system, a store, a field or any other value) was cleaned by safeText before it reached the report object. The
// GitHub commands also escape the characters a command gives a meaning to, so a text in the input cannot end a command
// early or start another one.

import { KINDS } from './kinds.js';
import { grouped, listText, plural } from './size.js';
import { safeText } from './text.js';

const clean = (t, max = 200) => safeText(t, max);
const pathsText = (r) => r.input.paths.join(', ');

// The kinds of files as the report names them, one and many.
export const KIND_NAMES = { csv: ['CSV data map', 'CSV data maps'], json: ['JSON data map', 'JSON data maps'] };

function inputLine(r) {
  const n = r.input.byKind;
  const kinds = KINDS.filter((k) => n[k]).map((k) => `${grouped(n[k])} ${KIND_NAMES[k][n[k] === 1 ? 0 : 1]}`).join(', ');
  const rows = r.input.files.reduce((a, f) => a + f.rows, 0);
  return `${pathsText(r)} (${plural(r.input.files.length, 'file')}${kinds ? `: ${kinds}` : ''}; ${plural(rows, 'record')})`;
}

function configLine(r) {
  const c = r.config;
  const where = c.file ? `${c.file}${c.name ? ` (${clean(c.name, 120)})` : ''}` : 'built-in defaults';
  const count = (o) => Object.keys(o).length;
  return `${where}: ${plural(count(c.lawfulBasisAliases), 'lawful basis alias', 'lawful basis aliases')}, ${plural(count(c.categoryAliases), 'category alias', 'category aliases')}, ${plural(count(c.locationAliases), 'location alias', 'location aliases')}; consent reference ${c.requireConsentReference ? 'required' : 'not required'}; minimum severity ${c.minSeverity}; fail on ${c.failOn}`;
}

const rulesLine = (r) => r.config.rules.map((x) => `${x.id} (${x.level})`).join('; ');

function mapLine(r) {
  const m = r.map;
  return `${plural(m.records, 'record')} in ${plural(m.systems.length, 'system')}: ${grouped(m.special)} special category, ${grouped(m.criminal)} criminal offence, ${plural(m.transfers.length, 'transfer')} out of the EU/EEA, ${grouped(m.processors)} with a processor or recipient`;
}

const basesLine = (r) => Object.entries(r.map.byBasis).filter(([, n]) => n).map(([k, n]) => `${k} ${grouped(n)}`).join(', ') || 'none';

function findingsLine(r) {
  const b = r.totals.byLevel;
  const parts = ['error', 'warning', 'info'].filter((l) => b[l]).map((l) => `${grouped(b[l])} ${l}`);
  return `${grouped(r.totals.findings)}${parts.length ? ` (${parts.join(', ')})` : ''}${r.totals.hidden ? `; ${grouped(r.totals.hidden)} below ${r.config.minSeverity} not shown` : ''}`;
}

// A table with a header row and its columns padded to the widest cell.
function table(head, rows, indent = '  ') {
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)));
  const line = (cells) => `${indent}${cells.map((c, i) => (i === cells.length - 1 ? c : c.padEnd(widths[i]))).join('  ')}`.trimEnd();
  return [line(head), ...rows.map(line)];
}

const cell = (t, max = 40) => (t === '' || t === null || t === undefined ? '-' : clean(t, max));

function systemLines(r) {
  if (!r.map.systems.length) return ['  none', ''];
  const rows = r.map.systems.map((s) => [s.system === '' ? '(no system)' : cell(s.system), grouped(s.records), grouped(s.special), grouped(s.criminal), grouped(s.transfers), grouped(s.findings)]);
  return [...table(['system', 'records', 'special', 'criminal', 'transfers', 'findings'], rows), ''];
}

function transferLines(r) {
  if (!r.map.transfers.length) return ['  none', ''];
  const rows = r.map.transfers.map((t) => [cell(t.system, 30), cell(t.store, 30), cell(t.field, 30), listText(t.to.map((x) => clean(x, 40)), 3), cell(t.safeguard, 40), `${t.file}:${t.line}`]);
  return [...table(['system', 'store', 'field', 'to', 'safeguard', 'at'], rows), ''];
}

export function toText(r, { explain = false } = {}) {
  const out = [];
  out.push(`gdpr-data-map-check: ${pathsText(r)}`);
  out.push(`input: ${inputLine(r)}`);
  out.push(`config: ${configLine(r)}`);
  out.push(`rules: ${rulesLine(r)}`);
  out.push(`map: ${mapLine(r)}`);
  out.push(`lawful bases: ${basesLine(r)}`);
  out.push(`findings: ${findingsLine(r)}`);
  out.push('', `Systems (${grouped(r.map.systems.length)})`, '');
  out.push(...systemLines(r));
  out.push(`Transfers out of the EU/EEA (${grouped(r.map.transfers.length)})`, '');
  out.push(...transferLines(r));
  out.push(`Findings (${grouped(r.findings.length)})`, '');
  if (!r.findings.length) out.push('  none', '');
  const width = Math.max(...r.config.rules.map((x) => x.id.length));
  const pad = ' '.repeat(11);
  for (const f of r.findings) {
    out.push(`  ${f.level.toUpperCase().padEnd(8)} ${f.rule.padEnd(width)}  ${f.at}`);
    out.push(`${pad}${f.found}`);
    out.push(`${pad}fix: ${f.fix}`);
    if (explain) {
      out.push(`${pad}rule: ${r.config.rules.find((x) => x.id === f.rule).rule}`);
      for (const b of f.basis) out.push(`${pad}basis: ${b.text} (${b.source}, ${b.url})`);
      if (f.own) out.push(`${pad}the tool's own choice: ${f.own}`);
    }
    out.push('');
  }
  for (const n of r.notes) out.push(`note: ${n}`);
  if (r.notes.length) out.push('');
  out.push(r.notice, '');
  out.push(`RESULT: ${r.result.text}`);
  return `${out.join('\n')}\n`;
}

export function toJson(r, { explain = false } = {}) {
  const out = { ...r, findings: r.findings.map((f) => (explain ? f : { ...f, basis: undefined, own: undefined })) };
  return `${JSON.stringify(out, null, 2)}\n`;
}

// The message of a workflow command: %, CR and LF escaped.
export const escapeData = (t) => String(t).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

// A property of a workflow command: also : and , escaped.
export const escapeProperty = (t) => escapeData(t).replace(/:/g, '%3A').replace(/,/g, '%2C');

const COMMANDS = { error: 'error', warning: 'warning', info: 'notice' };

export function toGithub(r) {
  const out = [];
  for (const f of r.findings) {
    const props = [`file=${escapeProperty(f.file)}`, `line=${f.line}`, ...(f.column ? [`col=${f.column}`] : []), `title=${escapeProperty(`gdpr-data-map-check ${f.rule}`)}`];
    out.push(`::${COMMANDS[f.level]} ${props.join(',')}::${escapeData(`${f.found}; fix: ${f.fix}`)}`);
  }
  out.push(`gdpr-data-map-check: ${pathsText(r)}: ${plural(r.map.records, 'record')}, ${plural(r.map.systems.length, 'system')}, ${grouped(r.totals.findings)} ${r.totals.findings === 1 ? 'finding' : 'findings'}; RESULT: ${r.result.text}`);
  return `${out.join('\n')}\n`;
}

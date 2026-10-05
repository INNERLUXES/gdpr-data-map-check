// A data map file read into records. A data map (a record of processing activities, or the list of personal data
// fields behind one) lists one personal data field per record. A CSV data map has a header line that names its columns;
// a JSON data map is a list of records, or an object whose "records" key holds that list. The names of the columns and
// keys are compared in one form (src/words.js fieldForm), so "Lawful Basis", "lawful_basis" and "lawfulBasis" all name
// the lawful basis. Columns and keys the tool does not read are kept out and named in a note. Every value is trimmed of
// white space at both ends. A record that cannot be read (no field, a CSV row with a different number of fields than
// the header, a JSON record that is not an object) is an invalid-record finding and is not checked; a file that cannot
// be read at all is an unreadable-file or unparsable-file finding.

import { CsvError, csvProblem, parseCsv } from './csv.js';
import { JsonError, jsonProblem, parseJson } from './json.js';
import { fieldForm } from './words.js';

export const DATAMAP_LIMITS = { maxRecords: 200000, maxValues: 5000000, maxStringLength: 65536 };

// The fields of a record, in the order the reports show them.
export const FIELDS = ['system', 'store', 'field', 'category', 'subjects', 'purpose', 'lawfulBasis', 'specialCondition', 'retention', 'processor', 'agreement', 'location', 'recipientLocation', 'safeguard', 'consentReference', 'owner'];

// The names of a column or key that give each field, in the form they are compared in.
export const FIELD_NAMES = {
  system: 'system',
  application: 'system',
  app: 'system',
  store: 'store',
  datastore: 'store',
  database: 'store',
  table: 'store',
  field: 'field',
  datafield: 'field',
  dataelement: 'field',
  attribute: 'field',
  column: 'field',
  category: 'category',
  categories: 'category',
  datacategory: 'category',
  personaldatacategory: 'category',
  subjects: 'subjects',
  datasubjects: 'subjects',
  datasubjectcategory: 'subjects',
  purpose: 'purpose',
  purposes: 'purpose',
  processingpurpose: 'purpose',
  lawfulbasis: 'lawfulBasis',
  legalbasis: 'lawfulBasis',
  basis: 'lawfulBasis',
  article6basis: 'lawfulBasis',
  specialcondition: 'specialCondition',
  specialcategorycondition: 'specialCondition',
  article9condition: 'specialCondition',
  condition: 'specialCondition',
  retention: 'retention',
  retentionperiod: 'retention',
  timelimit: 'retention',
  erasure: 'retention',
  processor: 'processor',
  recipient: 'processor',
  recipients: 'processor',
  agreement: 'agreement',
  agreementreference: 'agreement',
  dpa: 'agreement',
  dataprocessingagreement: 'agreement',
  location: 'location',
  storagelocation: 'location',
  country: 'location',
  storagecountry: 'location',
  region: 'location',
  storageregion: 'location',
  recipientlocation: 'recipientLocation',
  recipientcountry: 'recipientLocation',
  processorcountry: 'recipientLocation',
  processorlocation: 'recipientLocation',
  safeguard: 'safeguard',
  transfersafeguard: 'safeguard',
  transfermechanism: 'safeguard',
  consentreference: 'consentReference',
  consentmechanism: 'consentReference',
  consentrecord: 'consentReference',
  owner: 'owner',
  dataowner: 'owner'
};

// The field a column or key names, or null.
export const fieldOf = (name) => (Object.hasOwn(FIELD_NAMES, fieldForm(name)) ? FIELD_NAMES[fieldForm(name)] : null);

const blank = () => Object.fromEntries(FIELDS.map((f) => [f, '']));

// A data map that could not be read: one finding of rule, and no record.
export function unreadableMap(file, kind, rule, line, column, found) {
  return { file, kind, read: false, rows: 0, records: [], problems: [{ rule, file, line, column, found, system: '', store: '', field: '' }], ignored: [] };
}

function fromCsv(text, file, limits) {
  let rows;
  try {
    rows = parseCsv(text, { maxRecords: limits.maxRecords + 1, maxFieldLength: limits.maxStringLength });
  } catch (error) {
    if (!(error instanceof CsvError)) throw error;
    const p = csvProblem(error, text);
    return unreadableMap(file, 'csv', 'unparsable-file', p.line, p.column, `${p.text}; nothing in the file is read`);
  }
  if (!rows.length) return unreadableMap(file, 'csv', 'unparsable-file', 1, 1, 'the file is empty; a header line that names a field column was expected; nothing in the file is read');
  const header = rows[0];
  const columns = [];
  const ignored = [];
  const taken = new Map();
  for (const [i, f] of header.fields.entries()) {
    const name = f.value.trim();
    const field = fieldOf(name);
    if (field === null) {
      ignored.push(name === '' ? `(column ${i + 1}, no name)` : name);
      columns.push(null);
    } else if (taken.has(field)) {
      return unreadableMap(file, 'csv', 'unparsable-file', f.line, f.column, `the header names the ${field} twice, as "${taken.get(field)}" and "${name}"; nothing in the file is read`);
    } else {
      taken.set(field, name);
      columns.push(field);
    }
  }
  if (!taken.has('field')) return unreadableMap(file, 'csv', 'unparsable-file', header.line, header.column, `the header line names no field column (it names ${header.fields.map((f) => `"${f.value.trim()}"`).join(', ')}); nothing in the file is read`);
  const records = [];
  const problems = [];
  let count = 0;
  for (const row of rows.slice(1)) {
    if (row.fields.every((f) => f.value.trim() === '')) continue;
    count += 1;
    if (row.fields.length !== columns.length) {
      problems.push({ rule: 'invalid-record', file, line: row.line, column: row.column, found: `this row has ${row.fields.length} ${row.fields.length === 1 ? 'field' : 'fields'} and the header has ${columns.length}; the row is not checked`, system: '', store: '', field: '' });
      continue;
    }
    const r = { ...blank(), file, line: row.line, column: row.column, at: {}, record: count };
    for (const [i, f] of row.fields.entries()) {
      const field = columns[i];
      if (field === null) continue;
      r.at[field] = { line: f.line, column: f.column };
      r[field] = f.value.trim();
    }
    if (!r.field) {
      problems.push({ rule: 'invalid-record', file, line: r.at.field.line, column: r.at.field.column, found: 'this row names no field; the row is not checked', system: r.system, store: r.store, field: '' });
      continue;
    }
    records.push(r);
  }
  return { file, kind: 'csv', read: true, rows: count, records, problems, ignored };
}

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'a list' : typeof v === 'object' ? 'an object' : `a ${typeof v}`);

function fromJson(text, file, limits) {
  let parsed;
  try {
    parsed = parseJson(text, { maxDepth: 32, maxValues: limits.maxValues, maxStringLength: limits.maxStringLength, linesUpTo: 3 });
  } catch (error) {
    if (!(error instanceof JsonError)) throw error;
    const p = jsonProblem(error, text);
    const [, line, column] = /^line (\d+), column (\d+)/.exec(p);
    return unreadableMap(file, 'json', 'unparsable-file', Number(line), Number(column), `${p}; nothing in the file is read`);
  }
  const { value, lines, columns } = parsed;
  const ignored = [];
  let list;
  let prefix;
  if (Array.isArray(value)) {
    list = value;
    prefix = '';
  } else if (value !== null && typeof value === 'object' && Array.isArray(value.records)) {
    list = value.records;
    prefix = 'records';
    for (const k of Object.keys(value)) if (k !== 'records') ignored.push(k);
  } else {
    return unreadableMap(file, 'json', 'unparsable-file', 1, 1, `the file holds ${typeOf(value)}; a list of records, or an object with a "records" list, was expected; nothing in the file is read`);
  }
  if (list.length > limits.maxRecords) return unreadableMap(file, 'json', 'unparsable-file', lines.get(prefix) ?? 1, columns.get(prefix) ?? 1, `more than ${limits.maxRecords.toLocaleString('en-US')} records; nothing in the file is read`);
  const records = [];
  const problems = [];
  const where = (path) => ({ line: lines.get(path) ?? 1, column: columns.get(path) ?? 1 });
  for (const [i, item] of list.entries()) {
    const path = `${prefix}[${i}]`;
    const at = where(path);
    const bad = (found, place = at) => problems.push({ rule: 'invalid-record', file, line: place.line, column: place.column, found, system: '', store: '', field: '' });
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      bad(`${path} is ${typeOf(item)}, not an object; the record is not checked`);
      continue;
    }
    const r = { ...blank(), file, line: at.line, column: at.column, at: {}, record: i + 1 };
    const taken = new Map();
    let refused = false;
    for (const key of Object.keys(item)) {
      const field = fieldOf(key);
      if (field === null) {
        if (!ignored.includes(key)) ignored.push(key);
        continue;
      }
      const kp = `${path}.${key}`;
      const place = where(kp);
      if (taken.has(field)) {
        bad(`${path} names the ${field} twice, as "${taken.get(field)}" and "${key}"; the record is not checked`, place);
        refused = true;
        break;
      }
      taken.set(field, key);
      r.at[field] = place;
      const v = item[key];
      // A text, a whole number read as its text, or a list of texts, which is read as the texts joined by semicolons.
      if (typeof v === 'string') r[field] = v.trim();
      else if (typeof v === 'number' && Number.isInteger(v)) r[field] = String(v);
      else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) r[field] = v.map((x) => x.trim()).filter(Boolean).join('; ');
      else if (v !== null) bad(`${kp} is ${typeOf(v)}${Array.isArray(v) ? ' that holds a value that is not a text' : ''}, not a text or a list of texts; it is taken as empty`, place);
    }
    if (refused) continue;
    if (!r.field) {
      bad(`${path} names no field; the record is not checked`, r.at.field ?? at);
      continue;
    }
    records.push(r);
  }
  return { file, kind: 'json', read: true, rows: list.length, records, problems, ignored };
}

// Reads the text of a data map file of a kind: { file, kind, read, rows, records, problems, ignored }.
export function readDataMap(text, file, kind, limits = DATAMAP_LIMITS) {
  const lim = { ...DATAMAP_LIMITS, ...limits };
  return kind === 'csv' ? fromCsv(text, file, lim) : fromJson(text, file, lim);
}

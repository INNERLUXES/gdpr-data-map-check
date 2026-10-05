import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIELDS, FIELD_NAMES, fieldOf, readDataMap } from '../src/index.js';
import { HEADER, columnOf, csv, json, lineOf } from './helpers.js';

// Reading a data map: the columns and keys, the values, the records that cannot be read and the files that are not
// data maps.

const csvOf = (text) => readDataMap(text, 'm.csv', 'csv');
const jsonOf = (text) => readDataMap(text, 'm.json', 'json');

test('fields: the names of columns and keys in their compared form', () => {
  assert.deepEqual(FIELDS, ['system', 'store', 'field', 'category', 'subjects', 'purpose', 'lawfulBasis', 'specialCondition', 'retention', 'processor', 'agreement', 'location', 'recipientLocation', 'safeguard', 'consentReference', 'owner']);
  for (const [name, field] of [['Field', 'field'], ['Data Element', 'field'], ['Lawful Basis', 'lawfulBasis'], ['legal_basis', 'lawfulBasis'], ['Article 9 condition', 'specialCondition'], ['Retention Period', 'retention'], ['Storage Country', 'location'], ['recipientCountry', 'recipientLocation'], ['Transfer-Mechanism', 'safeguard'], ['DPA', 'agreement'], ['Data Subjects', 'subjects'], ['Consent Mechanism', 'consentReference'], ['Data Owner', 'owner'], ['Database', 'store'], ['Application', 'system']]) assert.equal(fieldOf(name), field, name);
  for (const name of ['notes', 'data owner email', 'constructor', '__proto__', 'toString', '']) assert.equal(fieldOf(name), null, name);
  assert.ok(Object.values(FIELD_NAMES).every((f) => FIELDS.includes(f)));
  assert.ok(FIELDS.every((f) => Object.values(FIELD_NAMES).includes(f)), 'every field has a name');
});

test('csv data map: every field read and trimmed, with the place of the record and of each field', () => {
  const text = `${HEADER}\n crm , contacts , email ,contact,customers, newsletter ,consent,,2 years,Mailer,DPA-1,DE,"US",SCCs,form v1, team \n`;
  const m = csvOf(text);
  assert.equal(m.read, true);
  assert.equal(m.rows, 1);
  assert.deepEqual(m.problems, []);
  const r = m.records[0];
  assert.deepEqual([r.system, r.store, r.field, r.purpose, r.recipientLocation, r.owner], ['crm', 'contacts', 'email', 'newsletter', 'US', 'team']);
  assert.equal(r.line, 2);
  assert.deepEqual(r.at.purpose, { line: 2, column: columnOf(text, ' newsletter') });
  assert.deepEqual(r.at.recipientLocation, { line: 2, column: columnOf(text, '"US"') });
});

test('csv data map: the columns may come in any order and with other names, and unknown columns are left out and named', () => {
  const m = csvOf('Notes,Legal Basis,Data Element\nx,contract,email\n,,phone\n');
  assert.deepEqual(m.records.map((r) => [r.field, r.lawfulBasis]), [['email', 'contract'], ['phone', '']]);
  assert.deepEqual(m.ignored, ['Notes']);
  assert.equal(m.records[0].owner, '');
  assert.equal(m.records[0].at.owner, undefined, 'no owner column');
  assert.deepEqual(csvOf('field,,x\na,b,c\n').ignored, ['(column 2, no name)', 'x']);
});

test('csv data map: blank rows are skipped, a row with another number of fields and a row with no field are invalid records', () => {
  const text = `${HEADER}\n\n,,,,,,,,,,,,,,,\na,b,c\nsys,st,,contact,c,p,contract,,1 year,,,DE,,,,t\nsys,st,f,contact,c,p,contract,,1 year,,,DE,,,,t\n`;
  const m = csvOf(text);
  assert.deepEqual(m.records.map((r) => r.field), ['f']);
  assert.equal(m.rows, 3);
  assert.deepEqual(m.problems.map((p) => [p.rule, p.line, p.found]), [
    ['invalid-record', lineOf(text, 'a,b,c'), 'this row has 3 fields and the header has 16; the row is not checked'],
    ['invalid-record', lineOf(text, 'sys,st,,'), 'this row names no field; the row is not checked']
  ]);
  assert.equal(m.problems[1].system, 'sys');
  assert.match(csvOf(`${HEADER}\nx\n`).problems[0].found, /this row has 1 field and the header has 16/);
});

test('csv data map: an empty file, a header with no field column or a field named twice, and a broken quote are unparsable files', () => {
  const one = (text) => {
    const m = csvOf(text);
    assert.equal(m.read, false);
    assert.deepEqual(m.records, []);
    assert.equal(m.problems.length, 1);
    assert.equal(m.problems[0].rule, 'unparsable-file');
    return m.problems[0];
  };
  assert.equal(one('').found, 'the file is empty; a header line that names a field column was expected; nothing in the file is read');
  assert.equal(one('system,owner\nx,y\n').found, 'the header line names no field column (it names "system", "owner"); nothing in the file is read');
  const twice = one('field,country,Region\n');
  assert.equal(twice.found, 'the header names the location twice, as "country" and "Region"; nothing in the file is read');
  assert.equal(twice.column, 15);
  const open = one(`${HEADER}\na,"open\n`);
  assert.equal(open.found, 'line 2, column 3: a quoted field that is not closed; a field that starts with a double quote must end with one; nothing in the file is read');
  assert.deepEqual([open.line, open.column], [2, 3]);
});

test('json data map: a list of records, or an object with a records list, with the place of each record and value', () => {
  const text = json({ field: 'email', legalBasis: 'contract', country: ['DE', 'FR'], owner: 7 }, { Field: 'phone', Category: 'contact' });
  const m = jsonOf(text);
  assert.deepEqual(m.problems, []);
  assert.deepEqual(m.records.map((r) => [r.field, r.lawfulBasis, r.location, r.owner]), [['email', 'contract', 'DE; FR', '7'], ['phone', '', '', '']]);
  assert.equal(m.records[0].line, lineOf(text, '{', 2));
  assert.deepEqual(m.records[0].at.lawfulBasis, { line: lineOf(text, '"legalBasis"'), column: columnOf(text, '"contract"') });
  const list = jsonOf('[{"field": "x"}]');
  assert.deepEqual(list.records.map((r) => r.field), ['x']);
  assert.equal(list.rows, 1);
});

test('json data map: keys and other top-level keys the tool does not read are named', () => {
  const m = jsonOf('{"controller": "x", "version": 2, "records": [{"field": "a", "notes": "n", "tags": []}, {"field": "b", "notes": "m"}]}');
  assert.deepEqual(m.ignored, ['controller', 'version', 'notes', 'tags']);
});

test('json data map: records that are not objects, have no field, name a field twice or hold a value of the wrong kind', () => {
  const text = json(7, { system: 'no field' }, { field: '' }, { field: 'a', country: 'DE', region: 'FR' }, { field: 'b', owner: { team: 'x' }, purpose: true, category: ['contact', 3] }, { field: 1.5 }, { field: 'd', owner: null, category: [' contact ', ''] });
  const m = jsonOf(text);
  assert.deepEqual(m.records.map((r) => [r.field, r.owner, r.purpose, r.category]), [['b', '', '', ''], ['d', '', '', 'contact']]);
  assert.deepEqual(m.problems.map((p) => p.found), [
    'records[0] is a number, not an object; the record is not checked',
    'records[1] names no field; the record is not checked',
    'records[2] names no field; the record is not checked',
    'records[3] names the location twice, as "country" and "region"; the record is not checked',
    'records[4].owner is an object, not a text or a list of texts; it is taken as empty',
    'records[4].purpose is a boolean, not a text or a list of texts; it is taken as empty',
    'records[4].category is a list that holds a value that is not a text, not a text or a list of texts; it is taken as empty',
    'records[5].field is a number, not a text or a list of texts; it is taken as empty',
    'records[5] names no field; the record is not checked'
  ]);
  assert.ok(m.problems.every((p) => p.rule === 'invalid-record'));
  assert.equal(m.problems[4].line, lineOf(text, '"owner": {'));
});

test('json data map: text that is not JSON, or JSON that is not a list of records, is an unparsable file', () => {
  const bad = jsonOf('{\n  "records": [\n    {"field": "a",}\n  ]\n}');
  assert.equal(bad.read, false);
  assert.equal(bad.problems[0].rule, 'unparsable-file');
  assert.deepEqual([bad.problems[0].line, bad.problems[0].column], [3, 19]);
  assert.match(bad.problems[0].found, /^line 3, column 19: a comma before the closing brace; JSON has no trailing comma; nothing in the file is read$/);
  for (const [text, kind] of [['{"items": []}', 'an object'], ['"x"', 'a string'], ['null', 'null'], ['3', 'a number'], ['{"records": {}}', 'an object']]) {
    assert.equal(jsonOf(text).problems[0].found, `the file holds ${kind}; a list of records, or an object with a "records" list, was expected; nothing in the file is read`, text);
  }
  assert.match(jsonOf('[{"field": "a", "field": "b"}]').problems[0].found, /the name "field" appears twice in one object/);
});

test('data maps: the limit on the number of records', () => {
  assert.match(readDataMap('[{"field": "a"}, {"field": "b"}]', 'm.json', 'json', { maxRecords: 1 }).problems[0].found, /more than 1 records; nothing in the file is read/);
  assert.match(readDataMap(csv({}, { field: 'b' }), 'm.csv', 'csv', { maxRecords: 1 }).problems[0].found, /more than 2 records/);
  assert.equal(readDataMap(csv({}), 'm.csv', 'csv', { maxRecords: 1 }).records.length, 1);
});

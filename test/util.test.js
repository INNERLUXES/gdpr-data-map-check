import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { BLANK_WORDS, KINDS, asciiLower, baseName, capped, cleanTexts, decodeText, displayPath, fieldForm, fileError, fileKind, flat, grouped, inspectPath, isBinary, isBlank, legalForm, lineStarts, listText, plural, positionOf, readBounded, readText, readTextFile, safeText, splitList, termForm } from '../src/index.js';
import { withFiles } from './helpers.js';

// The small helpers: numbers and lists, text cleaning, words, kinds, lines and columns, and the files the tool reads.

test('size: grouped numbers, lists and plurals', () => {
  assert.equal(grouped(1234567), '1,234,567');
  assert.equal(listText([]), '');
  assert.equal(listText(['a']), 'a');
  assert.equal(listText(['a', 'b']), 'a and b');
  assert.equal(listText(['a', 'b', 'c']), 'a, b and c');
  assert.equal(listText(['a', 'b', 'c', 'd'], 2), 'a, b and 2 more');
  assert.equal(plural(1, 'record'), '1 record');
  assert.equal(plural(2, 'record'), '2 records');
  assert.equal(plural(2, 'alias', 'aliases'), '2 aliases');
});

test('text: control, line separator and direction characters become spaces; long text is cut; every text of a value is cleaned', () => {
  assert.equal(safeText(`a${String.fromCharCode(27)}b${String.fromCharCode(0x202e)}c${String.fromCharCode(0x2028)}d${String.fromCharCode(0x9b)}e`), 'a b c d e');
  assert.equal(safeText('x'.repeat(20), 10), 'xxxxxxx...');
  assert.equal(flat(' a \n\t b '), 'a b');
  assert.deepEqual(cleanTexts({ a: [`x${String.fromCharCode(7)}`], b: 1, c: null, d: true }), { a: ['x '], b: 1, c: null, d: true });
  assert.deepEqual(capped(Array.from({ length: 25 }, (_, i) => `p${i}`)).slice(-2), ['p19', 'and 5 more']);
  assert.deepEqual(capped(['a']), ['a']);
});

test('words: lowercase for A to Z only, the last part of a path, and the forms of terms, references and field names', () => {
  assert.equal(asciiLower('ABC-xyz'), 'abc-xyz');
  assert.equal(asciiLower(`${String.fromCharCode(0x130)}I`), `${String.fromCharCode(0x130)}i`, 'no letter past ASCII changes, whatever the locale');
  assert.equal(baseName('a/b/data-map.csv'), 'data-map.csv');
  assert.equal(baseName('data-map.csv'), 'data-map.csv');
  assert.equal(termForm('  Legal-Obligation__ '), 'legal obligation');
  assert.equal(termForm('6(1)(c)'), '6 1 c');
  assert.equal(termForm(''), '');
  assert.equal(legalForm('Art. 6(1)(f) GDPR'), '6 1 f');
  assert.equal(legalForm('Article 46(2)(c)'), '46 2 c');
  assert.equal(legalForm('GDPR Art 45'), '45');
  assert.equal(legalForm('artistic'), 'artistic');
  assert.equal(fieldForm('Lawful Basis'), 'lawfulbasis');
  assert.equal(fieldForm('lawful_basis'), 'lawfulbasis');
  assert.equal(fieldForm('Recipient-Country'), 'recipientcountry');
});

test('words: blank values and lists separated by semicolons', () => {
  for (const v of ['', ' ', '-', '?', 'N/A', 'none', 'TBD', 'tbc', 'to do', 'Unknown', 'not set']) assert.equal(isBlank(v), true, v);
  for (const v of ['x', 'no', 'none yet', 'n/a for now']) assert.equal(isBlank(v), false, v);
  assert.ok(BLANK_WORDS.includes('n a'));
  assert.deepEqual(splitList(' a ; b;;a; '), ['a', 'b']);
  assert.deepEqual(splitList(''), []);
});

test('kinds: .csv and .json in any case, and nothing else', () => {
  assert.deepEqual(KINDS, ['csv', 'json']);
  assert.equal(fileKind('a/data-map.csv'), 'csv');
  assert.equal(fileKind('ROPA.CSV'), 'csv');
  assert.equal(fileKind('x/map.Json'), 'json');
  for (const name of ['map.txt', 'map.csv.bak', 'csv', '.csv', '.json', 'a/b.jsonl', 'a/b.xlsx']) assert.equal(fileKind(name), null, name);
});

test('lines: LF, CRLF and a lone CR each end a line; positions count from 1', () => {
  const starts = lineStarts('a\nb\r\nc\rd');
  assert.deepEqual(starts, [0, 2, 5, 7]);
  assert.deepEqual(positionOf(starts, 6), { line: 3, column: 2 });
});

test('files: a path relative to the base with forward slashes, an error that names the file, and text', async () => {
  const base = resolve('base');
  assert.equal(displayPath(resolve(base, 'a/b.csv'), base), 'a/b.csv');
  assert.equal(displayPath(base, base), '.');
  assert.ok(displayPath(resolve(base, '../x.csv'), base).endsWith('/x.csv'));
  assert.equal(fileError('a.csv', 'why').message, 'a.csv: why');
  assert.equal(fileError('a.csv', 'why').reason, 'why');
  assert.equal(isBinary(Buffer.from([1, 0, 2])), true);
  assert.equal(isBinary(Buffer.from('text')), false);
  assert.equal(decodeText(Buffer.from([0xef, 0xbb, 0xbf, 0x61])), 'a');
  assert.equal(decodeText(Buffer.from([0xc3])), null);
});

test('files: a file is read whole, and a missing file, a folder or one over its limit is refused', async () => {
  await withFiles({ 'a.csv': 'field\nx\n', 'd/b.csv': 'field\n' }, async (dir) => {
    assert.equal((await readBounded(resolve(dir, 'a.csv'), 100)).toString(), 'field\nx\n');
    await assert.rejects(readBounded(resolve(dir, 'a.csv'), 2), /8 bytes is over the 2 byte limit/);
    await assert.rejects(readBounded(resolve(dir, 'nope.csv'), 100), /no such file/);
    await assert.rejects(readBounded(resolve(dir, 'd'), 100), /is a folder; give the file itself/);
    assert.equal((await readText(resolve(dir, 'a.csv'), 'a.csv', 100)).size, 8);
    const t = await readTextFile('a.csv', dir, 100);
    assert.deepEqual([t.file, t.text], ['a.csv', 'field\nx\n']);
    assert.deepEqual(Object.keys(await inspectPath('a.csv', dir)), ['full', 'shown']);
    await assert.rejects(inspectPath('d', dir), /d: is a folder; give the data map file itself/);
    await assert.rejects(inspectPath('nope.csv', dir), /nope\.csv: no such file/);
  });
});

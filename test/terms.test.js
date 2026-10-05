import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADEQUATE, BASIS_NAMES, CATEGORY_NAMES, DEFAULT_BASIS_ALIASES, DEFAULT_CATEGORY_ALIASES, EEA, EEA_ONLY, EU, OPEN_ENDED, PLACE_ALIASES, SAFEGUARDS, SAFEGUARD_TERMS, classifyCategories, knownPlaces, legalForm, parseRetention, placeOfCode, resolveBases, resolvePlaces, resolveSafeguards, termForm } from '../src/index.js';

// The values of a record read as terms: lawful bases, categories, retention periods, safeguards and places.

test('bases: the six names, the points of Article 6(1), the aliases, several in one value, and the unknown ones', () => {
  const a = DEFAULT_BASIS_ALIASES;
  assert.deepEqual(BASIS_NAMES, ['consent', 'contract', 'legal obligation', 'vital interests', 'public task', 'legitimate interests']);
  assert.deepEqual(resolveBases(' Consent ', a), [{ text: 'Consent', basis: 'consent' }]);
  assert.deepEqual(resolveBases('Art. 6(1)(b) GDPR', a), [{ text: 'Art. 6(1)(b) GDPR', basis: 'contract' }]);
  assert.deepEqual(resolveBases('contract; legal_obligation; x', a).map((b) => b.basis), ['contract', 'legal obligation', null]);
  assert.deepEqual(resolveBases('', a), []);
  assert.deepEqual(resolveBases('n/a; ;', a), []);
  assert.deepEqual(resolveBases('constructor', a), [{ text: 'constructor', basis: null }]);
  for (const [alias, basis] of Object.entries(a)) assert.equal(legalForm(alias), alias, `${alias} is written in its compared form (${basis})`);
  for (const basis of Object.values(a)) assert.ok(BASIS_NAMES.includes(basis), basis);
});

test('categories: the names, the aliases, the longest name held as whole words, and ordinary data', () => {
  const a = DEFAULT_CATEGORY_ALIASES;
  assert.equal(CATEGORY_NAMES.length, 9);
  assert.deepEqual(classifyCategories('Health', a), [{ text: 'Health', category: 'health' }]);
  assert.deepEqual(classifyCategories('contact; trade union', a).map((c) => c.category), [null, 'trade union membership']);
  assert.deepEqual(classifyCategories('criminal convictions and offences', a), [{ text: 'criminal convictions and offences', category: 'criminal convictions and offences' }]);
  assert.equal(classifyCategories('records of religious beliefs', a)[0].category, 'religious or philosophical beliefs', 'the longest term wins');
  assert.equal(classifyCategories('Sex-life or orientation', a)[0].category, 'sex life or sexual orientation');
  assert.equal(classifyCategories('genetics', a)[0].category, null, 'a whole word only');
  assert.equal(classifyCategories('x', { ...a, x: 'other' })[0].category, null);
  assert.deepEqual(classifyCategories('-', a), []);
  for (const [alias, category] of Object.entries(a)) {
    assert.equal(termForm(alias), alias, alias);
    assert.ok(CATEGORY_NAMES.includes(category), category);
  }
});

test('retention: missing, a period in many forms, an open end, and text the tool cannot read', () => {
  assert.deepEqual(parseRetention(''), { state: 'missing', period: null });
  assert.deepEqual(parseRetention('TBD'), { state: 'missing', period: null });
  assert.deepEqual(parseRetention('6 years after the contract ends'), { state: 'period', period: '6 years' });
  assert.deepEqual(parseRetention('1 Year'), { state: 'period', period: '1 year' });
  assert.deepEqual(parseRetention('30d'), { state: 'period', period: '30 days' });
  assert.deepEqual(parseRetention('kept 18 mo'), { state: 'period', period: '18 months' });
  assert.deepEqual(parseRetention('2 wks'), { state: 'period', period: '2 weeks' });
  assert.deepEqual(parseRetention('P1Y6M'), { state: 'period', period: '1 year 6 months' });
  assert.deepEqual(parseRetention('p30d'), { state: 'period', period: '30 days' });
  assert.deepEqual(parseRetention('erased permanently after 90 days'), { state: 'period', period: '90 days' });
  assert.deepEqual(parseRetention('Forever'), { state: 'open', period: null });
  assert.deepEqual(parseRetention('kept indefinitely'), { state: 'open', period: null });
  assert.deepEqual(parseRetention('until further notice'), { state: 'open', period: null });
  assert.deepEqual(parseRetention('until deletion'), { state: 'unclear', period: null });
  assert.deepEqual(parseRetention('ten years'), { state: 'unclear', period: null });
  assert.deepEqual(parseRetention('12345 days'), { state: 'unclear', period: null }, 'at most four digits');
  assert.deepEqual(parseRetention('P'), { state: 'unclear', period: null });
  assert.deepEqual(parseRetention('forevermore'), { state: 'unclear', period: null }, 'a whole word only');
  assert.ok(OPEN_ENDED.includes('forever'));
});

test('safeguards: every kind by name and by article, a derogation by its point, and the unknown ones', () => {
  assert.deepEqual(SAFEGUARDS.map((s) => s.kind), ['adequacy', 'scc', 'bcr', 'instrument', 'code', 'certification', 'adhoc', 'derogation']);
  for (const s of SAFEGUARDS) for (const term of SAFEGUARD_TERMS[s.kind]) assert.equal(legalForm(term), term, term);
  const kinds = (t) => resolveSafeguards(t).map((s) => s.kind);
  assert.deepEqual(kinds('Adequacy decision'), ['adequacy']);
  assert.deepEqual(kinds('Art. 45 GDPR'), ['adequacy']);
  assert.deepEqual(kinds('EU-US Data Privacy Framework'), ['adequacy']);
  assert.deepEqual(kinds('SCCs; BCR'), ['scc', 'bcr']);
  assert.deepEqual(kinds('Article 46(2)(c)'), ['scc']);
  assert.deepEqual(kinds('46(2)(a)'), ['instrument']);
  assert.deepEqual(kinds('Code of Conduct'), ['code']);
  assert.deepEqual(kinds('certification'), ['certification']);
  assert.deepEqual(kinds('Ad hoc clauses'), ['adhoc']);
  assert.deepEqual(kinds('Art. 49(1)(a) explicit consent'), ['derogation']);
  assert.deepEqual(kinds('derogation'), ['derogation']);
  assert.deepEqual(kinds('Privacy Shield'), [null]);
  assert.deepEqual(kinds('46'), [null], 'Article 46 names several safeguards; say which');
  assert.deepEqual(kinds('n/a'), []);
});

test('places: the EU and the EEA, the adequacy decisions with their scope, codes, names and aliases', () => {
  assert.equal(EU.length, 27);
  assert.deepEqual(EEA_ONLY.map((c) => c.code), ['IS', 'LI', 'NO']);
  assert.equal(EEA.length, 30);
  assert.equal(new Set(EEA.map((c) => c.code)).size, 30);
  assert.deepEqual(ADEQUATE.filter((c) => c.scope).map((c) => c.code), ['CA', 'US']);
  assert.equal(ADEQUATE.length, 16);
  assert.ok(ADEQUATE.every((c) => !EEA.some((e) => e.code === c.code)));
  assert.deepEqual(placeOfCode('DE'), { code: 'DE', name: 'Germany', kind: 'eea', scope: null });
  assert.deepEqual(placeOfCode('EU'), { code: 'EU', name: 'European Union', kind: 'eea', scope: null });
  assert.equal(placeOfCode('EEA').kind, 'eea');
  assert.equal(placeOfCode('JP').kind, 'adequate');
  assert.deepEqual(placeOfCode('ZZ'), { code: 'ZZ', name: null, kind: 'third', scope: null });
  for (const [alias, code] of Object.entries(PLACE_ALIASES)) assert.equal(termForm(alias), alias, `${alias} (${code})`);
  const known = knownPlaces({ 'eu west 1': 'IE' });
  assert.equal(known.get('germany'), 'DE');
  assert.equal(known.get('no'), 'NO');
  assert.equal(known.get('eu west 1'), 'IE');
});

test('places of a value: each part read, a code or a name, the unknown ones taken as third countries', () => {
  const p = resolvePlaces('Germany; usa ; Atlantis; n/a', { 'dc one': 'IE' });
  assert.deepEqual(p.map((x) => [x.text, x.code, x.kind, x.known]), [['Germany', 'DE', 'eea', true], ['usa', 'US', 'adequate', true], ['Atlantis', null, 'third', false]]);
  assert.deepEqual(resolvePlaces('DC One', { 'dc one': 'IE' })[0].kind, 'eea');
  assert.deepEqual(resolvePlaces('The Netherlands')[0].code, 'NL');
  assert.deepEqual(resolvePlaces('el')[0].code, 'GR');
  assert.deepEqual(resolvePlaces('Czech Republic')[0].code, 'CZ');
  assert.deepEqual(resolvePlaces('Great Britain')[0].code, 'GB');
  assert.deepEqual(resolvePlaces(''), []);
  assert.deepEqual(resolvePlaces('__proto__')[0].known, false);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, NO_PROCESSOR, checkMap, defaultConfig, readDataMap } from '../src/index.js';
import { checkOf, columnOf, csv, findingsOf, lineOf, reportOf, rulesOf, sortedRules } from './helpers.js';

// Every rule with the form that is reported and the form next to it that is not, each small enough to work out by
// hand.

const only = (changes, config = null) => sortedRules(checkOf([changes], config));

test('a good record has nothing to report', () => {
  assert.deepEqual(only({}), []);
  assert.deepEqual(checkOf([{}]).totals.findings, 0);
});

test('missing-purpose: empty, a dash or a blank word; any other text is a purpose', () => {
  for (const purpose of ['', '-', 'n/a', 'TBD', ' none ', '?']) assert.deepEqual(only({ purpose }), ['missing-purpose'], purpose);
  for (const purpose of ['x', 'none of the above', 'fraud prevention']) assert.deepEqual(only({ purpose }), [], purpose);
  const text = csv({ purpose: '' });
  const f = findingsOf(reportOf({ 'map.csv': text }), 'missing-purpose')[0];
  assert.equal(f.found, 'the field "email" of app/users has no purpose');
  assert.equal(f.line, 2);
  assert.equal(f.column, columnOf(text, ',contract,'), 'the place of the empty purpose');
  assert.equal(f.level, 'error');
});

test('missing-lawful-basis and unknown-lawful-basis: empty, then names that are not one of the six', () => {
  assert.deepEqual(only({ lawfulBasis: '' }), ['missing-lawful-basis']);
  assert.deepEqual(only({ lawfulBasis: 'n/a' }), ['missing-lawful-basis']);
  assert.deepEqual(only({ lawfulBasis: 'goodwill' }), ['unknown-lawful-basis']);
  assert.deepEqual(only({ lawfulBasis: 'contract; goodwill; habit' }), ['unknown-lawful-basis'], 'one finding per record');
  const f = findingsOf(checkOf([{ lawfulBasis: 'contract; goodwill; habit' }]), 'unknown-lawful-basis')[0];
  assert.equal(f.found, 'the field "email" of app/users has the lawful basis "goodwill" and "habit", which is not one of the six of Article 6(1) or a known alias');
  for (const lawfulBasis of ['Consent', 'CONTRACT', 'legal obligation', 'Vital Interests', 'public task', 'Legitimate interests', 'Art. 6(1)(f)', 'article 6 1 a', '6(1)(c) GDPR', 'legitimate interest', 'contract; legal obligation']) assert.deepEqual(only({ lawfulBasis }), [], lawfulBasis);
  assert.deepEqual(only({ lawfulBasis: '6(1)(g)' }), ['unknown-lawful-basis']);
  assert.deepEqual(only({ lawfulBasis: 'legal obligations' }), ['unknown-lawful-basis'], 'compared exactly');
});

test('lawful bases: an alias of the configuration, and a built-in alias set off', () => {
  assert.deepEqual(only({ lawfulBasis: 'statutory duty' }), ['unknown-lawful-basis']);
  assert.deepEqual(only({ lawfulBasis: 'statutory duty' }, { lawfulBasisAliases: { 'Statutory Duty': 'legal obligation' } }), []);
  assert.deepEqual(only({ lawfulBasis: 'public interest' }, { lawfulBasisAliases: { 'public interest': 'off' } }), ['unknown-lawful-basis']);
  const r = checkOf([{ lawfulBasis: 'consent' }, { lawfulBasis: 'contract; 6(1)(b)' }, { lawfulBasis: '' }, { lawfulBasis: 'x' }]);
  assert.deepEqual(r.map.byBasis, { consent: 1, contract: 1, 'legal obligation': 0, 'vital interests': 0, 'public task': 0, 'legitimate interests': 0, none: 1, unknown: 1 });
});

test('missing-category: empty or blank; any other category is read', () => {
  assert.deepEqual(only({ category: '' }), ['missing-category']);
  assert.deepEqual(only({ category: 'unknown' }), ['missing-category']);
  assert.deepEqual(only({ category: 'loyalty points' }), []);
  assert.equal(findingsOf(checkOf([{ category: '' }]), 'missing-category')[0].level, 'warning');
});

test('special-category-without-condition: each of the eight categories of Article 9(1), with and without a condition', () => {
  for (const category of ['racial or ethnic origin', 'political opinions', 'religious or philosophical beliefs', 'trade union membership', 'genetic data', 'biometric data', 'health', 'sex life or sexual orientation']) {
    assert.deepEqual(only({ category }), ['special-category-without-condition'], category);
    assert.deepEqual(only({ category, specialCondition: '9(2)(a) explicit consent' }), [], category);
    assert.deepEqual(only({ category, specialCondition: 'n/a' }), ['special-category-without-condition'], `${category}: a blank word is no condition`);
  }
});

test('special-category-without-condition: aliases and names held as whole words, and the near misses', () => {
  for (const category of ['Health records', 'medical', 'Biometrics', 'ethnicity', 'religion', 'sexual orientation', 'trade union', 'contact; health data']) assert.deepEqual(only({ category }), ['special-category-without-condition'], category);
  for (const category of ['healthy snacks preference', 'contact', 'financial', 'location', 'biometrically signed form', 'unionized']) assert.deepEqual(only({ category }), [], category);
  const f = findingsOf(checkOf([{ category: 'health; genetic' }]), 'special-category-without-condition')[0];
  assert.equal(f.found, 'the field "email" of app/users is special category data (health, genetic data) and names no condition of Article 9(2)');
  assert.equal(f.level, 'error');
});

test('categories: an alias set to other marks a word as ordinary, and a new alias makes a word special', () => {
  assert.deepEqual(only({ category: 'health insurance number' }), ['special-category-without-condition']);
  assert.deepEqual(only({ category: 'health insurance number' }, { categoryAliases: { 'health insurance number': 'other' } }), []);
  assert.deepEqual(only({ category: 'wellbeing' }), []);
  assert.deepEqual(only({ category: 'wellbeing' }, { categoryAliases: { wellbeing: 'health' } }), ['special-category-without-condition']);
  assert.deepEqual(only({ category: 'medical' }, { categoryAliases: { medical: 'off' } }), []);
  const r = checkOf([{ category: 'health' }, { category: 'contact' }, { category: 'criminal records' }]);
  assert.equal(r.map.special, 1);
  assert.equal(r.map.criminal, 1);
  assert.equal(r.map.byCategory.health, 1);
});

test('criminal-offence-data: a warning for every record, with the condition shown when it is filled', () => {
  assert.deepEqual(only({ category: 'criminal convictions and offences' }), ['criminal-offence-data']);
  assert.deepEqual(only({ category: 'Criminal records', specialCondition: 'national vetting law' }), ['criminal-offence-data']);
  const [a, b] = [checkOf([{ category: 'criminal' }]), checkOf([{ category: 'criminal', specialCondition: 'vetting law' }])].map((r) => findingsOf(r, 'criminal-offence-data')[0]);
  assert.match(a.found, /and the record names no such basis$/);
  assert.match(b.found, /, named as "vetting law"$/);
  assert.equal(a.level, 'warning');
  assert.deepEqual(only({ category: 'crime prevention notes' }), [], 'not a name or an alias');
});

test('missing-retention, open-ended-retention and unclear-retention', () => {
  for (const retention of ['', 'tbd', 'n/a']) assert.deepEqual(only({ retention }), ['missing-retention'], retention);
  for (const retention of ['forever', 'Indefinitely', 'permanent', 'until further notice', 'never deleted', 'unlimited']) assert.deepEqual(only({ retention }), ['open-ended-retention'], retention);
  for (const retention of ['until the account is closed', 'six years', 'as long as needed']) assert.deepEqual(only({ retention }), ['unclear-retention'], retention);
  for (const retention of ['30 days', '6y', '18 months after the last login', 'P2Y', 'P1Y6M', 'deleted permanently after 2 years', '1 week', '0 days']) assert.deepEqual(only({ retention }), [], retention);
  assert.equal(findingsOf(checkOf([{ retention: 'forever' }]), 'open-ended-retention')[0].found, 'the field "email" of app/users is kept "forever", with no end');
  assert.deepEqual(findingsOf(checkOf([{ retention: 'soon' }]), 'unclear-retention').map((f) => f.level), ['warning']);
});

test('missing-location: an empty storage location is a warning; a recipient location alone does not fill it', () => {
  assert.deepEqual(only({ location: '' }), ['missing-location']);
  assert.deepEqual(only({ location: '', recipientLocation: 'FR' }), ['missing-location']);
  assert.deepEqual(only({ location: 'FR' }), []);
  assert.deepEqual(only({ location: 'EU' }), []);
  assert.deepEqual(only({ location: 'EEA' }), []);
});

test('transfer-without-safeguard: a storage or recipient place outside the EU/EEA with no safeguard', () => {
  assert.deepEqual(only({ location: 'US' }), ['transfer-without-safeguard']);
  assert.deepEqual(only({ recipientLocation: 'India' }), ['transfer-without-safeguard']);
  assert.deepEqual(only({ location: 'DE; Japan' }), ['transfer-without-safeguard']);
  assert.deepEqual(only({ location: 'Norway', recipientLocation: 'Iceland; Liechtenstein' }), [], 'the EEA countries outside the EU');
  assert.deepEqual(only({ location: 'US', safeguard: 'SCCs' }), []);
  assert.deepEqual(only({ location: 'DE', safeguard: 'SCCs' }), [], 'a safeguard with no transfer is not looked at');
  const f = findingsOf(checkOf([{ location: 'Germny', recipientLocation: 'United States' }]), 'transfer-without-safeguard')[0];
  assert.equal(f.found, 'the field "email" of app/users goes to Germny (not a place the tool knows, so taken as outside the EU/EEA, did you mean "Germany"?) and United States (US), outside the EU/EEA, with no transfer safeguard');
  assert.equal(f.level, 'error');
});

test('transfers: a location alias of the configuration names a place; the transfers are listed with the system', () => {
  assert.deepEqual(only({ location: 'eu-west-1' }), ['transfer-without-safeguard']);
  assert.deepEqual(only({ location: 'eu-west-1' }, { locationAliases: { 'eu-west-1': 'IE' } }), []);
  assert.deepEqual(only({ location: 'Mumbai DC' }, { locationAliases: { 'Mumbai DC': 'IN' } }), ['transfer-without-safeguard']);
  const r = checkOf([{ location: 'US', safeguard: 'SCCs' }, { location: 'DE' }]);
  assert.deepEqual(r.map.transfers, [{ system: 'app', store: 'users', field: 'email', file: 'map.csv', line: 2, to: ['US'], safeguard: 'SCCs' }]);
  assert.equal(r.map.systems[0].transfers, 1);
});

test('unknown-safeguard: a name that is none of Articles 45, 46, 47 and 49', () => {
  assert.deepEqual(only({ location: 'US', safeguard: 'Privacy Shield' }), ['unknown-safeguard']);
  assert.deepEqual(only({ location: 'US', safeguard: 'SCCs; trust us' }), ['unknown-safeguard']);
  for (const safeguard of ['SCC', 'standard contractual clauses', 'Art. 46(2)(c)', 'BCRs', 'binding corporate rules', 'Article 47', 'code of conduct', 'certification', 'ad hoc clauses', '46(3)(a)', 'legally binding instrument']) assert.deepEqual(only({ location: 'IN', safeguard }), [], safeguard);
  assert.match(findingsOf(checkOf([{ location: 'US', safeguard: 'Privacy Shield' }]), 'unknown-safeguard')[0].found, /names the transfer safeguard "Privacy Shield", which is not an adequacy decision, a safeguard of Article 46 or a derogation of Article 49$/);
});

test('adequacy-unconfirmed: a place with no decision the tool knows, and the decisions of limited scope', () => {
  for (const location of ['Japan', 'CH', 'United Kingdom', 'UK', 'Brazil', 'Republic of Korea', 'south korea', 'New Zealand', 'Uruguay', 'Isle of Man']) assert.deepEqual(only({ location, safeguard: 'adequacy decision' }), [], location);
  assert.deepEqual(only({ location: 'US', safeguard: 'adequacy' }), ['adequacy-unconfirmed']);
  assert.deepEqual(only({ location: 'Canada', safeguard: 'Art. 45' }), ['adequacy-unconfirmed']);
  assert.deepEqual(only({ location: 'India', safeguard: 'adequacy decision' }), ['adequacy-unconfirmed']);
  assert.deepEqual(only({ location: 'US', safeguard: 'adequacy; SCCs' }), [], 'another safeguard is named too');
  assert.deepEqual(only({ location: 'US', safeguard: 'Data Privacy Framework' }), ['adequacy-unconfirmed']);
  const [us, india] = [checkOf([{ location: 'US', safeguard: 'adequacy' }]), checkOf([{ location: 'India', safeguard: 'adequacy' }])].map((r) => findingsOf(r, 'adequacy-unconfirmed')[0].found);
  assert.equal(us, 'the field "email" of app/users goes to US on an adequacy decision, which covers only organisations certified under the EU-US Data Privacy Framework; check that the recipient is covered');
  assert.equal(india, 'the field "email" of app/users goes to India on an adequacy decision, but it is not on the list of adequacy decisions the tool knows');
  assert.match(findingsOf(checkOf([{ location: 'IN', safeguard: 'adequacy' }], { locationAliases: { 'IN DC': 'IN' } }), 'adequacy-unconfirmed')[0].found, /but it is not on the list/);
  assert.match(findingsOf(checkOf([{ location: 'Pune', safeguard: 'adequacy' }], { locationAliases: { pune: 'IN' } }), 'adequacy-unconfirmed')[0].found, /Pune \(IN\) on an adequacy decision, but the place is not on the list/);
});

test('derogation-transfer: info when a derogation of Article 49 is the only safeguard', () => {
  for (const safeguard of ['derogation', 'Art. 49(1)(b)', 'article 49']) assert.deepEqual(only({ location: 'Morocco', safeguard }), ['derogation-transfer'], safeguard);
  assert.deepEqual(only({ location: 'Morocco', safeguard: 'derogation; SCCs' }), []);
  assert.deepEqual(only({ location: 'DE', safeguard: 'derogation' }), [], 'no transfer');
  assert.equal(findingsOf(checkOf([{ location: 'MA', safeguard: 'derogation' }]), 'derogation-transfer')[0].level, 'info');
});

test('consent-without-reference: only with requireConsentReference, and only for consent', () => {
  const on = { requireConsentReference: true };
  assert.deepEqual(only({ lawfulBasis: 'consent' }), []);
  assert.deepEqual(only({ lawfulBasis: 'consent' }, on), ['consent-without-reference']);
  assert.deepEqual(only({ lawfulBasis: 'Art. 6(1)(a); contract' }, on), ['consent-without-reference']);
  assert.deepEqual(only({ lawfulBasis: 'consent', consentReference: 'signup form v2' }, on), []);
  assert.deepEqual(only({ lawfulBasis: 'consent', consentReference: 'tbd' }, on), ['consent-without-reference']);
  assert.deepEqual(only({ lawfulBasis: 'contract' }, on), []);
});

test('processor-without-agreement: a processor with no agreement, and the words that say there is none', () => {
  assert.deepEqual(only({ processor: 'Mailer Ltd' }), ['processor-without-agreement']);
  assert.deepEqual(only({ processor: 'Mailer Ltd', agreement: 'DPA-1' }), []);
  for (const processor of ['internal', 'In-house', 'none', '-', 'self', 'own staff']) assert.deepEqual(only({ processor }), [], processor);
  assert.deepEqual(NO_PROCESSOR, ['internal', 'in house', 'self', 'own staff']);
  assert.equal(checkOf([{ processor: 'Mailer Ltd' }, { processor: 'internal' }]).map.processors, 1);
});

test('missing-owner: empty or blank', () => {
  assert.deepEqual(only({ owner: '' }), ['missing-owner']);
  assert.deepEqual(only({ owner: 'unknown' }), ['missing-owner']);
  assert.deepEqual(only({ owner: 'x' }), []);
});

test('duplicate-row: the same system, store, field and purpose in their compared form; the later row is still checked', () => {
  const r = checkOf([{}, { field: 'Email', purpose: 'Sign-in', owner: '' }]);
  assert.deepEqual(sortedRules(r), ['duplicate-row', 'missing-owner']);
  assert.equal(findingsOf(r, 'duplicate-row')[0].found, 'the field "Email" of app/users is listed again with the same purpose; the first record is at map.csv:2');
  assert.deepEqual(rulesOf(checkOf([{}, { purpose: 'marketing' }])), [], 'another purpose');
  assert.deepEqual(rulesOf(checkOf([{}, { store: 'admins' }])), [], 'another store');
  const two = reportOf({ 'a.csv': csv({}), 'b.json': '[{"system": "app", "store": "users", "field": "email", "purpose": "sign in", "lawfulBasis": "contract", "category": "contact", "retention": "1 year", "location": "DE", "owner": "t"}]' });
  assert.deepEqual(rulesOf(two), ['duplicate-row'], 'across files');
  assert.match(two.findings[0].found, /the first record is at a\.csv:2$/);
});

test('findings: errors first, then by file, line, column and rule; each finding names its system, store and field', () => {
  const text = csv({ owner: '', purpose: '' }, { field: 'phone', lawfulBasis: '', location: 'US' });
  const r = reportOf({ 'map.csv': text });
  assert.deepEqual(rulesOf(r), ['missing-purpose', 'missing-lawful-basis', 'transfer-without-safeguard', 'missing-owner']);
  assert.deepEqual(r.findings.map((f) => f.line), [2, 3, 3, 2]);
  assert.deepEqual(r.findings.map((f) => f.field), ['email', 'phone', 'phone', 'email']);
  assert.equal(r.findings[0].line, lineOf(text, 'app,users,email'));
  assert.ok(r.findings.every((f) => f.system === 'app' && f.store === 'users'));
});

test('systems: one line per system in the order of first appearance, with the findings shown of each', () => {
  const r = checkOf([{ system: 'crm', category: 'health' }, { system: 'erp', location: 'US', safeguard: 'SCCs' }, { system: 'crm', field: 'phone', category: 'criminal' }, { system: '', field: 'x' }]);
  assert.deepEqual(r.map.systems, [
    { system: 'crm', records: 2, special: 1, criminal: 1, transfers: 0, findings: 2 },
    { system: 'erp', records: 1, special: 0, criminal: 0, transfers: 1, findings: 0 },
    { system: '', records: 1, special: 0, criminal: 0, transfers: 0, findings: 0 }
  ]);
  assert.equal(checkOf([{ system: 'crm', owner: '' }], null, { minSeverity: 'error' }).map.systems[0].findings, 0, 'a finding that is not shown is not counted');
});

test('the levels of the configuration: a rule raised, lowered or off', () => {
  const r = checkOf([{ owner: '' }], { rules: { missingOwner: 'error' } });
  assert.equal(r.findings[0].level, 'error');
  assert.equal(r.result.pass, false);
  assert.deepEqual(rulesOf(checkOf([{ owner: '' }], { rules: { missingOwner: 'off' } })), []);
  assert.ok(checkOf([{ owner: '' }], { rules: { missingOwner: 'off' } }).notes.includes('1 rule is off: missing-owner'));
  assert.equal(checkOf([{ purpose: '' }], { rules: { missingPurpose: 'info' } }).findings[0].level, 'info');
});

test('the result: pass below the fail-on level, fail at or above it, and the counts', () => {
  const warn = checkOf([{ owner: '' }]);
  assert.equal(warn.result.pass, true);
  assert.equal(warn.result.text, 'PASS - no finding at or above error (1 warning)');
  const failing = checkOf([{ owner: '' }], null, { failOn: 'warning' });
  assert.equal(failing.result.text, 'FAIL - 1 finding at or above warning (1 warning)');
  const hidden = checkOf([{ owner: '' }], null, { minSeverity: 'error', failOn: 'warning' });
  assert.equal(hidden.result.pass, true, 'a finding below the minimum severity does not fail the run');
  assert.equal(hidden.totals.hidden, 1);
});

test('the limit of findings listed per rule: the rest are counted and still fail the run', () => {
  const r = reportOf({ 'map.csv': csv(...Array.from({ length: 7 }, (_, i) => ({ field: `f${i}`, purpose: '' }))) });
  assert.equal(r.findings.length, 7);
  const limited = checkMap([readDataMap(csv(...Array.from({ length: 3 }, (_, i) => ({ field: `f${i}`, location: `Nowhere${i}` }))), 'm.csv', 'csv')], defaultConfig(), { maxSuggestions: 1 });
  assert.equal(limited.unsuggested, 2);
  assert.equal(LIMITS.maxFindingsPerRule, 500);
});

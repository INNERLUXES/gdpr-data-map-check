import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG_LIMITS, ConfigError, DEFAULT_BASIS_ALIASES, DEFAULT_CATEGORY_ALIASES, DEFAULT_FAIL_ON, DEFAULT_LOCATION_ALIASES, DEFAULT_MIN_SEVERITY, DEFAULT_REQUIRE_CONSENT_REFERENCE, DEFAULT_RULES, KEYS, RULES, defaultConfig, defaultsAsConfig, distance, isObject, kindOf, readConfig, suggestion, validateConfig } from '../src/index.js';

// The configuration file: every key, the aliases, the errors with their lines and suggestions.

const problems = (text) => {
  try {
    readConfig(text, 'c.json');
  } catch (error) {
    assert.ok(error instanceof ConfigError, error.message);
    return error.problems;
  }
  assert.fail('not refused');
  return [];
};

test('config: the defaults, and --print-defaults read back give the same configuration', () => {
  const d = defaultConfig();
  assert.deepEqual(d.rules, DEFAULT_RULES);
  assert.deepEqual(d.lawfulBasisAliases, DEFAULT_BASIS_ALIASES);
  assert.deepEqual(d.categoryAliases, DEFAULT_CATEGORY_ALIASES);
  assert.deepEqual(d.locationAliases, DEFAULT_LOCATION_ALIASES);
  assert.equal(d.requireConsentReference, DEFAULT_REQUIRE_CONSENT_REFERENCE);
  assert.equal(DEFAULT_REQUIRE_CONSENT_REFERENCE, false);
  assert.equal(DEFAULT_MIN_SEVERITY, 'info');
  assert.equal(DEFAULT_FAIL_ON, 'error');
  const back = validateConfig(defaultsAsConfig(), new Map(), 'd.json');
  assert.deepEqual({ ...back, file: null, name: null }, d);
  assert.deepEqual(Object.keys(defaultsAsConfig()), Object.keys(KEYS));
});

test('config: every rule but the three of input problems has a key, and the default levels', () => {
  assert.deepEqual(RULES.filter((r) => r.key !== null).map((r) => r.key).sort(), Object.keys(DEFAULT_RULES).sort());
  assert.deepEqual(RULES.filter((r) => r.key === null).map((r) => r.id), ['invalid-record', 'unreadable-file', 'unparsable-file']);
  assert.deepEqual(RULES.filter((r) => r.key && DEFAULT_RULES[r.key] === 'error').map((r) => r.id), ['missing-purpose', 'missing-lawful-basis', 'unknown-lawful-basis', 'special-category-without-condition', 'missing-retention', 'open-ended-retention', 'transfer-without-safeguard', 'unknown-safeguard']);
  assert.deepEqual(RULES.filter((r) => r.key && DEFAULT_RULES[r.key] === 'info').map((r) => r.id), ['derogation-transfer']);
});

test('config: every key with a good value', () => {
  const c = readConfig(JSON.stringify({ name: 'Shop', rules: { missingOwner: 'error', duplicateRow: 'off', derogationTransfer: 'warning' }, lawfulBasisAliases: { 'Statutory Duty': 'legal obligation', 'public interest': 'off' }, categoryAliases: { Wellbeing: 'health', medical: 'off', 'health insurance number': 'other' }, locationAliases: { 'eu-west-1': 'IE', 'Mumbai DC': 'IN', 'EU cloud': 'EU' }, requireConsentReference: true, minSeverity: 'warning', failOn: 'warning' }), 'c.json');
  assert.equal(c.name, 'Shop');
  assert.equal(c.file, 'c.json');
  assert.equal(c.rules.missingOwner, 'error');
  assert.equal(c.rules.duplicateRow, 'off');
  assert.equal(c.lawfulBasisAliases['statutory duty'], 'legal obligation');
  assert.ok(!Object.hasOwn(c.lawfulBasisAliases, 'public interest'));
  assert.equal(c.categoryAliases.wellbeing, 'health');
  assert.equal(c.categoryAliases['health insurance number'], 'other');
  assert.ok(!Object.hasOwn(c.categoryAliases, 'medical'));
  assert.deepEqual(c.locationAliases, { 'eu west 1': 'IE', 'mumbai dc': 'IN', 'eu cloud': 'EU' });
  assert.equal(c.requireConsentReference, true);
  assert.equal(c.minSeverity, 'warning');
  assert.equal(c.failOn, 'warning');
});

test('config: an unknown key is an error with its line and a suggestion, at every level', () => {
  assert.deepEqual(problems('{\n  "requireConsentRefrence": true\n}'), ['c.json: line 2: "requireConsentRefrence" is not a key of the configuration; did you mean "requireConsentReference"?']);
  assert.deepEqual(problems('{\n  "rules": {\n    "missingOwnr": "off"\n  }\n}'), ['c.json: line 3: "missingOwnr" is not a key of rules; did you mean "missingOwner"?']);
  assert.deepEqual(problems('{"failon": "info"}'), ['c.json: line 1: "failon" is not a key of the configuration; did you mean "failOn"?']);
  assert.deepEqual(problems('{"colour": 1}'), ['c.json: line 1: "colour" is not a key of the configuration']);
  assert.deepEqual(problems('{"rules": {"invalidRecord": "off"}}'), ['c.json: line 1: "invalidRecord" is not a key of rules'], 'the rules of input problems have no key');
});

test('config: a key named twice is refused, as RFC 8259 leaves the result open', () => {
  assert.match(problems('{"name": "a", "name": "b"}')[0], /^c\.json: line 1, column 15: the name "name" appears twice in one object/);
});

test('config: values of the wrong kind, each with its line', () => {
  const text = JSON.stringify({ name: '', rules: [], lawfulBasisAliases: 'x', categoryAliases: 3, locationAliases: null, requireConsentReference: 'yes', minSeverity: 'notice', failOn: 3 }, null, 2);
  assert.deepEqual(problems(text), [
    'c.json: line 2: name must be a text of 1 to 120 characters',
    'c.json: line 3: rules must be an object, not a list',
    'c.json: line 4: lawfulBasisAliases must be an object of names to lawful basis names, not a string',
    'c.json: line 5: categoryAliases must be an object of names to category names, not a number',
    'c.json: line 6: locationAliases must be an object of names to two-letter codes, not null',
    'c.json: line 7: requireConsentReference must be true or false, not a string',
    'c.json: line 8: minSeverity must be one of info, warning, error',
    'c.json: line 9: failOn must be one of info, warning, error'
  ]);
  assert.match(problems('{"rules": {"missingOwner": "fatal"}}')[0], /rules\.missingOwner must be one of info, warning, error, off, not "fatal"/);
  assert.match(problems('{"rules": {"missingOwner": 1}}')[0], /not a number/);
});

test('config: the errors of the aliases', () => {
  assert.deepEqual(problems('{"lawfulBasisAliases": {"Consent": "contract"}}'), ['c.json: line 1: "Consent" is already the name of a lawful basis']);
  assert.deepEqual(problems('{"lawfulBasisAliases": {"duty": "obligation"}}'), ['c.json: line 1: lawfulBasisAliases.duty must be one of consent, contract, legal obligation, vital interests, public task, legitimate interests, or off, not "obligation"']);
  assert.deepEqual(problems('{"categoryAliases": {"health": "other"}}'), ['c.json: line 1: "health" is already the name of a category']);
  assert.match(problems('{"categoryAliases": {"x": "secret"}}')[0], /categoryAliases\.x must be one of racial or ethnic origin, .+, criminal convictions and offences, other, or off, not "secret"/);
  assert.deepEqual(problems('{"categoryAliases": {"x": "off"}}'), ['c.json: line 1: "x" is not a built-in alias, so it cannot be set off']);
  assert.deepEqual(problems('{"locationAliases": {"Germany": "FR"}}'), ['c.json: line 1: "Germany" is already the name of a place']);
  assert.deepEqual(problems('{"locationAliases": {"dc": "de"}}'), ['c.json: line 1: locationAliases.dc must be a two-letter code in capitals, EU or EEA, or off, not "de"']);
  assert.deepEqual(problems('{"locationAliases": {"dc": "off"}}'), ['c.json: line 1: "dc" is not a built-in alias, so it cannot be set off']);
  assert.deepEqual(problems('{"locationAliases": {"--": "DE"}}'), ['c.json: line 1: "--" must hold 1 to 100 characters with a letter or a digit']);
  assert.deepEqual(problems('{"locationAliases": {"dc 1": "DE", "DC-1": "FR"}}'), ['c.json: line 1: "DC-1" is the same name as "dc 1" once compared (dc 1)']);
  assert.match(problems(JSON.stringify({ categoryAliases: Object.fromEntries(Array.from({ length: 501 }, (_, i) => [`n${i}`, 'health'])) }))[0], /categoryAliases holds more than 500 names/);
  assert.match(problems(JSON.stringify({ locationAliases: { [`${'a'.repeat(101)}`]: 'DE' } }))[0], /must hold 1 to 100 characters/);
  assert.equal(CONFIG_LIMITS.maxAliases, 500);
});

test('config: a name such as __proto__ is an ordinary key and is refused like any other', () => {
  assert.match(problems('{"__proto__": {"rules": {}}}')[0], /"__proto__" is not a key of the configuration/);
  assert.match(problems('{"rules": {"constructor": "off"}}')[0], /"constructor" is not a key of rules/);
  const c = readConfig('{"categoryAliases": {"__proto__": "health", "constructor": "other"}}', 'c');
  assert.equal(c.categoryAliases.proto, 'health');
  assert.equal(c.categoryAliases.constructor, 'other');
  assert.equal(Object.getPrototypeOf(c.categoryAliases), Object.prototype);
  assert.equal({}.rules, undefined);
});

test('config: the configuration must be an object, and JSON errors have their line and column', () => {
  assert.deepEqual(problems('[]'), ['c.json: line 1: the configuration must be a JSON object, not a list']);
  assert.deepEqual(problems('{\n  "name": "x",\n}'), ['c.json: line 3, column 1: a comma before the closing brace; JSON has no trailing comma']);
  assert.throws(() => validateConfig(null), /must be a JSON object, not null/);
});

test('config: helpers for the suggestions and the kinds of values', () => {
  assert.equal(distance('name', 'nmae'), 1);
  assert.equal(distance('', 'abc'), 3);
  assert.equal(suggestion('failon', ['failOn', 'name']), '; did you mean "failOn"?');
  assert.equal(suggestion('somethingelse', ['name']), '');
  assert.equal(suggestion('x'.repeat(65), ['x'.repeat(65)]), '', 'a long name is not compared');
  assert.deepEqual([null, [], {}, 1, 'x', true].map(kindOf), ['null', 'a list', 'an object', 'a number', 'a string', 'a boolean']);
  assert.equal(isObject({}), true);
  assert.equal(isObject([]), false);
});

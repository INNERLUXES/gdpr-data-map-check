// The rules and the result. Each rule names the points of the public pages it rests on (src/data.js), says where it is
// the tool's own choice, and what to change. docs/method.md says exactly what each rule looks at and what it cannot see.
// The checks themselves are in src/datamap.js and src/map.js.

import { LEVELS } from './data.js';
import { grouped, plural } from './size.js';

export const RULES = [
  {
    id: 'missing-purpose',
    key: 'missingPurpose',
    title: 'a field has no purpose',
    basis: ['recordContents', 'purposeLimitation'],
    own: 'a purpose that is empty or a blank word such as none, n/a or tbd; any other text counts as a purpose, the tool cannot tell whether it is specific or legitimate',
    rule: () => 'a record with an empty purpose, or a data map with no purpose column',
    fix: 'write the specific purpose the field is collected and used for'
  },
  {
    id: 'missing-lawful-basis',
    key: 'missingLawfulBasis',
    title: 'a field has no lawful basis',
    basis: ['lawfulBases'],
    own: 'a lawful basis that is empty or a blank word; the tool checks that a basis is named, not that it fits the processing',
    rule: () => 'a record with an empty lawful basis, or a data map with no lawful basis column',
    fix: 'name the lawful basis of Article 6(1) the processing rests on: consent, contract, legal obligation, vital interests, public task or legitimate interests'
  },
  {
    id: 'unknown-lawful-basis',
    key: 'unknownLawfulBasis',
    title: 'a lawful basis is not one of the six of Article 6(1)',
    basis: ['lawfulBases'],
    own: 'a basis is compared with the letters A to Z lowered, every other character made a space and a leading article or art and a trailing gdpr left out, so "Art. 6(1)(b)" is contract; several bases are separated by semicolons, and one finding lists every unknown one of a record',
    rule: (config) => `a lawful basis that is none of consent, contract, legal obligation, vital interests, public task, legitimate interests and the ${plural(Object.keys(config.lawfulBasisAliases).length, 'alias', 'aliases')} of the configuration`,
    fix: 'write one of the six lawful bases, or add the words your team uses to lawfulBasisAliases in the configuration'
  },
  {
    id: 'missing-category',
    key: 'missingCategory',
    title: 'a field has no category of data',
    basis: ['recordContents', 'personalData'],
    own: 'a warning, because without a category the tool cannot tell whether the field is special category or criminal offence data, so those checks cannot look at it',
    rule: () => 'a record with an empty category, or a data map with no category column',
    fix: 'write the category of the data, such as contact, identity, financial, location or health'
  },
  {
    id: 'special-category-without-condition',
    key: 'specialCategoryWithoutCondition',
    title: 'special category data has no Article 9 condition',
    basis: ['specialCategories', 'article9Conditions', 'specialDefinitions'],
    own: 'a category is special when its name, an alias, or the longest name or alias it holds as whole words is one of Article 9(1), so "health records" is health; an alias set to other marks a word as ordinary data; any text in the condition column counts as a condition, the tool cannot tell whether it applies',
    rule: (config) => `a record whose category is one of the eight special categories of Article 9(1), or one of the ${plural(Object.values(config.categoryAliases).filter((v) => v !== 'other' && v !== 'criminal convictions and offences').length, 'alias', 'aliases')} for them, with an empty special category condition`,
    fix: 'name the condition of Article 9(2) the processing rests on, such as explicit consent, employment law or health care, or stop collecting the field'
  },
  {
    id: 'criminal-offence-data',
    key: 'criminalOffenceData',
    title: 'a field holds data on criminal convictions and offences',
    basis: ['criminalData'],
    own: 'a warning for every such record, with or without a condition named, because Article 10 asks for official authority or a law that allows the processing, which the tool cannot check; the condition column is shown when it is filled',
    rule: () => 'a record whose category is criminal convictions and offences, or an alias for it',
    fix: 'check that the processing is under official authority or allowed by Union or Member State law, and name that law in the condition column'
  },
  {
    id: 'missing-retention',
    key: 'missingRetention',
    title: 'a field has no retention period',
    basis: ['storageLimitation', 'recordErasure'],
    own: 'a retention that is empty or a blank word; an error, because a field with no period is kept for as long as nobody deletes it',
    rule: () => 'a record with an empty retention, or a data map with no retention column',
    fix: 'write how long the field is kept, such as 6 years after the end of the contract or 30 days'
  },
  {
    id: 'open-ended-retention',
    key: 'openEndedRetention',
    title: 'a retention period has no end',
    basis: ['storageLimitation', 'recordErasure'],
    own: 'a retention with no period the tool can read and a word such as forever, never, indefinite, permanent, unlimited or until further notice; a text that also names a period, such as deleted permanently after 30 days, has an end',
    rule: () => 'a retention that says the data is kept with no end',
    fix: 'set an end to the retention, or the event after which the data is erased, with a period'
  },
  {
    id: 'unclear-retention',
    key: 'unclearRetention',
    title: 'a retention period cannot be read',
    basis: ['recordErasure'],
    own: 'a period is a whole number of up to four digits with a unit of days, weeks, months or years (d, w, m, y and their plurals), or an ISO 8601 duration such as P6M, anywhere in the text; a retention that names only an event, such as until the account is closed, or writes the number in words, is unclear; a warning, because the period may still be in the text',
    rule: () => 'a retention that names no period the tool can read and no word for an open end',
    fix: 'write the period as a number with a unit, such as 90 days or 2 years after the last order'
  },
  {
    id: 'missing-location',
    key: 'missingLocation',
    title: 'a field has no storage location',
    basis: ['transferPrinciple', 'recordTransfers'],
    own: 'a storage location that is empty or a blank word; a warning, because without it the tool cannot tell whether the data leaves the EU/EEA',
    rule: () => 'a record with an empty storage location, or a data map with no location column',
    fix: 'write the country where the data is stored, as a name or a two-letter code'
  },
  {
    id: 'transfer-without-safeguard',
    key: 'transferWithoutSafeguard',
    title: 'data leaves the EU/EEA with no transfer safeguard',
    basis: ['transferPrinciple', 'appropriateSafeguards', 'recordTransfers'],
    own: 'a record is a transfer when its storage location or the location of its recipient names a place outside the EU/EEA; a place the tool does not know, a typo included, counts as outside, and the finding says so with a near name when there is one; a place of the EU/EEA is a country of src/countries.js, its code, EU, EEA or an alias of the configuration',
    rule: (config) => `a record stored in or sent to a place outside the EU/EEA, with an empty transfer safeguard${Object.keys(config.locationAliases).length ? `; places named by the ${plural(Object.keys(config.locationAliases).length, 'alias', 'aliases')} of the configuration are read as their codes` : ''}`,
    fix: 'name the safeguard of the transfer: an adequacy decision, standard contractual clauses, binding corporate rules or another safeguard of Article 46, or keep the data in the EU/EEA'
  },
  {
    id: 'unknown-safeguard',
    key: 'unknownSafeguard',
    title: 'a transfer safeguard is not one the regulation names',
    basis: ['adequacyDecision', 'appropriateSafeguards', 'derogations'],
    own: 'a safeguard is compared like a lawful basis; the known names are adequacy decision, the Data Privacy Framework, standard contractual clauses (SCCs), binding corporate rules (BCRs), a legally binding instrument, a code of conduct, certification, ad hoc contractual clauses or administrative arrangements, a derogation, and the articles and points of each; only a record that is a transfer is looked at',
    rule: () => 'a transfer whose safeguard holds a name that is not one of Articles 45, 46, 47 or 49',
    fix: 'write the safeguard as one the regulation names, such as SCCs, BCRs or adequacy decision'
  },
  {
    id: 'adequacy-unconfirmed',
    key: 'adequacyUnconfirmed',
    title: 'a transfer rests on an adequacy decision the tool cannot confirm',
    basis: ['adequacyDecision', 'adequacyList'],
    own: 'only when the adequacy decision is the only safeguard named besides a derogation: one finding per place that is not on the list of src/countries.js, and one per place whose decision has a limited scope (Canada and the United States); a warning, because the list changes and the tool cannot see whether a recipient is covered',
    rule: () => 'a transfer on an adequacy decision to a place with no decision on the list the tool knows, or with a decision of limited scope',
    fix: 'check the adequacy page of the European Commission and the scope of the decision; for the United States, check that the recipient is certified under the Data Privacy Framework, or use another safeguard'
  },
  {
    id: 'derogation-transfer',
    key: 'derogationTransfer',
    title: 'a transfer rests on a derogation of Article 49',
    basis: ['derogations'],
    own: 'only when a derogation is the only safeguard named; info by default, because a derogation can be right for an occasional transfer, but a field in a data map is usually transferred again and again',
    rule: () => 'a transfer whose only safeguard is a derogation for a specific situation',
    fix: 'check that the transfer is occasional and fits one of the situations of Article 49(1), or put an adequacy decision or a safeguard of Article 46 in place'
  },
  {
    id: 'consent-without-reference',
    key: 'consentWithoutReference',
    title: 'consent is the lawful basis and no consent record is named',
    basis: ['consentProof', 'lawfulBases'],
    own: 'only with requireConsentReference set to true in the configuration; the tool checks that a mechanism or reference is named, not that consent was given',
    rule: (config) => (config.requireConsentReference ? 'a record with consent among its lawful bases and an empty consent reference' : 'a record with consent among its lawful bases and an empty consent reference (requireConsentReference is false, so the rule does not report)'),
    fix: 'name where consent is recorded and how it can be withdrawn, such as the consent banner, the form or the record that stores it'
  },
  {
    id: 'processor-without-agreement',
    key: 'processorWithoutAgreement',
    title: 'a processor or recipient has no agreement named',
    basis: ['processorContract', 'processorDefinition'],
    own: 'a processor that is not empty, a blank word, internal, in house, self or own staff, with an empty agreement; the tool cannot tell a processor from another recipient, so it asks for an agreement for both',
    rule: () => 'a record that names a processor or recipient and no agreement reference',
    fix: 'name the data processing agreement or other contract with the processor, or write internal when no one outside handles the data'
  },
  {
    id: 'missing-owner',
    key: 'missingOwner',
    title: 'a field has no owner',
    basis: ['recordController'],
    own: 'an owner per field is the tool\'s own choice: the regulation asks the record to name the controller, and a field with no owner inside the organisation has no one to keep its entry right; any text counts as an owner',
    rule: () => 'a record with an empty owner, or a data map with no owner column',
    fix: 'name the person or team who answers for the field and keeps its entry up to date'
  },
  {
    id: 'duplicate-row',
    key: 'duplicateRow',
    title: 'a field is listed twice for the same purpose',
    basis: ['recordContents'],
    own: 'two records with the same system, store, field and purpose, compared in their term form, in the order of the files and of the records in each; the later one is reported at its field and still checked',
    rule: () => 'a record whose system, store, field and purpose an earlier record already has',
    fix: 'merge the two records into one, or write the purpose that tells them apart'
  },
  {
    id: 'invalid-record',
    key: null,
    title: 'a record that cannot be read',
    basis: ['csvSameFields', 'recordContents'],
    own: 'a record with no field, a CSV row with a different number of fields than the header, a JSON record that is not an object or names a field twice, is not checked; a value of the wrong kind is taken as empty; this rule cannot be set lower or off',
    rule: () => 'a record of the data map with no field, the wrong number of fields or a value of the wrong kind',
    fix: 'correct the record at the line named'
  },
  {
    id: 'unreadable-file',
    key: null,
    title: 'a file that cannot be read',
    basis: ['jsonUtf8', 'csvRecords'],
    own: 'a file that is over its size limit, binary, UTF-16, not valid UTF-8 or not there to open is an error and nothing in it is checked; this rule cannot be set lower or off',
    rule: () => 'a data map that the tool could not read as UTF-8 text',
    fix: 'export the data map as UTF-8 CSV or JSON'
  },
  {
    id: 'unparsable-file',
    key: null,
    title: 'a file that is not CSV or JSON the readers accept, or not a data map',
    basis: ['csvRecords', 'jsonRepeatedNames'],
    own: 'a quoted CSV field that is not closed, a stray double quote, a header with no field column or a column named twice, JSON that does not parse or repeats a name, or JSON that is not a list of records stops the reading of the file, and nothing in it is checked; this rule cannot be set lower or off',
    rule: () => 'a data map that the CSV or JSON reader refuses, or whose header or shape is not that of a data map',
    fix: 'correct the file at the line and column named'
  }
];

export const ruleById = (id) => RULES.find((r) => r.id === id);

// True when a level is at or above another.
export const atOrAbove = (level, min) => LEVELS.indexOf(level) >= LEVELS.indexOf(min);

// The result: the run fails when a finding is at or above the level failOn. { pass, failOn, failing, byLevel, text }.
export function decide(findings, failOn) {
  const byLevel = { error: 0, warning: 0, info: 0 };
  for (const f of findings) byLevel[f.level] += 1;
  const failing = findings.filter((f) => atOrAbove(f.level, failOn)).length;
  const counts = ['error', 'warning', 'info'].filter((l) => byLevel[l]).map((l) => `${grouped(byLevel[l])} ${l}`);
  const text = failing
    ? `FAIL - ${plural(failing, 'finding')} at or above ${failOn}${counts.length ? ` (${counts.join(', ')})` : ''}`
    : `PASS - no finding at or above ${failOn}${counts.length ? ` (${counts.join(', ')})` : ''}`;
  return { pass: failing === 0, failOn, failing, byLevel, text };
}

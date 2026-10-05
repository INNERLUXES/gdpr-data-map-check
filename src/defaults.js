// The built-in configuration: the level of every rule, the other names of the lawful bases, of the categories and of
// the places, whether a consent reference is required, the lowest level shown and the level that fails the run.
// docs/inputs.md describes every key, and --print-defaults writes all of this out.

// The level of every rule that the configuration can set. The three rules of input problems are always errors.
export const DEFAULT_RULES = {
  missingPurpose: 'error',
  missingLawfulBasis: 'error',
  unknownLawfulBasis: 'error',
  missingCategory: 'warning',
  specialCategoryWithoutCondition: 'error',
  criminalOffenceData: 'warning',
  missingRetention: 'error',
  openEndedRetention: 'error',
  unclearRetention: 'warning',
  missingLocation: 'warning',
  transferWithoutSafeguard: 'error',
  unknownSafeguard: 'error',
  adequacyUnconfirmed: 'warning',
  derogationTransfer: 'info',
  consentWithoutReference: 'warning',
  processorWithoutAgreement: 'warning',
  missingOwner: 'warning',
  duplicateRow: 'warning'
};

// Other names of the six lawful bases of Article 6(1), in the form they are compared in (src/words.js legalForm): the
// points of Article 6(1) and the words people often use.
export const DEFAULT_BASIS_ALIASES = {
  '6 1 a': 'consent',
  '6 1 b': 'contract',
  'performance of a contract': 'contract',
  'contractual necessity': 'contract',
  '6 1 c': 'legal obligation',
  'compliance with a legal obligation': 'legal obligation',
  '6 1 d': 'vital interests',
  'vital interest': 'vital interests',
  '6 1 e': 'public task',
  'public interest': 'public task',
  'official authority': 'public task',
  '6 1 f': 'legitimate interests',
  'legitimate interest': 'legitimate interests'
};

// Other names of the special categories of Article 9(1) and of the data of Article 10, in their compared form
// (src/words.js termForm).
export const DEFAULT_CATEGORY_ALIASES = {
  race: 'racial or ethnic origin',
  racial: 'racial or ethnic origin',
  'racial origin': 'racial or ethnic origin',
  ethnic: 'racial or ethnic origin',
  ethnicity: 'racial or ethnic origin',
  'ethnic origin': 'racial or ethnic origin',
  political: 'political opinions',
  'political opinion': 'political opinions',
  religion: 'religious or philosophical beliefs',
  religious: 'religious or philosophical beliefs',
  'religious beliefs': 'religious or philosophical beliefs',
  'philosophical beliefs': 'religious or philosophical beliefs',
  'trade union': 'trade union membership',
  genetic: 'genetic data',
  biometric: 'biometric data',
  biometrics: 'biometric data',
  'health data': 'health',
  'data concerning health': 'health',
  medical: 'health',
  'sex life': 'sex life or sexual orientation',
  'sexual orientation': 'sex life or sexual orientation',
  'sex life or orientation': 'sex life or sexual orientation',
  criminal: 'criminal convictions and offences',
  'criminal offences': 'criminal convictions and offences',
  'criminal offence': 'criminal convictions and offences',
  'criminal convictions': 'criminal convictions and offences',
  'criminal records': 'criminal convictions and offences'
};

// Other names of places, in their compared form, with the two-letter code each one names. None is built in beyond the
// names of src/countries.js.
export const DEFAULT_LOCATION_ALIASES = {};

// Whether a record with consent as its lawful basis must name a consent mechanism or reference.
export const DEFAULT_REQUIRE_CONSENT_REFERENCE = false;

// The lowest level of a finding that is shown.
export const DEFAULT_MIN_SEVERITY = 'info';

// The lowest level of a finding that fails the run.
export const DEFAULT_FAIL_ON = 'error';

// The values of a record read as terms the checks understand: the lawful bases of Article 6, the categories of data
// (special, criminal or other), the retention period, the transfer safeguards and the places. Every function reads a
// value written by people and never guesses: a value it does not know is returned as unknown, and the checks report it.
// No pattern is built from the input; the patterns here are fixed.

import { BASIS_NAMES, CATEGORY_NAMES, SAFEGUARDS } from './data.js';
import { knownPlaces, placeOfCode } from './countries.js';
import { isBlank, legalForm, splitList, termForm } from './words.js';

// The lawful bases of a value: [{ text, basis }], basis being one of the six names or null when it is unknown. The
// parts are separated by semicolons and compared in their legal form, so "Art. 6(1)(b)" is contract.
export function resolveBases(text, aliases) {
  return splitList(text).filter((p) => !isBlank(p)).map((p) => {
    const form = legalForm(p);
    if (BASIS_NAMES.includes(form)) return { text: p, basis: form };
    if (Object.hasOwn(aliases, form)) return { text: p, basis: aliases[form] };
    return { text: p, basis: null };
  });
}

// The categories of a value: [{ text, category }], category being one of the names of Article 9(1), the data of Article
// 10, or null for any other personal data. A part is compared in its term form: first as a whole with the names and the
// aliases, where an alias set to "other" marks ordinary data; then the longest name or alias that appears in it as whole
// words decides, so "health records" is health. terms, from categoryTerms(), can be built once for many values.
export const categoryTerms = (aliases) => [...CATEGORY_NAMES.map((n) => [n, n]), ...Object.entries(aliases)].filter(([, c]) => c !== 'other');

export function classifyCategories(text, aliases, terms = categoryTerms(aliases)) {
  return splitList(text).filter((p) => !isBlank(p)).map((p) => {
    const form = termForm(p);
    if (CATEGORY_NAMES.includes(form)) return { text: p, category: form };
    if (Object.hasOwn(aliases, form)) return { text: p, category: aliases[form] === 'other' ? null : aliases[form] };
    let best = null;
    for (const [term, category] of terms) {
      if (` ${form} `.includes(` ${term} `) && (!best || term.length > best.term.length)) best = { term, category };
    }
    return { text: p, category: best ? best.category : null };
  });
}

// Words that make a retention period open-ended, compared as whole words of the term form.
export const OPEN_ENDED = ['forever', 'never', 'indefinite', 'indefinitely', 'permanent', 'permanently', 'perpetual', 'perpetuity', 'unlimited', 'no limit', 'no time limit', 'until further notice', 'never deleted', 'never erased', 'not deleted', 'no expiry'];

const UNITS = { d: 'day', day: 'day', days: 'day', w: 'week', wk: 'week', wks: 'week', week: 'week', weeks: 'week', m: 'month', mo: 'month', mos: 'month', month: 'month', months: 'month', y: 'year', yr: 'year', yrs: 'year', year: 'year', years: 'year' };
const PERIOD = /(?:^| )(\d{1,4}) ?(days?|d|weeks?|wks?|wk|w|months?|mos?|m|years?|yrs?|yr|y)(?= |$)/;
const ISO = /(?:^| )p((?:\d{1,4}[ymwd]){1,4})(?= |$)/;
const ISO_PART = /(\d{1,4})([ymwd])/g;

// The retention of a record: { state, period }. state is 'missing' (empty or a blank word), 'period' (a number with a
// unit of days, weeks, months or years, or an ISO 8601 duration such as P6M, anywhere in the text), 'open' (no period
// and a word such as forever or indefinite) or 'unclear' (anything else). period is the period found, as "6 years".
export function parseRetention(text) {
  if (isBlank(text)) return { state: 'missing', period: null };
  const form = termForm(text);
  const m = PERIOD.exec(form);
  if (m) {
    const n = Number(m[1]);
    return { state: 'period', period: `${n} ${UNITS[m[2]]}${n === 1 ? '' : 's'}` };
  }
  const iso = ISO.exec(form);
  if (iso) {
    const parts = [...iso[1].matchAll(ISO_PART)].map(([, n, u]) => `${Number(n)} ${UNITS[u]}${Number(n) === 1 ? '' : 's'}`);
    return { state: 'period', period: parts.join(' ') };
  }
  if (OPEN_ENDED.some((w) => ` ${form} `.includes(` ${w} `))) return { state: 'open', period: null };
  return { state: 'unclear', period: null };
}

// The names of every kind of safeguard, in their legal form (src/words.js legalForm).
export const SAFEGUARD_TERMS = {
  adequacy: ['adequacy', 'adequacy decision', 'adequate', '45', 'data privacy framework', 'eu us data privacy framework', 'dpf'],
  scc: ['scc', 'sccs', 'eu scc', 'eu sccs', 'standard contractual clauses', 'standard data protection clauses', '46 2 c', '46 2 d'],
  bcr: ['bcr', 'bcrs', 'binding corporate rules', '47', '46 2 b'],
  instrument: ['legally binding instrument', '46 2 a'],
  code: ['code of conduct', 'approved code of conduct', '46 2 e'],
  certification: ['certification', 'approved certification', '46 2 f'],
  adhoc: ['ad hoc clauses', 'ad hoc contractual clauses', 'contractual clauses', 'administrative arrangement', 'administrative arrangements', '46 3 a', '46 3 b'],
  derogation: ['derogation', 'derogations', '49']
};

// The safeguards of a value: [{ text, kind }], kind being one of the kinds of src/data.js SAFEGUARDS or null when it is
// unknown. A reference to a point of Article 49, such as "49(1)(a)", is a derogation.
export function resolveSafeguards(text) {
  return splitList(text).filter((p) => !isBlank(p)).map((p) => {
    const form = legalForm(p);
    for (const s of SAFEGUARDS) if (SAFEGUARD_TERMS[s.kind].includes(form)) return { text: p, kind: s.kind };
    if (form.startsWith('49 ')) return { text: p, kind: 'derogation' };
    return { text: p, kind: null };
  });
}

// The places of a value: [{ text, code, name, kind, scope, known }], one per part separated by semicolons. A part is
// compared in its term form with the codes, the names and the aliases of src/countries.js and of the configuration. A
// part the tool does not know is a third country, with known false, so the checks can say so and suggest a near name.
// known, from knownPlaces(), can be built once for many values.
export function resolvePlaces(text, aliases = {}, known = knownPlaces(aliases)) {
  return splitList(text).filter((p) => !isBlank(p)).map((p) => {
    const form = termForm(p);
    if (known.has(form)) return { text: p, ...placeOfCode(known.get(form)), known: true };
    return { text: p, code: null, name: null, kind: 'third', scope: null, known: false };
  });
}

// The checks of a data map: every record read, with its lawful bases, categories, retention, places and safeguards, the
// findings of the rules, and the summary per system and of the transfers out of the EU/EEA.
//
// Each record is checked on its own, in the order of the files and of the records in each. A record is a transfer when
// its storage location or the location of its recipient names a place outside the EU/EEA; a place the tool does not
// know counts as outside, and the finding says so. A row that repeats the system, store, field and purpose of an
// earlier one is reported and still checked, so a conflicting second row cannot hide a problem.

import { BASIS_NAMES, CATEGORIES } from './data.js';
import { suggestion } from './config.js';
import { ADEQUATE, EEA, knownPlaces } from './countries.js';
import { listText, plural } from './size.js';
import { categoryTerms, classifyCategories, parseRetention, resolveBases, resolvePlaces, resolveSafeguards } from './terms.js';
import { isBlank, termForm } from './words.js';

export const MAP_LIMITS = { maxSuggestions: 100 };

const quoted = (items, max = 4) => listText(items.map((x) => `"${x}"`), max);

// Values of the processor column that say there is no processor: the blank words and these, in their term form.
export const NO_PROCESSOR = ['internal', 'in house', 'self', 'own staff'];

// The place of a field of a record, or of the record itself when the field is not in its file.
const placeOf = (r, field) => r.at[field] ?? { line: r.line, column: r.column };

// A place as the findings show it: the text as written, with its code when the text is a name.
const placeText = (p) => (p.code && p.code !== p.text ? `${p.text} (${p.code})` : p.text);

// The record as the report shows it.
function itemOf(r) {
  return { system: r.system, store: r.store, field: r.field, file: r.file, line: r.line };
}

// Checks the data maps read: { map, findings, unsuggested }. Each finding is { rule, file, line, column, found, system,
// store, field }.
export function checkMap(datamaps, config, limits = MAP_LIMITS) {
  const lim = { ...MAP_LIMITS, ...limits };
  const findings = [];
  const add = (rule, r, field, found) => {
    const p = placeOf(r, field);
    findings.push({ rule, file: r.file, line: p.line, column: p.column, found, system: r.system, store: r.store, field: r.field });
  };
  const names = [...EEA, ...ADEQUATE].map((c) => c.name).concat(Object.keys(config.locationAliases).filter((n) => n.length > 3));
  let suggested = 0;
  let unsuggested = 0;
  // A near name for a place the tool does not know, within the limit of suggestions.
  const hint = (p) => {
    if (p.known || p.text.length < 4) return '';
    if (suggested >= lim.maxSuggestions) {
      unsuggested += 1;
      return '';
    }
    suggested += 1;
    return suggestion(termForm(p.text), names).replace('; did you mean', ', did you mean');
  };

  const known = knownPlaces(config.locationAliases);
  const terms = categoryTerms(config.categoryAliases);
  const all = datamaps.flatMap((d) => d.records);
  const seen = new Map();
  const byBasis = Object.fromEntries([...BASIS_NAMES.map((b) => [b, 0]), ['none', 0], ['unknown', 0]]);
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c.name, 0]));
  const systems = new Map();
  const transfers = [];
  let special = 0;
  let criminal = 0;
  let processors = 0;

  for (const r of all) {
    const name = r.system;
    if (!systems.has(name)) systems.set(name, { system: name, records: 0, special: 0, criminal: 0, transfers: 0, findings: 0 });
    const sys = systems.get(name);
    sys.records += 1;
    const label = `the field "${r.field}"${r.system || r.store ? ` of ${[r.system, r.store].filter(Boolean).join('/')}` : ''}`;

    // Duplicate rows: the same system, store, field and purpose, compared in their term form.
    const key = [r.system, r.store, r.field, r.purpose].map(termForm).join('\u0000');
    const first = seen.get(key);
    if (first) add('duplicate-row', r, 'field', `${label} is listed again with the same purpose; the first record is at ${first.file}:${first.line}`);
    else seen.set(key, r);

    // Purpose and lawful basis.
    if (isBlank(r.purpose)) add('missing-purpose', r, 'purpose', `${label} has no purpose`);
    const bases = resolveBases(r.lawfulBasis, config.lawfulBasisAliases);
    if (!bases.length) {
      byBasis.none += 1;
      add('missing-lawful-basis', r, 'lawfulBasis', `${label} has no lawful basis`);
    }
    const unknown = bases.filter((b) => b.basis === null);
    if (unknown.length) {
      byBasis.unknown += 1;
      add('unknown-lawful-basis', r, 'lawfulBasis', `${label} has the lawful basis ${quoted(unknown.map((b) => b.text))}, which is not one of the six of Article 6(1) or a known alias`);
    }
    for (const b of new Set(bases.filter((x) => x.basis).map((x) => x.basis))) byBasis[b] += 1;

    // Categories: special categories need an Article 9 condition; criminal offence data falls under Article 10.
    const cats = classifyCategories(r.category, config.categoryAliases, terms);
    if (!cats.length) add('missing-category', r, 'category', `${label} has no category, so the tool cannot tell whether it is special category data`);
    const specials = [...new Set(cats.filter((c) => c.category && c.category !== 'criminal convictions and offences').map((c) => c.category))];
    const isCriminal = cats.some((c) => c.category === 'criminal convictions and offences');
    for (const c of new Set(cats.filter((x) => x.category).map((x) => x.category))) byCategory[c] += 1;
    if (specials.length) {
      special += 1;
      sys.special += 1;
      if (isBlank(r.specialCondition)) add('special-category-without-condition', r, 'specialCondition', `${label} is special category data (${specials.join(', ')}) and names no condition of Article 9(2)`);
    }
    if (isCriminal) {
      criminal += 1;
      sys.criminal += 1;
      add('criminal-offence-data', r, 'category', `${label} is data on criminal convictions and offences; Article 10 allows it only under official authority or a law that permits it${isBlank(r.specialCondition) ? ', and the record names no such basis' : `, named as "${r.specialCondition}"`}`);
    }

    // Retention.
    const retention = parseRetention(r.retention);
    if (retention.state === 'missing') add('missing-retention', r, 'retention', `${label} has no retention period`);
    else if (retention.state === 'open') add('open-ended-retention', r, 'retention', `${label} is kept "${r.retention}", with no end`);
    else if (retention.state === 'unclear') add('unclear-retention', r, 'retention', `${label} has the retention "${r.retention}", in which the tool finds no period (a number with days, weeks, months or years, or an ISO 8601 duration)`);

    // Places and transfers.
    const stored = resolvePlaces(r.location, config.locationAliases, known);
    const received = resolvePlaces(r.recipientLocation, config.locationAliases, known);
    if (!stored.length) add('missing-location', r, 'location', `${label} has no storage location, so the tool cannot tell whether it leaves the EU/EEA`);
    const outside = [...stored, ...received].filter((p) => p.kind !== 'eea');
    const places = [];
    for (const p of outside) if (!places.some((x) => x.text === p.text)) places.push(p);
    const safeguards = resolveSafeguards(r.safeguard);
    if (places.length) {
      sys.transfers += 1;
      transfers.push({ ...itemOf(r), to: places.map(placeText), safeguard: r.safeguard });
      const where = places.map((p) => `${placeText(p)}${p.known ? '' : ` (not a place the tool knows, so taken as outside the EU/EEA${hint(p)})`}`);
      if (!safeguards.length) add('transfer-without-safeguard', r, 'safeguard', `${label} goes to ${listText(where, 4)}, outside the EU/EEA, with no transfer safeguard`);
      const unknownSafeguards = safeguards.filter((s) => s.kind === null);
      if (unknownSafeguards.length) add('unknown-safeguard', r, 'safeguard', `${label} names the transfer safeguard ${quoted(unknownSafeguards.map((s) => s.text))}, which is not an adequacy decision, a safeguard of Article 46 or a derogation of Article 49`);
      const kinds = new Set(safeguards.filter((s) => s.kind).map((s) => s.kind));
      const others = [...kinds].filter((k) => k !== 'adequacy' && k !== 'derogation');
      if (kinds.has('adequacy') && !others.length) {
        for (const p of places) {
          if (p.kind === 'adequate' && p.scope) add('adequacy-unconfirmed', r, 'safeguard', `${label} goes to ${placeText(p)} on an adequacy decision, which covers ${p.scope}; check that the recipient is covered`);
          else if (p.kind !== 'adequate') add('adequacy-unconfirmed', r, 'safeguard', `${label} goes to ${placeText(p)} on an adequacy decision, but ${p.known ? 'the place' : 'it'} is not on the list of adequacy decisions the tool knows${p.known ? '' : hint(p)}`);
        }
      }
      if (kinds.has('derogation') && !others.length && !kinds.has('adequacy')) add('derogation-transfer', r, 'safeguard', `${label} goes to ${listText(places.map(placeText), 4)} on a derogation of Article 49, which is meant for a specific situation and not for a regular transfer`);
    }

    // Consent, processors and owners.
    if (config.requireConsentReference && bases.some((b) => b.basis === 'consent') && isBlank(r.consentReference)) add('consent-without-reference', r, 'consentReference', `${label} rests on consent and names no consent mechanism or reference that shows how consent is recorded`);
    if (!isBlank(r.processor) && !NO_PROCESSOR.includes(termForm(r.processor))) {
      processors += 1;
      if (isBlank(r.agreement)) add('processor-without-agreement', r, 'agreement', `${label} goes to the processor or recipient "${r.processor}", and no agreement is named`);
    }
    if (isBlank(r.owner)) add('missing-owner', r, 'owner', `${label} has no owner`);
  }

  const map = {
    records: all.length,
    systems: [...systems.values()],
    byBasis,
    byCategory,
    special,
    criminal,
    processors,
    transfers
  };
  return { map, findings, unsuggested };
}

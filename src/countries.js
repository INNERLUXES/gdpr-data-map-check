// The places the tool knows, as a data file: the countries of the European Economic Area (the member states of the
// European Union with Iceland, Liechtenstein and Norway), and the countries and territories the European Commission has
// recognised as giving an adequate level of protection under Article 45, with the limits of scope the Commission's
// adequacy page names. docs/inputs.md lists them, and research/sources.md names the pages they come from. A place that
// is none of these is a third country with no adequacy decision the tool knows of.
//
// The list of adequacy decisions changes when the Commission adopts or withdraws a decision. Check the Commission's
// page before you rely on it, and add a place the tool does not know with locationAliases in the configuration.

// The member states of the European Union, with their two-letter codes. Greece is also written EL, the code the EU uses.
export const EU = [
  ['AT', 'Austria'], ['BE', 'Belgium'], ['BG', 'Bulgaria'], ['HR', 'Croatia'], ['CY', 'Cyprus'], ['CZ', 'Czechia'],
  ['DK', 'Denmark'], ['EE', 'Estonia'], ['FI', 'Finland'], ['FR', 'France'], ['DE', 'Germany'], ['GR', 'Greece'],
  ['HU', 'Hungary'], ['IE', 'Ireland'], ['IT', 'Italy'], ['LV', 'Latvia'], ['LT', 'Lithuania'], ['LU', 'Luxembourg'],
  ['MT', 'Malta'], ['NL', 'Netherlands'], ['PL', 'Poland'], ['PT', 'Portugal'], ['RO', 'Romania'], ['SK', 'Slovakia'],
  ['SI', 'Slovenia'], ['ES', 'Spain'], ['SE', 'Sweden']
].map(([code, name]) => ({ code, name }));

// The three countries of the European Economic Area that are not in the European Union.
export const EEA_ONLY = [['IS', 'Iceland'], ['LI', 'Liechtenstein'], ['NO', 'Norway']].map(([code, name]) => ({ code, name }));

// Every country of the EU/EEA.
export const EEA = [...EU, ...EEA_ONLY];

// The countries and territories with an adequacy decision of the Commission, with the limit of its scope where the
// Commission's page names one. The European Patent Organisation also has one; it is an international organisation, not
// a place, and is not listed here.
export const ADEQUATE = [
  { code: 'AD', name: 'Andorra', scope: null },
  { code: 'AR', name: 'Argentina', scope: null },
  { code: 'BR', name: 'Brazil', scope: null },
  { code: 'CA', name: 'Canada', scope: 'commercial organisations only' },
  { code: 'FO', name: 'Faroe Islands', scope: null },
  { code: 'GG', name: 'Guernsey', scope: null },
  { code: 'IL', name: 'Israel', scope: null },
  { code: 'IM', name: 'Isle of Man', scope: null },
  { code: 'JP', name: 'Japan', scope: null },
  { code: 'JE', name: 'Jersey', scope: null },
  { code: 'NZ', name: 'New Zealand', scope: null },
  { code: 'KR', name: 'Republic of Korea', scope: null },
  { code: 'CH', name: 'Switzerland', scope: null },
  { code: 'GB', name: 'United Kingdom', scope: null },
  { code: 'US', name: 'United States', scope: 'only organisations certified under the EU-US Data Privacy Framework' },
  { code: 'UY', name: 'Uruguay', scope: null }
];

// Other names of the places above, in their compared form (src/words.js termForm), with the code each one names.
export const PLACE_ALIASES = {
  eu: 'EU',
  'european union': 'EU',
  eea: 'EEA',
  'european economic area': 'EEA',
  el: 'GR',
  'czech republic': 'CZ',
  'the netherlands': 'NL',
  uk: 'GB',
  'great britain': 'GB',
  korea: 'KR',
  'south korea': 'KR',
  usa: 'US',
  'united states of america': 'US'
};

// What a code names: { code, name, kind, scope }, kind being 'eea', 'adequate' or 'third'. EU and EEA stand for a
// place somewhere in the EU/EEA. A code the tool does not list is a third country.
export function placeOfCode(code) {
  if (code === 'EU' || code === 'EEA') return { code, name: code === 'EU' ? 'European Union' : 'European Economic Area', kind: 'eea', scope: null };
  const eea = EEA.find((c) => c.code === code);
  if (eea) return { code, name: eea.name, kind: 'eea', scope: null };
  const adequate = ADEQUATE.find((c) => c.code === code);
  if (adequate) return { code, name: adequate.name, kind: 'adequate', scope: adequate.scope };
  return { code, name: null, kind: 'third', scope: null };
}

// Every name the tool knows, in its compared form, with the code it names: the codes, the names and the aliases.
export function knownPlaces(extra = {}) {
  const out = new Map();
  for (const c of [...EEA, ...ADEQUATE]) {
    out.set(c.code.toLowerCase(), c.code);
    out.set(c.name.toLowerCase(), c.code);
  }
  for (const [k, v] of Object.entries(PLACE_ALIASES)) out.set(k, v);
  for (const [k, v] of Object.entries(extra)) out.set(k, v);
  return out;
}

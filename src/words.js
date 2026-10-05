// Words compared as the tool compares them: the letters A to Z lowered whatever the locale. Used for the names of
// files, the columns of a CSV header, the keys of a JSON record, the lawful bases, the categories, the places, the
// safeguards, the retention periods and the suggestions of the configuration.

// Lowercase for the letters A to Z only, so the result does not depend on the locale.
export const asciiLower = (text) => String(text).replace(/[A-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 32));

// The last part of a path with forward slashes: "a/b/data-map.csv" is "data-map.csv".
export const baseName = (path) => String(path).slice(String(path).lastIndexOf('/') + 1);

// The form a term is compared in: the letters A to Z lowered, and every run of characters that are not a letter A to Z
// or a digit made one space, trimmed. "Legal Obligation" is "legal obligation", "6(1)(c)" is "6 1 c" and "n/a" is
// "n a".
export const termForm = (text) => asciiLower(text).replace(/[^a-z0-9]+/g, ' ').trim();

// The form of a reference to the regulation: the term form without a leading "article", "art" or "gdpr" and without a
// trailing "gdpr", so "Art. 6(1)(f) GDPR" is "6 1 f".
export const legalForm = (text) => termForm(text).replace(/^(?:(?:article|art|gdpr) )+/, '').replace(/(?: gdpr)+$/, '');

// The form the name of a column or of a key is compared in: the letters A to Z lowered, with white space, hyphens and
// underscores taken out. "Lawful Basis", "lawful_basis" and "lawfulBasis" are all "lawfulbasis".
export const fieldForm = (text) => asciiLower(text).replace(/[\s_-]+/g, '');

// Values that stand for nothing: an empty text, a dash, a question mark and the words people write for a blank cell.
// They are compared in their term form.
export const BLANK_WORDS = ['', 'none', 'n a', 'na', 'nil', 'tbd', 'tbc', 'todo', 'to do', 'unknown', 'not known', 'not set'];

// True when a value says nothing: empty, or one of the blank words.
export const isBlank = (text) => BLANK_WORDS.includes(termForm(text));

// The parts of a value that holds a list: separated by semicolons, each trimmed, the empty ones left out, each named
// once in the order written.
export function splitList(text) {
  const out = [];
  for (const part of String(text).split(';')) {
    const p = part.trim();
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}

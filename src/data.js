// The public pages the checks rest on, and what each says, written in this project's own words. research/sources.md
// lists every page with a longer note on each, and test/data.test.js checks that every page here is listed there and
// that every rule names points that exist. The code in src/ uses these constants and never writes a reason of its own
// in a report. The pages of the regulation are the ones of gdpr-info.eu, which shows the text of the regulation one
// article per page.

const ART = (n) => `https://gdpr-info.eu/art-${n}-gdpr/`;

export const SOURCES = [
  { id: 'art4', title: 'Art. 4 GDPR, Definitions (gdpr-info.eu)', url: ART(4) },
  { id: 'art5', title: 'Art. 5 GDPR, Principles relating to processing of personal data (gdpr-info.eu)', url: ART(5) },
  { id: 'art6', title: 'Art. 6 GDPR, Lawfulness of processing (gdpr-info.eu)', url: ART(6) },
  { id: 'art7', title: 'Art. 7 GDPR, Conditions for consent (gdpr-info.eu)', url: ART(7) },
  { id: 'art9', title: 'Art. 9 GDPR, Processing of special categories of personal data (gdpr-info.eu)', url: ART(9) },
  { id: 'art10', title: 'Art. 10 GDPR, Processing of personal data relating to criminal convictions and offences (gdpr-info.eu)', url: ART(10) },
  { id: 'art28', title: 'Art. 28 GDPR, Processor (gdpr-info.eu)', url: ART(28) },
  { id: 'art30', title: 'Art. 30 GDPR, Records of processing activities (gdpr-info.eu)', url: ART(30) },
  { id: 'art44', title: 'Art. 44 GDPR, General principle for transfers (gdpr-info.eu)', url: ART(44) },
  { id: 'art45', title: 'Art. 45 GDPR, Transfers on the basis of an adequacy decision (gdpr-info.eu)', url: ART(45) },
  { id: 'art46', title: 'Art. 46 GDPR, Transfers subject to appropriate safeguards (gdpr-info.eu)', url: ART(46) },
  { id: 'art49', title: 'Art. 49 GDPR, Derogations for specific situations (gdpr-info.eu)', url: ART(49) },
  { id: 'adequacy', title: 'Data protection adequacy for non-EU countries (European Commission)', url: 'https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en' },
  { id: 'rfc4180', title: 'RFC 4180, Common Format and MIME Type for Comma-Separated Values (CSV) Files', url: 'https://www.rfc-editor.org/rfc/rfc4180' },
  { id: 'rfc8259', title: 'RFC 8259, The JSON Data Interchange Format', url: 'https://www.rfc-editor.org/rfc/rfc8259' },
  { id: 'owaspCsv', title: 'CSV Injection (OWASP)', url: 'https://community.owasp.org/attacks/CSV_Injection' },
  { id: 'githubCommands', title: 'Workflow commands for GitHub Actions (GitHub Docs)', url: 'https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands' }
];

export const source = (id) => SOURCES.find((s) => s.id === id);

// What a page says, in this project's own words. Each point names its page.
export const POINTS = {
  personalData: { source: 'art4', text: 'personal data is any information about an identified or identifiable natural person, such as a name, an identification number, location data or an online identifier' },
  specialDefinitions: { source: 'art4', text: 'the regulation defines genetic data, biometric data that identifies a person through technical processing, and data concerning health, which includes information on health care that reveals the state of health' },
  processorDefinition: { source: 'art4', text: 'a processor handles personal data on behalf of the controller, and a recipient is anyone to whom personal data are disclosed' },
  purposeLimitation: { source: 'art5', text: 'personal data are collected for specified, explicit and legitimate purposes and are not processed further in a way that does not fit those purposes' },
  storageLimitation: { source: 'art5', text: 'personal data are kept in a form that identifies people for no longer than the purposes of the processing need' },
  lawfulBases: { source: 'art6', text: 'processing is lawful only when at least one of six grounds applies: consent, a contract, a legal obligation, vital interests, a public task or legitimate interests' },
  consentProof: { source: 'art7', text: 'where processing rests on consent, the controller must be able to show that the person consented, and the person may withdraw consent at any time' },
  specialCategories: { source: 'art9', text: 'processing data that reveals racial or ethnic origin, political opinions, religious or philosophical beliefs or trade union membership, and genetic, biometric, health and sex life or sexual orientation data, is prohibited unless a condition of Article 9(2) applies' },
  article9Conditions: { source: 'art9', text: 'the conditions of Article 9(2) include explicit consent, employment and social protection law, vital interests, data made public by the person, legal claims, substantial public interest, health care, public health and research' },
  criminalData: { source: 'art10', text: 'data on criminal convictions and offences may be processed only under the control of official authority or when Union or Member State law allows it with safeguards for the people concerned' },
  processorContract: { source: 'art28', text: 'processing by a processor is governed by a contract or another legal act that sets out the subject, duration, nature and purpose of the processing, the kinds of data, the people concerned and the duties of both sides' },
  recordContents: { source: 'art30', text: 'the record of processing activities holds the purposes of the processing, the categories of data subjects and of personal data, and the categories of recipients' },
  recordController: { source: 'art30', text: 'the record names the controller with its contact details, and the data protection officer where there is one' },
  recordTransfers: { source: 'art30', text: 'the record names the transfers to a third country or an international organisation, with the safeguards where they are needed' },
  recordErasure: { source: 'art30', text: 'where possible, the record gives the time limits for erasure of each category of data' },
  transferPrinciple: { source: 'art44', text: 'a transfer of personal data to a third country or an international organisation, onward transfers included, takes place only under the conditions of Chapter V, so that the protection of the regulation is not undermined' },
  adequacyDecision: { source: 'art45', text: 'a transfer may take place without a specific authorisation where the Commission has decided that the third country ensures an adequate level of protection' },
  appropriateSafeguards: { source: 'art46', text: 'without an adequacy decision, a transfer needs appropriate safeguards, such as binding corporate rules, standard data protection clauses, an approved code of conduct or certification, with enforceable rights for the people concerned' },
  derogations: { source: 'art49', text: 'without an adequacy decision or appropriate safeguards, a transfer may rest only on a derogation for a specific situation, such as explicit consent to the transfer, a contract with the person or a legal claim' },
  adequacyList: { source: 'adequacy', text: 'the Commission lists the countries and territories it has recognised as adequate; the decision for Canada covers commercial organisations, and the one for the United States covers only organisations in the EU-US Data Privacy Framework' },
  csvRecords: { source: 'rfc4180', text: 'each record of a CSV file is on its own line, ended by CRLF, the first line may be a header, and a field that holds a comma, a double quote or a line break is put in double quotes, with a double quote inside it written twice' },
  csvSameFields: { source: 'rfc4180', text: 'every line of a CSV file should hold the same number of fields' },
  csvInjection: { source: 'owaspCsv', text: 'a spreadsheet may read a cell that starts with =, +, -, @, a tab or a line break as a formula, and no one escape is safe in every program that opens the file' },
  jsonUtf8: { source: 'rfc8259', text: 'JSON text exchanged between systems must be UTF-8, and a reader may ignore a byte order mark at the start' },
  jsonRepeatedNames: { source: 'rfc8259', text: 'when an object repeats a name the behavior of the software that reads it cannot be predicted, so the reader of this tool refuses a repeated name' },
  githubAnnotations: { source: 'githubCommands', text: 'a line of output such as ::warning file=...,line=...::message becomes an annotation on that file and line in the run' }
};

// The page of a point.
export const pointPage = (key) => source(POINTS[key].source);

// The six lawful bases of Article 6(1), in its order, with the point of each.
export const BASES = [
  { name: 'consent', point: '6(1)(a)' },
  { name: 'contract', point: '6(1)(b)' },
  { name: 'legal obligation', point: '6(1)(c)' },
  { name: 'vital interests', point: '6(1)(d)' },
  { name: 'public task', point: '6(1)(e)' },
  { name: 'legitimate interests', point: '6(1)(f)' }
];

export const BASIS_NAMES = BASES.map((b) => b.name);

// The special categories of Article 9(1), in its order, and the data on criminal convictions and offences of Article
// 10, each with the article that governs it.
export const CATEGORIES = [
  { name: 'racial or ethnic origin', article: 9 },
  { name: 'political opinions', article: 9 },
  { name: 'religious or philosophical beliefs', article: 9 },
  { name: 'trade union membership', article: 9 },
  { name: 'genetic data', article: 9 },
  { name: 'biometric data', article: 9 },
  { name: 'health', article: 9 },
  { name: 'sex life or sexual orientation', article: 9 },
  { name: 'criminal convictions and offences', article: 10 }
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

// The kinds of transfer safeguard, from Articles 45, 46, 47 and 49, with the point of the regulation each rests on.
export const SAFEGUARDS = [
  { kind: 'adequacy', name: 'adequacy decision', point: 'Article 45' },
  { kind: 'scc', name: 'standard data protection clauses', point: 'Article 46(2)(c) and (d)' },
  { kind: 'bcr', name: 'binding corporate rules', point: 'Article 46(2)(b) and Article 47' },
  { kind: 'instrument', name: 'legally binding instrument between public authorities', point: 'Article 46(2)(a)' },
  { kind: 'code', name: 'approved code of conduct', point: 'Article 46(2)(e)' },
  { kind: 'certification', name: 'approved certification', point: 'Article 46(2)(f)' },
  { kind: 'adhoc', name: 'authorised contractual clauses or administrative arrangements', point: 'Article 46(3)' },
  { kind: 'derogation', name: 'derogation for a specific situation', point: 'Article 49' }
];

// The levels of a finding, from the lowest.
export const LEVELS = ['info', 'warning', 'error'];

// The sentence every report ends with, before the result.
export const NOTICE = 'This check reads the data map as it is written. It is an engineering aid, not legal advice: it does not see the data itself, decide whether a lawful basis, an Article 9 condition or a transfer safeguard fits the processing, or replace a review by your data protection officer or a lawyer (docs/limits.md).';

# Rules and sources

Every rule rests on points of public pages, written in this project's own words; this document lists them, with the
choices that are the tool's own and what to change. The same points are in src/data.js and are shown by `--explain`;
research/sources.md has a longer note on each page. The tool is an engineering aid, not legal advice: a point says
what a page says, and a finding says what the data map holds, not whether the processing is lawful.

## The lawful bases

The six lawful bases of Article 6(1), in its order. A lawful basis is written by its name or by its point, such as
`6(1)(b)` or `Art. 6(1)(b) GDPR`.

| Basis | Point |
| --- | --- |
| `consent` | Article 6(1)(a) |
| `contract` | Article 6(1)(b) |
| `legal obligation` | Article 6(1)(c) |
| `vital interests` | Article 6(1)(d) |
| `public task` | Article 6(1)(e) |
| `legitimate interests` | Article 6(1)(f) |

Source: Art. 6 GDPR, Lawfulness of processing (gdpr-info.eu), https://gdpr-info.eu/art-6-gdpr/

## The special categories and criminal offence data

| Category | Article |
| --- | --- |
| `racial or ethnic origin` | Article 9(1), special category |
| `political opinions` | Article 9(1), special category |
| `religious or philosophical beliefs` | Article 9(1), special category |
| `trade union membership` | Article 9(1), special category |
| `genetic data` | Article 9(1), special category |
| `biometric data` | Article 9(1), special category |
| `health` | Article 9(1), special category |
| `sex life or sexual orientation` | Article 9(1), special category |
| `criminal convictions and offences` | Article 10 |

Source: Art. 9 GDPR, Processing of special categories of personal data (gdpr-info.eu), https://gdpr-info.eu/art-9-gdpr/; Art. 10 GDPR, Processing of personal data relating to criminal convictions and offences (gdpr-info.eu), https://gdpr-info.eu/art-10-gdpr/

## The transfer safeguards

| Kind | Safeguard | Point |
| --- | --- | --- |
| `adequacy` | adequacy decision | Article 45 |
| `scc` | standard data protection clauses | Article 46(2)(c) and (d) |
| `bcr` | binding corporate rules | Article 46(2)(b) and Article 47 |
| `instrument` | legally binding instrument between public authorities | Article 46(2)(a) |
| `code` | approved code of conduct | Article 46(2)(e) |
| `certification` | approved certification | Article 46(2)(f) |
| `adhoc` | authorised contractual clauses or administrative arrangements | Article 46(3) |
| `derogation` | derogation for a specific situation | Article 49 |

## The rules

| Rule | Default level | Points |
| --- | --- | --- |
| `missing-purpose` | error | `recordContents`, `purposeLimitation` |
| `missing-lawful-basis` | error | `lawfulBases` |
| `unknown-lawful-basis` | error | `lawfulBases` |
| `missing-category` | warning | `recordContents`, `personalData` |
| `special-category-without-condition` | error | `specialCategories`, `article9Conditions`, `specialDefinitions` |
| `criminal-offence-data` | warning | `criminalData` |
| `missing-retention` | error | `storageLimitation`, `recordErasure` |
| `open-ended-retention` | error | `storageLimitation`, `recordErasure` |
| `unclear-retention` | warning | `recordErasure` |
| `missing-location` | warning | `transferPrinciple`, `recordTransfers` |
| `transfer-without-safeguard` | error | `transferPrinciple`, `appropriateSafeguards`, `recordTransfers` |
| `unknown-safeguard` | error | `adequacyDecision`, `appropriateSafeguards`, `derogations` |
| `adequacy-unconfirmed` | warning | `adequacyDecision`, `adequacyList` |
| `derogation-transfer` | info | `derogations` |
| `consent-without-reference` | warning | `consentProof`, `lawfulBases` |
| `processor-without-agreement` | warning | `processorContract`, `processorDefinition` |
| `missing-owner` | warning | `recordController` |
| `duplicate-row` | warning | `recordContents` |
| `invalid-record` | error, always | `csvSameFields`, `recordContents` |
| `unreadable-file` | error, always | `jsonUtf8`, `csvRecords` |
| `unparsable-file` | error, always | `csvRecords`, `jsonRepeatedNames` |

### `missing-purpose`

A field has no purpose: a record with an empty purpose, or a data map with no purpose column.

Points:

- `recordContents`: the record of processing activities holds the purposes of the processing, the categories of data subjects and of personal data, and the categories of recipients (Art. 30 GDPR, Records of processing activities (gdpr-info.eu), https://gdpr-info.eu/art-30-gdpr/)
- `purposeLimitation`: personal data are collected for specified, explicit and legitimate purposes and are not processed further in a way that does not fit those purposes (Art. 5 GDPR, Principles relating to processing of personal data (gdpr-info.eu), https://gdpr-info.eu/art-5-gdpr/)

The tool's own choice: a purpose that is empty or a blank word such as none, n/a or tbd; any other text counts as a purpose, the tool cannot tell whether it is specific or legitimate.

What to change: write the specific purpose the field is collected and used for.

### `missing-lawful-basis`

A field has no lawful basis: a record with an empty lawful basis, or a data map with no lawful basis column.

Points:

- `lawfulBases`: processing is lawful only when at least one of six grounds applies: consent, a contract, a legal obligation, vital interests, a public task or legitimate interests (Art. 6 GDPR, Lawfulness of processing (gdpr-info.eu), https://gdpr-info.eu/art-6-gdpr/)

The tool's own choice: a lawful basis that is empty or a blank word; the tool checks that a basis is named, not that it fits the processing.

What to change: name the lawful basis of Article 6(1) the processing rests on: consent, contract, legal obligation, vital interests, public task or legitimate interests.

### `unknown-lawful-basis`

A lawful basis is not one of the six of Article 6(1): a lawful basis that is none of consent, contract, legal obligation, vital interests, public task, legitimate interests and the 13 aliases of the configuration.

Points:

- `lawfulBases`: processing is lawful only when at least one of six grounds applies: consent, a contract, a legal obligation, vital interests, a public task or legitimate interests (Art. 6 GDPR, Lawfulness of processing (gdpr-info.eu), https://gdpr-info.eu/art-6-gdpr/)

The tool's own choice: a basis is compared with the letters A to Z lowered, every other character made a space and a leading article or art and a trailing gdpr left out, so "Art. 6(1)(b)" is contract; several bases are separated by semicolons, and one finding lists every unknown one of a record.

What to change: write one of the six lawful bases, or add the words your team uses to lawfulBasisAliases in the configuration.

### `missing-category`

A field has no category of data: a record with an empty category, or a data map with no category column.

Points:

- `recordContents`: the record of processing activities holds the purposes of the processing, the categories of data subjects and of personal data, and the categories of recipients (Art. 30 GDPR, Records of processing activities (gdpr-info.eu), https://gdpr-info.eu/art-30-gdpr/)
- `personalData`: personal data is any information about an identified or identifiable natural person, such as a name, an identification number, location data or an online identifier (Art. 4 GDPR, Definitions (gdpr-info.eu), https://gdpr-info.eu/art-4-gdpr/)

The tool's own choice: a warning, because without a category the tool cannot tell whether the field is special category or criminal offence data, so those checks cannot look at it.

What to change: write the category of the data, such as contact, identity, financial, location or health.

### `special-category-without-condition`

Special category data has no Article 9 condition: a record whose category is one of the eight special categories of Article 9(1), or one of the 22 aliases for them, with an empty special category condition.

Points:

- `specialCategories`: processing data that reveals racial or ethnic origin, political opinions, religious or philosophical beliefs or trade union membership, and genetic, biometric, health and sex life or sexual orientation data, is prohibited unless a condition of Article 9(2) applies (Art. 9 GDPR, Processing of special categories of personal data (gdpr-info.eu), https://gdpr-info.eu/art-9-gdpr/)
- `article9Conditions`: the conditions of Article 9(2) include explicit consent, employment and social protection law, vital interests, data made public by the person, legal claims, substantial public interest, health care, public health and research (Art. 9 GDPR, Processing of special categories of personal data (gdpr-info.eu), https://gdpr-info.eu/art-9-gdpr/)
- `specialDefinitions`: the regulation defines genetic data, biometric data that identifies a person through technical processing, and data concerning health, which includes information on health care that reveals the state of health (Art. 4 GDPR, Definitions (gdpr-info.eu), https://gdpr-info.eu/art-4-gdpr/)

The tool's own choice: a category is special when its name, an alias, or the longest name or alias it holds as whole words is one of Article 9(1), so "health records" is health; an alias set to other marks a word as ordinary data; any text in the condition column counts as a condition, the tool cannot tell whether it applies.

What to change: name the condition of Article 9(2) the processing rests on, such as explicit consent, employment law or health care, or stop collecting the field.

### `criminal-offence-data`

A field holds data on criminal convictions and offences: a record whose category is criminal convictions and offences, or an alias for it.

Points:

- `criminalData`: data on criminal convictions and offences may be processed only under the control of official authority or when Union or Member State law allows it with safeguards for the people concerned (Art. 10 GDPR, Processing of personal data relating to criminal convictions and offences (gdpr-info.eu), https://gdpr-info.eu/art-10-gdpr/)

The tool's own choice: a warning for every such record, with or without a condition named, because Article 10 asks for official authority or a law that allows the processing, which the tool cannot check; the condition column is shown when it is filled.

What to change: check that the processing is under official authority or allowed by Union or Member State law, and name that law in the condition column.

### `missing-retention`

A field has no retention period: a record with an empty retention, or a data map with no retention column.

Points:

- `storageLimitation`: personal data are kept in a form that identifies people for no longer than the purposes of the processing need (Art. 5 GDPR, Principles relating to processing of personal data (gdpr-info.eu), https://gdpr-info.eu/art-5-gdpr/)
- `recordErasure`: where possible, the record gives the time limits for erasure of each category of data (Art. 30 GDPR, Records of processing activities (gdpr-info.eu), https://gdpr-info.eu/art-30-gdpr/)

The tool's own choice: a retention that is empty or a blank word; an error, because a field with no period is kept for as long as nobody deletes it.

What to change: write how long the field is kept, such as 6 years after the end of the contract or 30 days.

### `open-ended-retention`

A retention period has no end: a retention that says the data is kept with no end.

Points:

- `storageLimitation`: personal data are kept in a form that identifies people for no longer than the purposes of the processing need (Art. 5 GDPR, Principles relating to processing of personal data (gdpr-info.eu), https://gdpr-info.eu/art-5-gdpr/)
- `recordErasure`: where possible, the record gives the time limits for erasure of each category of data (Art. 30 GDPR, Records of processing activities (gdpr-info.eu), https://gdpr-info.eu/art-30-gdpr/)

The tool's own choice: a retention with no period the tool can read and a word such as forever, never, indefinite, permanent, unlimited or until further notice; a text that also names a period, such as deleted permanently after 30 days, has an end.

What to change: set an end to the retention, or the event after which the data is erased, with a period.

### `unclear-retention`

A retention period cannot be read: a retention that names no period the tool can read and no word for an open end.

Points:

- `recordErasure`: where possible, the record gives the time limits for erasure of each category of data (Art. 30 GDPR, Records of processing activities (gdpr-info.eu), https://gdpr-info.eu/art-30-gdpr/)

The tool's own choice: a period is a whole number of up to four digits with a unit of days, weeks, months or years (d, w, m, y and their plurals), or an ISO 8601 duration such as P6M, anywhere in the text; a retention that names only an event, such as until the account is closed, or writes the number in words, is unclear; a warning, because the period may still be in the text.

What to change: write the period as a number with a unit, such as 90 days or 2 years after the last order.

### `missing-location`

A field has no storage location: a record with an empty storage location, or a data map with no location column.

Points:

- `transferPrinciple`: a transfer of personal data to a third country or an international organisation, onward transfers included, takes place only under the conditions of Chapter V, so that the protection of the regulation is not undermined (Art. 44 GDPR, General principle for transfers (gdpr-info.eu), https://gdpr-info.eu/art-44-gdpr/)
- `recordTransfers`: the record names the transfers to a third country or an international organisation, with the safeguards where they are needed (Art. 30 GDPR, Records of processing activities (gdpr-info.eu), https://gdpr-info.eu/art-30-gdpr/)

The tool's own choice: a storage location that is empty or a blank word; a warning, because without it the tool cannot tell whether the data leaves the EU/EEA.

What to change: write the country where the data is stored, as a name or a two-letter code.

### `transfer-without-safeguard`

Data leaves the EU/EEA with no transfer safeguard: a record stored in or sent to a place outside the EU/EEA, with an empty transfer safeguard.

Points:

- `transferPrinciple`: a transfer of personal data to a third country or an international organisation, onward transfers included, takes place only under the conditions of Chapter V, so that the protection of the regulation is not undermined (Art. 44 GDPR, General principle for transfers (gdpr-info.eu), https://gdpr-info.eu/art-44-gdpr/)
- `appropriateSafeguards`: without an adequacy decision, a transfer needs appropriate safeguards, such as binding corporate rules, standard data protection clauses, an approved code of conduct or certification, with enforceable rights for the people concerned (Art. 46 GDPR, Transfers subject to appropriate safeguards (gdpr-info.eu), https://gdpr-info.eu/art-46-gdpr/)
- `recordTransfers`: the record names the transfers to a third country or an international organisation, with the safeguards where they are needed (Art. 30 GDPR, Records of processing activities (gdpr-info.eu), https://gdpr-info.eu/art-30-gdpr/)

The tool's own choice: a record is a transfer when its storage location or the location of its recipient names a place outside the EU/EEA; a place the tool does not know, a typo included, counts as outside, and the finding says so with a near name when there is one; a place of the EU/EEA is a country of src/countries.js, its code, EU, EEA or an alias of the configuration.

What to change: name the safeguard of the transfer: an adequacy decision, standard contractual clauses, binding corporate rules or another safeguard of Article 46, or keep the data in the EU/EEA.

### `unknown-safeguard`

A transfer safeguard is not one the regulation names: a transfer whose safeguard holds a name that is not one of Articles 45, 46, 47 or 49.

Points:

- `adequacyDecision`: a transfer may take place without a specific authorisation where the Commission has decided that the third country ensures an adequate level of protection (Art. 45 GDPR, Transfers on the basis of an adequacy decision (gdpr-info.eu), https://gdpr-info.eu/art-45-gdpr/)
- `appropriateSafeguards`: without an adequacy decision, a transfer needs appropriate safeguards, such as binding corporate rules, standard data protection clauses, an approved code of conduct or certification, with enforceable rights for the people concerned (Art. 46 GDPR, Transfers subject to appropriate safeguards (gdpr-info.eu), https://gdpr-info.eu/art-46-gdpr/)
- `derogations`: without an adequacy decision or appropriate safeguards, a transfer may rest only on a derogation for a specific situation, such as explicit consent to the transfer, a contract with the person or a legal claim (Art. 49 GDPR, Derogations for specific situations (gdpr-info.eu), https://gdpr-info.eu/art-49-gdpr/)

The tool's own choice: a safeguard is compared like a lawful basis; the known names are adequacy decision, the Data Privacy Framework, standard contractual clauses (SCCs), binding corporate rules (BCRs), a legally binding instrument, a code of conduct, certification, ad hoc contractual clauses or administrative arrangements, a derogation, and the articles and points of each; only a record that is a transfer is looked at.

What to change: write the safeguard as one the regulation names, such as SCCs, BCRs or adequacy decision.

### `adequacy-unconfirmed`

A transfer rests on an adequacy decision the tool cannot confirm: a transfer on an adequacy decision to a place with no decision on the list the tool knows, or with a decision of limited scope.

Points:

- `adequacyDecision`: a transfer may take place without a specific authorisation where the Commission has decided that the third country ensures an adequate level of protection (Art. 45 GDPR, Transfers on the basis of an adequacy decision (gdpr-info.eu), https://gdpr-info.eu/art-45-gdpr/)
- `adequacyList`: the Commission lists the countries and territories it has recognised as adequate; the decision for Canada covers commercial organisations, and the one for the United States covers only organisations in the EU-US Data Privacy Framework (Data protection adequacy for non-EU countries (European Commission), https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en)

The tool's own choice: only when the adequacy decision is the only safeguard named besides a derogation: one finding per place that is not on the list of src/countries.js, and one per place whose decision has a limited scope (Canada and the United States); a warning, because the list changes and the tool cannot see whether a recipient is covered.

What to change: check the adequacy page of the European Commission and the scope of the decision; for the United States, check that the recipient is certified under the Data Privacy Framework, or use another safeguard.

### `derogation-transfer`

A transfer rests on a derogation of Article 49: a transfer whose only safeguard is a derogation for a specific situation.

Points:

- `derogations`: without an adequacy decision or appropriate safeguards, a transfer may rest only on a derogation for a specific situation, such as explicit consent to the transfer, a contract with the person or a legal claim (Art. 49 GDPR, Derogations for specific situations (gdpr-info.eu), https://gdpr-info.eu/art-49-gdpr/)

The tool's own choice: only when a derogation is the only safeguard named; info by default, because a derogation can be right for an occasional transfer, but a field in a data map is usually transferred again and again.

What to change: check that the transfer is occasional and fits one of the situations of Article 49(1), or put an adequacy decision or a safeguard of Article 46 in place.

### `consent-without-reference`

Consent is the lawful basis and no consent record is named: a record with consent among its lawful bases and an empty consent reference (requireConsentReference is false, so the rule does not report).

Points:

- `consentProof`: where processing rests on consent, the controller must be able to show that the person consented, and the person may withdraw consent at any time (Art. 7 GDPR, Conditions for consent (gdpr-info.eu), https://gdpr-info.eu/art-7-gdpr/)
- `lawfulBases`: processing is lawful only when at least one of six grounds applies: consent, a contract, a legal obligation, vital interests, a public task or legitimate interests (Art. 6 GDPR, Lawfulness of processing (gdpr-info.eu), https://gdpr-info.eu/art-6-gdpr/)

The tool's own choice: only with requireConsentReference set to true in the configuration; the tool checks that a mechanism or reference is named, not that consent was given.

What to change: name where consent is recorded and how it can be withdrawn, such as the consent banner, the form or the record that stores it.

### `processor-without-agreement`

A processor or recipient has no agreement named: a record that names a processor or recipient and no agreement reference.

Points:

- `processorContract`: processing by a processor is governed by a contract or another legal act that sets out the subject, duration, nature and purpose of the processing, the kinds of data, the people concerned and the duties of both sides (Art. 28 GDPR, Processor (gdpr-info.eu), https://gdpr-info.eu/art-28-gdpr/)
- `processorDefinition`: a processor handles personal data on behalf of the controller, and a recipient is anyone to whom personal data are disclosed (Art. 4 GDPR, Definitions (gdpr-info.eu), https://gdpr-info.eu/art-4-gdpr/)

The tool's own choice: a processor that is not empty, a blank word, internal, in house, self or own staff, with an empty agreement; the tool cannot tell a processor from another recipient, so it asks for an agreement for both.

What to change: name the data processing agreement or other contract with the processor, or write internal when no one outside handles the data.

### `missing-owner`

A field has no owner: a record with an empty owner, or a data map with no owner column.

Points:

- `recordController`: the record names the controller with its contact details, and the data protection officer where there is one (Art. 30 GDPR, Records of processing activities (gdpr-info.eu), https://gdpr-info.eu/art-30-gdpr/)

The tool's own choice: an owner per field is the tool's own choice: the regulation asks the record to name the controller, and a field with no owner inside the organisation has no one to keep its entry right; any text counts as an owner.

What to change: name the person or team who answers for the field and keeps its entry up to date.

### `duplicate-row`

A field is listed twice for the same purpose: a record whose system, store, field and purpose an earlier record already has.

Points:

- `recordContents`: the record of processing activities holds the purposes of the processing, the categories of data subjects and of personal data, and the categories of recipients (Art. 30 GDPR, Records of processing activities (gdpr-info.eu), https://gdpr-info.eu/art-30-gdpr/)

The tool's own choice: two records with the same system, store, field and purpose, compared in their term form, in the order of the files and of the records in each; the later one is reported at its field and still checked.

What to change: merge the two records into one, or write the purpose that tells them apart.

### `invalid-record`

A record that cannot be read: a record of the data map with no field, the wrong number of fields or a value of the wrong kind.

Points:

- `csvSameFields`: every line of a CSV file should hold the same number of fields (RFC 4180, Common Format and MIME Type for Comma-Separated Values (CSV) Files, https://www.rfc-editor.org/rfc/rfc4180)
- `recordContents`: the record of processing activities holds the purposes of the processing, the categories of data subjects and of personal data, and the categories of recipients (Art. 30 GDPR, Records of processing activities (gdpr-info.eu), https://gdpr-info.eu/art-30-gdpr/)

The tool's own choice: a record with no field, a CSV row with a different number of fields than the header, a JSON record that is not an object or names a field twice, is not checked; a value of the wrong kind is taken as empty; this rule cannot be set lower or off.

What to change: correct the record at the line named.

### `unreadable-file`

A file that cannot be read: a data map that the tool could not read as UTF-8 text.

Points:

- `jsonUtf8`: JSON text exchanged between systems must be UTF-8, and a reader may ignore a byte order mark at the start (RFC 8259, The JSON Data Interchange Format, https://www.rfc-editor.org/rfc/rfc8259)
- `csvRecords`: each record of a CSV file is on its own line, ended by CRLF, the first line may be a header, and a field that holds a comma, a double quote or a line break is put in double quotes, with a double quote inside it written twice (RFC 4180, Common Format and MIME Type for Comma-Separated Values (CSV) Files, https://www.rfc-editor.org/rfc/rfc4180)

The tool's own choice: a file that is over its size limit, binary, UTF-16, not valid UTF-8 or not there to open is an error and nothing in it is checked; this rule cannot be set lower or off.

What to change: export the data map as UTF-8 CSV or JSON.

### `unparsable-file`

A file that is not CSV or JSON the readers accept, or not a data map: a data map that the CSV or JSON reader refuses, or whose header or shape is not that of a data map.

Points:

- `csvRecords`: each record of a CSV file is on its own line, ended by CRLF, the first line may be a header, and a field that holds a comma, a double quote or a line break is put in double quotes, with a double quote inside it written twice (RFC 4180, Common Format and MIME Type for Comma-Separated Values (CSV) Files, https://www.rfc-editor.org/rfc/rfc4180)
- `jsonRepeatedNames`: when an object repeats a name the behavior of the software that reads it cannot be predicted, so the reader of this tool refuses a repeated name (RFC 8259, The JSON Data Interchange Format, https://www.rfc-editor.org/rfc/rfc8259)

The tool's own choice: a quoted CSV field that is not closed, a stray double quote, a header with no field column or a column named twice, JSON that does not parse or repeats a name, or JSON that is not a list of records stops the reading of the file, and nothing in it is checked; this rule cannot be set lower or off.

What to change: correct the file at the line and column named.

## Points that no rule rests on

- `csvInjection`: a spreadsheet may read a cell that starts with =, +, -, @, a tab or a line break as a formula, and no one escape is safe in every program that opens the file (CSV Injection (OWASP), https://community.owasp.org/attacks/CSV_Injection). Behind the formula guard of `--format csv`.
- `githubAnnotations`: a line of output such as ::warning file=...,line=...::message becomes an annotation on that file and line in the run (Workflow commands for GitHub Actions (GitHub Docs), https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands). Behind `--format github`.

## The pages

- Art. 4 GDPR, Definitions (gdpr-info.eu): https://gdpr-info.eu/art-4-gdpr/
- Art. 5 GDPR, Principles relating to processing of personal data (gdpr-info.eu): https://gdpr-info.eu/art-5-gdpr/
- Art. 6 GDPR, Lawfulness of processing (gdpr-info.eu): https://gdpr-info.eu/art-6-gdpr/
- Art. 7 GDPR, Conditions for consent (gdpr-info.eu): https://gdpr-info.eu/art-7-gdpr/
- Art. 9 GDPR, Processing of special categories of personal data (gdpr-info.eu): https://gdpr-info.eu/art-9-gdpr/
- Art. 10 GDPR, Processing of personal data relating to criminal convictions and offences (gdpr-info.eu): https://gdpr-info.eu/art-10-gdpr/
- Art. 28 GDPR, Processor (gdpr-info.eu): https://gdpr-info.eu/art-28-gdpr/
- Art. 30 GDPR, Records of processing activities (gdpr-info.eu): https://gdpr-info.eu/art-30-gdpr/
- Art. 44 GDPR, General principle for transfers (gdpr-info.eu): https://gdpr-info.eu/art-44-gdpr/
- Art. 45 GDPR, Transfers on the basis of an adequacy decision (gdpr-info.eu): https://gdpr-info.eu/art-45-gdpr/
- Art. 46 GDPR, Transfers subject to appropriate safeguards (gdpr-info.eu): https://gdpr-info.eu/art-46-gdpr/
- Art. 49 GDPR, Derogations for specific situations (gdpr-info.eu): https://gdpr-info.eu/art-49-gdpr/
- Data protection adequacy for non-EU countries (European Commission): https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en
- RFC 4180, Common Format and MIME Type for Comma-Separated Values (CSV) Files: https://www.rfc-editor.org/rfc/rfc4180
- RFC 8259, The JSON Data Interchange Format: https://www.rfc-editor.org/rfc/rfc8259
- CSV Injection (OWASP): https://community.owasp.org/attacks/CSV_Injection
- Workflow commands for GitHub Actions (GitHub Docs): https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands

# gdpr-data-map-check

GDPR compliance data map check for engineering teams. Give it your data map or record of processing activities (the
list of personal data fields your systems hold) as CSV or JSON, with the system, store, category, data subjects,
purpose, lawful basis, Article 9 condition, retention, processor, storage and recipient location, transfer safeguard
and owner of each field, and it reports the gaps a record of processing must not have: a field with no purpose or no
lawful basis of Article 6, special category data with no condition of Article 9, criminal offence data under Article
10, no retention or one with no end, data that leaves the EU/EEA with no safeguard, a processor with no agreement, a
field with no owner, and the same field listed twice. It sums up each system, lists every transfer out of the EU/EEA,
and exits with a code a pipeline can act on.

**This is an engineering aid, not legal advice.** It reads what the data map says and checks that each field names
what Article 30 and Chapter V ask a record to name, in a form it can read. It does not decide whether a lawful basis,
a condition or a safeguard fits the processing, and it does not replace your data protection officer or a lawyer.

A data map is usually a sheet that engineers, product owners and the privacy team all edit, and it drifts: a new field
is added without a purpose, a cloud region moves data to another continent, a vendor is swapped and nobody signs the
agreement, sick notes are filed as contact data. The regulation (Article 6 on lawful bases,
https://gdpr-info.eu/art-6-gdpr/, Article 9 on special categories, https://gdpr-info.eu/art-9-gdpr/, Article 30 on
records of processing, https://gdpr-info.eu/art-30-gdpr/, and Article 46 on transfer safeguards,
https://gdpr-info.eu/art-46-gdpr/) says what each entry needs. This tool reads the map on every change and says which
entries do not have it yet.

- **Records of processing.** Purpose, lawful basis, category, retention, location and owner for every field, with the
  six lawful bases of Article 6(1) read by name or by point (`Art. 6(1)(b)`).
- **Special data.** The eight special categories of Article 9(1), found by name, alias or as whole words in a longer
  category (`health records`), need an Article 9 condition; criminal offence data is flagged for Article 10.
- **Transfers.** Storage and recipient places outside the EU/EEA need a safeguard: an adequacy decision, SCCs, BCRs or
  another safeguard of Article 46, or a derogation of Article 49, which is reported as information. The EU/EEA
  countries and the adequacy decisions are kept as a documented data file.
- **Honest about input.** A file or a record it cannot read is an error finding with its line, never passed over; a
  place it does not know counts as outside the EU/EEA, with a near name suggested, never used.
  [docs/limits.md](docs/limits.md) says what a data map cannot show.
- Reports as text, JSON, a CSV problem list and GitHub workflow annotations, with an exit code for a pipeline: `0` no
  finding at or above the `--fail-on` level, `1` a finding at or above it, `2` usage or input error.
- Plain JavaScript, no dependencies and no network; the same data map always gives the same report.

```
npm test
```

```
tests 132
pass 129
fail 0
skipped 3
```

These are the summary lines that `npm test` prints at the end on Windows. The skipped tests are the ones that need a
symbolic link, a device or file permissions (a file, a folder and a configuration named through a symbolic link,
`/dev/zero` named as an input, and a file with no read access); they are guarded with `process.platform`, run on Linux
and macOS, and none of them asserts a line. `npm run test:coverage` runs the same tests with coverage; their time limits
are four times wider when coverage is on.

## Quick start

Requires Node 22 or newer. There is nothing to install.

```
git clone https://github.com/INNERLUXES/gdpr-data-map-check.git
cd gdpr-data-map-check
node bin/gdpr-data-map-check.js examples/messy/data-map.csv --config examples/config.json
```

Or without a clone, on your own data map:

```
npx --yes github:INNERLUXES/gdpr-data-map-check data-map.csv
```

`examples/` holds two made-up data maps: `examples/messy/data-map.csv`, an online shop with one problem of every kind
(sick notes with no Article 9 condition, a face photo kept forever, call notes with no purpose stored in a country
written as Germny, a call centre in India with no safeguard, a lawful basis of goodwill, the withdrawn Privacy Shield,
a United States transfer on an adequacy decision, a payment processor with no agreement listed twice, a background
check, an IP address with no category and no location, a gift address sent on a derogation, and a row that is too
short), and `examples/clean/data-map.json`, a public library whose map is ready for review. The messy map also holds
what must not be reported: SCCs to the United States, a basis written as `Art. 6(1)(b)`, a retention that says
permanently next to a period, union dues with their Article 9 condition, a UK transfer on an adequacy decision, sick
notes kept internally, a cloud region that `examples/config.json` names as Germany, and consent with its reference.
`examples/config.json` adds that location alias, asks for a consent reference and fails the run on warnings.

## Usage

```
gdpr-data-map-check <data map>... [--config <file>] [options]
```

```
--config <file>           settings in strict JSON: rules, lawfulBasisAliases, categoryAliases, locationAliases,
                          requireConsentReference, minSeverity and failOn (--print-defaults shows them)
--format <name>           text, json, csv or github (default: text); csv writes the problems, github writes
                          workflow commands that GitHub shows as annotations
--json                    the same as --format json
--min-severity <level>    the lowest level of a finding that is shown: info, warning, error (default: minSeverity of
                          the configuration, else info)
--fail-on <level>         the lowest level of a finding that fails the run: info, warning, error (default: failOn of
                          the configuration, else error)
--explain                 show the rule, the public sources and the tool's own choice behind each finding
--print-defaults          print the built-in configuration and exit
--help                    show the usage
--version                 show the version
```

The files are read in the order named and checked as one map, so a duplicate row is found across files. The path in
the report is relative to the folder you run the command in, with forward slashes on every system, followed by the
line.

The report of the messy example starts with what was read, the configuration, the rules, the map in one line, the
count of records per lawful basis and the count of findings; then a table per system; then the transfers out of the
EU/EEA with their places and safeguards; then the findings, errors first, each with what to change:

```
gdpr-data-map-check: examples/messy/data-map.csv
input: examples/messy/data-map.csv (1 file: 1 CSV data map; 18 records)
config: examples/config.json (Brindlewick data map): 13 lawful basis aliases, 27 category aliases, 1 location alias; consent reference required; minimum severity info; fail on warning
rules: missing-purpose (error); missing-lawful-basis (error); unknown-lawful-basis (error); missing-category (warning); special-category-without-condition (error); criminal-offence-data (warning); missing-retention (error); open-ended-retention (error); unclear-retention (warning); missing-location (warning); transfer-without-safeguard (error); unknown-safeguard (error); adequacy-unconfirmed (warning); derogation-transfer (info); consent-without-reference (warning); processor-without-agreement (warning); missing-owner (warning); duplicate-row (warning); invalid-record (error); unreadable-file (error); unparsable-file (error)
map: 17 records in 5 systems: 3 special category, 1 criminal offence, 7 transfers out of the EU/EEA, 10 with a processor or recipient
lawful bases: consent 2, contract 5, legal obligation 3, legitimate interests 5, none 1, unknown 1
findings: 19 (9 error, 9 warning, 1 info)

Systems (5)

  system     records  special  criminal  transfers  findings
  shop       7        0        0         3          7
  hr         4        3        1         1          3
  support    3        0        0         2          5
  analytics  2        0        0         1          3
  marketing  1        0        0         0          0

Transfers out of the EU/EEA (7)

  system     store      field              to         safeguard          at
  shop       customers  email              US         SCCs               examples/messy/data-map.csv:2
  shop       customers  marketing opt-in   US         adequacy decision  examples/messy/data-map.csv:5
  shop       customers  gift note address  Morocco    Art. 49(1)(b)      examples/messy/data-map.csv:8
  hr         staff      background check   UK (GB)    adequacy decision  examples/messy/data-map.csv:11
  support    tickets    call notes         Germny     -                  examples/messy/data-map.csv:13
  support    tickets    phone number       India      -                  examples/messy/data-map.csv:14
  analytics  events     device id          Singapore  Privacy Shield     examples/messy/data-map.csv:16

Findings (19)

  ERROR    missing-lawful-basis                examples/messy/data-map.csv:4
           the field "date of birth" of shop/customers has no lawful basis
           fix: name the lawful basis of Article 6(1) the processing rests on: consent, contract, legal obligation, vital interests, public task or legitimate interests

  ERROR    special-category-without-condition  examples/messy/data-map.csv:9
           the field "sick notes" of hr/staff is special category data (health) and names no condition of Article 9(2)
           fix: name the condition of Article 9(2) the processing rests on, such as explicit consent, employment law or health care, or stop collecting the field

  ERROR    open-ended-retention                examples/messy/data-map.csv:12
           the field "face photo" of hr/staff is kept "forever", with no end
           fix: set an end to the retention, or the event after which the data is erased, with a period

  ERROR    missing-purpose                     examples/messy/data-map.csv:13
           the field "call notes" of support/tickets has no purpose
           fix: write the specific purpose the field is collected and used for

  ERROR    transfer-without-safeguard          examples/messy/data-map.csv:13
           the field "call notes" of support/tickets goes to Germny (not a place the tool knows, so taken as outside the EU/EEA, did you mean "Germany"?), outside the EU/EEA, with no transfer safeguard
           fix: name the safeguard of the transfer: an adequacy decision, standard contractual clauses, binding corporate rules or another safeguard of Article 46, or keep the data in the EU/EEA

  ERROR    transfer-without-safeguard          examples/messy/data-map.csv:14
           the field "phone number" of support/tickets goes to India (not a place the tool knows, so taken as outside the EU/EEA), outside the EU/EEA, with no transfer safeguard
           fix: name the safeguard of the transfer: an adequacy decision, standard contractual clauses, binding corporate rules or another safeguard of Article 46, or keep the data in the EU/EEA

  ERROR    unknown-lawful-basis                examples/messy/data-map.csv:15
           the field "customer id" of support/tickets has the lawful basis "goodwill", which is not one of the six of Article 6(1) or a known alias
           fix: write one of the six lawful bases, or add the words your team uses to lawfulBasisAliases in the configuration

  ERROR    unknown-safeguard                   examples/messy/data-map.csv:16
           the field "device id" of analytics/events names the transfer safeguard "Privacy Shield", which is not an adequacy decision, a safeguard of Article 46 or a derogation of Article 49
           fix: write the safeguard as one the regulation names, such as SCCs, BCRs or adequacy decision

  ERROR    invalid-record                      examples/messy/data-map.csv:19
           this row has 3 fields and the header has 17; the row is not checked
           fix: correct the record at the line named

  WARNING  unclear-retention                   examples/messy/data-map.csv:4
           the field "date of birth" of shop/customers has the retention "until the account is closed", in which the tool finds no period (a number with days, weeks, months or years, or an ISO 8601 duration)
           fix: write the period as a number with a unit, such as 90 days or 2 years after the last order

  WARNING  adequacy-unconfirmed                examples/messy/data-map.csv:5
           the field "marketing opt-in" of shop/customers goes to US on an adequacy decision, which covers only organisations certified under the EU-US Data Privacy Framework; check that the recipient is covered
           fix: check the adequacy page of the European Commission and the scope of the decision; for the United States, check that the recipient is certified under the Data Privacy Framework, or use another safeguard

  WARNING  consent-without-reference           examples/messy/data-map.csv:5
           the field "marketing opt-in" of shop/customers rests on consent and names no consent mechanism or reference that shows how consent is recorded
           fix: name where consent is recorded and how it can be withdrawn, such as the consent banner, the form or the record that stores it

  WARNING  processor-without-agreement         examples/messy/data-map.csv:6
           the field "card token" of shop/orders goes to the processor or recipient "Paybridge", and no agreement is named
           fix: name the data processing agreement or other contract with the processor, or write internal when no one outside handles the data

  WARNING  duplicate-row                       examples/messy/data-map.csv:7
           the field "card token" of shop/orders is listed again with the same purpose; the first record is at examples/messy/data-map.csv:6
           fix: merge the two records into one, or write the purpose that tells them apart

  WARNING  criminal-offence-data               examples/messy/data-map.csv:11
           the field "background check" of hr/staff is data on criminal convictions and offences; Article 10 allows it only under official authority or a law that permits it, and the record names no such basis
           fix: check that the processing is under official authority or allowed by Union or Member State law, and name that law in the condition column

  WARNING  missing-owner                       examples/messy/data-map.csv:14
           the field "phone number" of support/tickets has no owner
           fix: name the person or team who answers for the field and keeps its entry up to date

  WARNING  missing-category                    examples/messy/data-map.csv:17
           the field "ip address" of analytics/events has no category, so the tool cannot tell whether it is special category data
           fix: write the category of the data, such as contact, identity, financial, location or health

  WARNING  missing-location                    examples/messy/data-map.csv:17
           the field "ip address" of analytics/events has no storage location, so the tool cannot tell whether it leaves the EU/EEA
           fix: write the country where the data is stored, as a name or a two-letter code

  INFO     derogation-transfer                 examples/messy/data-map.csv:8
           the field "gift note address" of shop/customers goes to Morocco on a derogation of Article 49, which is meant for a specific situation and not for a regular transfer
           fix: check that the transfer is occasional and fits one of the situations of Article 49(1), or put an adequacy decision or a safeguard of Article 46 in place

note: examples/messy/data-map.csv: 1 column the tool does not read was left out: "notes"

This check reads the data map as it is written. It is an engineering aid, not legal advice: it does not see the data itself, decide whether a lawful basis, an Article 9 condition or a transfer safeguard fits the processing, or replace a review by your data protection officer or a lawyer (docs/limits.md).

RESULT: FAIL - 18 findings at or above warning (9 error, 9 warning, 1 info)
```

With `--explain`, each finding also shows the rule, the points of the public pages it rests on and the tool's own
choice:

```
  ERROR    special-category-without-condition  examples/messy/data-map.csv:9
           the field "sick notes" of hr/staff is special category data (health) and names no condition of Article 9(2)
           fix: name the condition of Article 9(2) the processing rests on, such as explicit consent, employment law or health care, or stop collecting the field
           rule: a record whose category is one of the eight special categories of Article 9(1), or one of the 22 aliases for them, with an empty special category condition
           basis: processing data that reveals racial or ethnic origin, political opinions, religious or philosophical beliefs or trade union membership, and genetic, biometric, health and sex life or sexual orientation data, is prohibited unless a condition of Article 9(2) applies (Art. 9 GDPR, Processing of special categories of personal data (gdpr-info.eu), https://gdpr-info.eu/art-9-gdpr/)
           basis: the conditions of Article 9(2) include explicit consent, employment and social protection law, vital interests, data made public by the person, legal claims, substantial public interest, health care, public health and research (Art. 9 GDPR, Processing of special categories of personal data (gdpr-info.eu), https://gdpr-info.eu/art-9-gdpr/)
           basis: the regulation defines genetic data, biometric data that identifies a person through technical processing, and data concerning health, which includes information on health care that reveals the state of health (Art. 4 GDPR, Definitions (gdpr-info.eu), https://gdpr-info.eu/art-4-gdpr/)
           the tool's own choice: a category is special when its name, an alias, or the longest name or alias it holds as whole words is one of Article 9(1), so "health records" is health; an alias set to other marks a word as ordinary data; any text in the condition column counts as a condition, the tool cannot tell whether it applies
```

The clean example passes:

```
gdpr-data-map-check: examples/clean/data-map.json
input: examples/clean/data-map.json (1 file: 1 JSON data map; 5 records)
config: built-in defaults: 13 lawful basis aliases, 27 category aliases, 0 location aliases; consent reference not required; minimum severity info; fail on error
rules: missing-purpose (error); missing-lawful-basis (error); unknown-lawful-basis (error); missing-category (warning); special-category-without-condition (error); criminal-offence-data (warning); missing-retention (error); open-ended-retention (error); unclear-retention (warning); missing-location (warning); transfer-without-safeguard (error); unknown-safeguard (error); adequacy-unconfirmed (warning); derogation-transfer (info); consent-without-reference (warning); processor-without-agreement (warning); missing-owner (warning); duplicate-row (warning); invalid-record (error); unreadable-file (error); unparsable-file (error)
map: 5 records in 3 systems: 1 special category, 0 criminal offence, 2 transfers out of the EU/EEA, 2 with a processor or recipient
lawful bases: consent 1, public task 3, legitimate interests 1
findings: 0

Systems (3)

  system   records  special  criminal  transfers  findings
  loans    3        1        0         1          0
  events   1        0        0         1          0
  website  1        0        0         0          0

Transfers out of the EU/EEA (2)

  system  store     field         to                safeguard          at
  loans   members   email         Switzerland (CH)  adequacy decision  examples/clean/data-map.json:5
  events  bookings  phone number  US                SCCs               examples/clean/data-map.json:7

Findings (0)

  none

note: examples/clean/data-map.json: 1 key the tool does not read was left out: "library"

This check reads the data map as it is written. It is an engineering aid, not legal advice: it does not see the data itself, decide whether a lawful basis, an Article 9 condition or a transfer safeguard fits the processing, or replace a review by your data protection officer or a lawyer (docs/limits.md).

RESULT: PASS - no finding at or above error
```

## How a record is checked

1. Every value is trimmed, and an empty value, a dash or a blank word such as `none`, `n/a` or `tbd` counts as empty.
   The lawful basis, category, locations and safeguard may hold several values separated by semicolons.
2. The lawful bases are compared with the six of Article 6(1) and their aliases, in a form where `Art. 6(1)(f) GDPR`
   is `6 1 f`.
3. A category is special when it is one of the eight special categories of Article 9(1) or an alias, or holds one as
   whole words; then it needs an Article 9 condition. Criminal offence data is always flagged for Article 10.
4. A retention has a period when it holds a number with a unit of days, weeks, months or years, or an ISO 8601
   duration; with no period, a word such as `forever` makes it open-ended.
5. A record is a transfer when its storage or recipient location is outside the EU/EEA, a place the tool does not know
   included. A transfer needs a safeguard; an adequacy decision is checked against the list of decisions, and a
   derogation alone is reported as information.
6. A processor needs an agreement, every field needs an owner, and a field listed again with the same system, store
   and purpose is a duplicate.

[docs/method.md](docs/method.md) gives the details, and
[decision 2](docs/decisions/0002-treat-a-place-the-tool-does-not-know-as-outside-the-eu-eea.md) says why a place the
tool does not know counts as outside the EU/EEA.

## What it reports

| Rule | Key | Default level | Finds |
| --- | --- | --- | --- |
| `missing-purpose` | `rules.missingPurpose` | error | a field with no purpose |
| `missing-lawful-basis` | `rules.missingLawfulBasis` | error | a field with no lawful basis |
| `unknown-lawful-basis` | `rules.unknownLawfulBasis` | error | a lawful basis that is not one of the six of Article 6(1) or an alias |
| `missing-category` | `rules.missingCategory` | warning | a field with no category, so special data cannot be seen |
| `special-category-without-condition` | `rules.specialCategoryWithoutCondition` | error | special category data of Article 9(1) with no Article 9(2) condition |
| `criminal-offence-data` | `rules.criminalOffenceData` | warning | data on criminal convictions and offences, for Article 10 |
| `missing-retention` | `rules.missingRetention` | error | a field with no retention period |
| `open-ended-retention` | `rules.openEndedRetention` | error | a retention such as forever or indefinite, with no period |
| `unclear-retention` | `rules.unclearRetention` | warning | a retention with no period the tool can read |
| `missing-location` | `rules.missingLocation` | warning | a field with no storage location |
| `transfer-without-safeguard` | `rules.transferWithoutSafeguard` | error | storage or a recipient outside the EU/EEA with no transfer safeguard |
| `unknown-safeguard` | `rules.unknownSafeguard` | error | a safeguard that is not one of Articles 45, 46, 47 or 49 |
| `adequacy-unconfirmed` | `rules.adequacyUnconfirmed` | warning | an adequacy decision for a place not on the list, or one of limited scope |
| `derogation-transfer` | `rules.derogationTransfer` | info | a transfer whose only safeguard is a derogation of Article 49 |
| `consent-without-reference` | `rules.consentWithoutReference` | warning | consent with no consent mechanism or reference, when the configuration asks for one |
| `processor-without-agreement` | `rules.processorWithoutAgreement` | warning | a processor or recipient with no agreement named |
| `missing-owner` | `rules.missingOwner` | warning | a field with no owner |
| `duplicate-row` | `rules.duplicateRow` | warning | the same system, store, field and purpose listed again |
| `invalid-record` | none | error | a record with no field, the wrong number of fields or a value of the wrong kind |
| `unreadable-file` | none | error | a file that cannot be read as UTF-8 text |
| `unparsable-file` | none | error | a file the CSV or JSON reader refuses, or that is not a data map |

The three rules of input problems are always errors. [docs/method.md](docs/method.md) says exactly what each rule looks
at and what it cannot see, and [docs/rules-and-sources.md](docs/rules-and-sources.md) gives the points of the public
pages each rule rests on.

## Lawful bases, categories and transfers

The six lawful bases of Article 6(1), in its order:

| Basis | Point | Also read |
| --- | --- | --- |
| `consent` | 6(1)(a) | |
| `contract` | 6(1)(b) | performance of a contract, contractual necessity |
| `legal obligation` | 6(1)(c) | compliance with a legal obligation |
| `vital interests` | 6(1)(d) | vital interest |
| `public task` | 6(1)(e) | public interest, official authority |
| `legitimate interests` | 6(1)(f) | legitimate interest |

The special categories of Article 9(1) are racial or ethnic origin, political opinions, religious or philosophical
beliefs, trade union membership, genetic data, biometric data, health, and sex life or sexual orientation; criminal
convictions and offences fall under Article 10. Each has built-in aliases (`medical`, `biometrics`, `ethnicity`,
`criminal records` and others).

A place is inside the EU/EEA when it is one of the 27 member states, Iceland, Liechtenstein or Norway, by name or code,
or `EU` or `EEA`. The places with an adequacy decision of the European Commission are Andorra, Argentina, Brazil,
Canada (commercial organisations), the Faroe Islands, Guernsey, Israel, the Isle of Man, Japan, Jersey, New Zealand, the
Republic of Korea, Switzerland, the United Kingdom, the United States (organisations in the EU-US Data Privacy
Framework) and Uruguay. The list lives in `src/countries.js`; it changes when the Commission adopts or withdraws a
decision, so check the Commission's page. The safeguards read are adequacy decision, SCCs, BCRs, a legally binding
instrument, a code of conduct, certification, ad hoc clauses and derogations, by name or by article.

The `lawfulBasisAliases`, `categoryAliases` and `locationAliases` keys of the configuration add your team's own words,
cloud regions and data centres, or take a built-in alias away.

## What is not checked

The tool reads what the data map says and never guesses. It does not:

- decide whether a lawful basis, an Article 9 condition or a transfer safeguard fits the processing, or whether
  consent was freely given: that is legal advice, and the tool gives none;
- look at the data itself, scan databases or find fields the map does not list;
- check that a retention period is as short as the purpose needs, or that data is erased when it ends;
- check that an adequacy decision still holds or covers the recipient, or that SCCs are signed and backed by a
  transfer impact assessment;
- follow onward transfers to sub-processors, or read joint controllers, the data protection officer or security
  measures;
- read a spreadsheet file (`.xlsx`, `.ods`): export it as UTF-8 CSV.

So a clean run means the data map holds none of the problems the rules look for, and every report says so.

## The data map

```
system,store,field,category,data subjects,purpose,lawful basis,retention,processor,agreement,storage country,recipient country,transfer safeguard,owner
shop,customers,email,contact,customers,order confirmations,contract,6 years after the last order,Postmarkly,DPA-014,Ireland,US,SCCs,shop-team
hr,staff,union dues,trade union membership,employees,payroll deduction,legal obligation,6 years,,,DE,,,hr-team
```

A CSV file has a header line; a JSON file is a list of records, or an object with a `records` list. Only `field` is
required. Columns and keys are matched by name in any case and order, with spaces, hyphens and underscores ignored, so
`lawful basis`, `legal_basis` and `lawfulBasis` all name the lawful basis, and `storage country`, `region` and
`location` the storage location. Columns the tool does not read are named in a note.
[docs/inputs.md](docs/inputs.md) describes every field.

## The configuration file

```json
{
  "name": "Brindlewick data map",
  "locationAliases": { "eu-central-1": "DE" },
  "requireConsentReference": true,
  "failOn": "warning"
}
```

Every key is optional, and without `--config` the defaults apply. `rules` sets the level of each rule (`info`,
`warning`, `error` or `off`), `lawfulBasisAliases`, `categoryAliases` and `locationAliases` add other names or take a
built-in one away with `off`, `requireConsentReference` asks every field that rests on consent to name its consent
record, `minSeverity` sets the lowest level shown and `failOn` the lowest level that fails the run. A key the tool does
not know is an error with its line and a suggestion, and a key named twice is refused. [docs/inputs.md](docs/inputs.md)
describes every key, and `--print-defaults` writes the whole default configuration out.

## Formats

- `text`: for a terminal: what was read, the configuration, the rules, the map, a table per system, the transfers out
  of the EU/EEA, the findings with the file and line and what to change, the notes, the notice and the result. With
  `--explain` also the rule, the points of the public pages and the tool's own choice behind each finding.
- `json` (or `--json`): the whole report: the input, the configuration, the map with every system and transfer, the
  counts per lawful basis and category, every finding with its file, line, column, system, store and field, the totals,
  the result, the notes and the notice.
- `csv`: the problems, one record per finding, ready for a sheet or a ticket system: the level, the rule, the file,
  line and column, the system, store and field, what was found and what to change, with CRLF line ends as RFC 4180
  writes. A field that a spreadsheet could read as a formula gets a single quote in front. The start of the messy
  example:

```
level,rule,file,line,column,system,store,field,found,fix
error,missing-lawful-basis,examples/messy/data-map.csv,4,59,shop,customers,date of birth,"the field ""date of birth"" of shop/customers has no lawful basis","name the lawful basis of Article 6(1) the processing rests on: consent, contract, legal obligation, vital interests, public task or legitimate interests"
error,special-category-without-condition,examples/messy/data-map.csv,9,82,hr,staff,sick notes,"the field ""sick notes"" of hr/staff is special category data (health) and names no condition of Article 9(2)","name the condition of Article 9(2) the processing rests on, such as explicit consent, employment law or health care, or stop collecting the field"
error,open-ended-retention,examples/messy/data-map.csv,12,97,hr,staff,face photo,"the field ""face photo"" of hr/staff is kept ""forever"", with no end","set an end to the retention, or the event after which the data is erased, with a period"
```

- `github`: one workflow command per finding, `::error`, `::warning` or `::notice` (for info) with the file, line and
  column, which GitHub shows as an annotation in the pull request, then a summary line. The characters a command gives
  a meaning to are escaped. Two findings of the messy example:

```
::error file=examples/messy/data-map.csv,line=9,col=82,title=gdpr-data-map-check special-category-without-condition::the field "sick notes" of hr/staff is special category data (health) and names no condition of Article 9(2); fix: name the condition of Article 9(2) the processing rests on, such as explicit consent, employment law or health care, or stop collecting the field
::error file=examples/messy/data-map.csv,line=14,col=112,title=gdpr-data-map-check transfer-without-safeguard::the field "phone number" of support/tickets goes to India (not a place the tool knows, so taken as outside the EU/EEA), outside the EU/EEA, with no transfer safeguard; fix: name the safeguard of the transfer: an adequacy decision, standard contractual clauses, binding corporate rules or another safeguard of Article 46, or keep the data in the EU/EEA
```

## Exit codes

`0`: no finding at or above the fail-on level (`error` by default). `1`: at least one finding at or above it; with the
default, a missing purpose or lawful basis, an unknown lawful basis, special category data with no condition, a
missing or open-ended retention, a transfer with no safeguard or an unknown one, or a file or record the tool could not
read; with `--fail-on warning`, criminal offence data, unclear retention, unconfirmed adequacy, missing categories,
locations and owners, processors with no agreement, consent with no reference and duplicate rows too. `2`: a usage or
input error: no file, an unknown option, an option given twice, `--explain` with the csv or github format, a URL in
place of a path, a path that cannot be read, a symbolic link or a folder named on the command line, a file whose name
does not end in `.csv` or `.json`, input past the limit of a run, or a configuration with an unknown key, a key named
twice or a value of the wrong kind. With exit code `2` the tool gives no result and prints the problems on standard
error.

## Limits

The tool reads files; it does not look at the data, judge the law, or track time. A run reports what the data map
holds in the forms of docs/method.md. [docs/limits.md](docs/limits.md) lists what it cannot see, with the size limits:
32 MB for a file, 256 MB for a run, 200,000 records in a file, 500 findings listed per rule.
[docs/threat-model.md](docs/threat-model.md) lists the risks of reading a data map from a pull request and their
controls, and [docs/secure-defaults.md](docs/secure-defaults.md) the defaults and how to run the tool in a pipeline.

## Architecture

Plain ES modules in `src/`, with no dependencies.

| File | Job |
| --- | --- |
| `src/cli.js` | the command line, the usage and the exit codes |
| `src/check.js` | reads the configuration and the data maps, and builds the report of the run |
| `src/files.js`, `src/kinds.js` | the bounded reading of files with no link followed, and the kind of each file |
| `src/csv.js`, `src/json.js` | the CSV reader and the CSV problem list, and the strict JSON reader |
| `src/datamap.js` | the fields of a record from a CSV header or JSON keys, and the records that cannot be read |
| `src/terms.js` | lawful bases, categories, retention periods, safeguards and places read from the values |
| `src/countries.js` | the EU/EEA countries and the adequacy decisions, as a documented data file |
| `src/map.js` | the checks of every record, the summary per system and the transfers |
| `src/config.js`, `src/defaults.js` | the configuration file over the defaults |
| `src/rules.js` | the rules, their levels and the result |
| `src/report.js`, `src/text.js`, `src/size.js`, `src/words.js` | the text, JSON and GitHub output, the cleaning of text from the input, number formats and compared words |
| `src/data.js` | the public pages and the points the rules rest on, in this project's own words |
| `tools/check.mjs`, `tools/example.mjs` | the repository checks, and the examples with their real output |

## Where the facts come from

| Fact | Source |
| --- | --- |
| Personal data, processors, recipients, genetic, biometric and health data | GDPR Article 4, https://gdpr-info.eu/art-4-gdpr/ |
| Purpose limitation and storage limitation | GDPR Article 5, https://gdpr-info.eu/art-5-gdpr/ |
| The six lawful bases | GDPR Article 6, https://gdpr-info.eu/art-6-gdpr/ |
| Showing that consent was given | GDPR Article 7, https://gdpr-info.eu/art-7-gdpr/ |
| The special categories and the conditions of Article 9(2) | GDPR Article 9, https://gdpr-info.eu/art-9-gdpr/ |
| Criminal convictions and offences | GDPR Article 10, https://gdpr-info.eu/art-10-gdpr/ |
| The contract with a processor | GDPR Article 28, https://gdpr-info.eu/art-28-gdpr/ |
| What a record of processing activities holds | GDPR Article 30, https://gdpr-info.eu/art-30-gdpr/ |
| Transfers, adequacy decisions, safeguards and derogations | GDPR Articles 44, 45, 46 and 49, https://gdpr-info.eu/art-44-gdpr/, https://gdpr-info.eu/art-45-gdpr/, https://gdpr-info.eu/art-46-gdpr/, https://gdpr-info.eu/art-49-gdpr/ |
| The places with an adequacy decision and their scope | European Commission, https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en |
| The CSV format | RFC 4180, https://www.rfc-editor.org/rfc/rfc4180 |
| Repeated names in a JSON object, and UTF-8 | RFC 8259, https://www.rfc-editor.org/rfc/rfc8259 |
| Formulas hidden in CSV files | OWASP, https://community.owasp.org/attacks/CSV_Injection |
| Annotations from workflow commands | GitHub Docs, https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands |

[research/sources.md](research/sources.md) has a note on each page, in this project's own words.

## Background

Privacy by design starts with knowing what personal data each system holds and why. A data map that names a purpose,
a lawful basis, a retention period and a place for every field is what a record of processing activities is built
from, and what a data protection officer reviews; but it is edited by many hands and falls behind the code. A check
that reads it on every change, next to the code, finds the field added without a purpose or the transfer added without
a safeguard while they are still one line in a file. How GDPR is built into software from the start is described on
the page [GDPR-Compliant Software Development](https://innerluxes.dev/software-development/gdpr-compliance).

## License

MIT

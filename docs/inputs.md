# Inputs

## The data map

```
gdpr-data-map-check <data map>... [--config <file>] [options]
```

One or more files, up to 100, each a CSV data map (a name ending in `.csv`) or a JSON data map (a name ending in
`.json`), compared without regard to case. A data map lists one personal data field per record, as a record of
processing activities under Article 30 does, or as the inventory of fields behind one. The files are read in the order
they are named and checked together as one map: a duplicate row is found across files. Each file may be named once. A
folder is not walked; name the files.

```
gdpr-data-map-check data-map.csv
gdpr-data-map-check crm.csv hr.json --fail-on warning
gdpr-data-map-check ropa.csv --config gdpr-check.json --format github
```

### Fields

Every record has these fields. Only `field` is required; a field that is missing is empty.

| Field | Column or key names (any case; spaces, hyphens and underscores ignored) | Value |
| --- | --- | --- |
| `system` | `system`, `application`, `app` | the system or application that holds the field |
| `store` | `store`, `data store`, `database`, `table` | the database, table or store inside the system |
| `field` | `field`, `data field`, `data element`, `attribute`, `column` | the personal data field, such as email or date of birth |
| `category` | `category`, `categories`, `data category`, `personal data category` | the category of data, such as contact, identity, financial, location or health |
| `subjects` | `subjects`, `data subjects`, `data subject category` | the people the data is about, such as customers or employees |
| `purpose` | `purpose`, `purposes`, `processing purpose` | why the field is collected and used |
| `lawfulBasis` | `lawful basis`, `legal basis`, `basis`, `article 6 basis` | one or more of the six lawful bases of Article 6(1) |
| `specialCondition` | `special condition`, `special category condition`, `article 9 condition`, `condition` | the condition of Article 9(2) for special category data, or the law behind criminal offence data |
| `retention` | `retention`, `retention period`, `time limit`, `erasure` | how long the field is kept |
| `processor` | `processor`, `recipient`, `recipients` | the processor or recipient the field goes to, or `internal` |
| `agreement` | `agreement`, `agreement reference`, `dpa`, `data processing agreement` | the agreement with the processor |
| `location` | `location`, `storage location`, `country`, `storage country`, `region`, `storage region` | where the field is stored |
| `recipientLocation` | `recipient location`, `recipient country`, `processor country`, `processor location` | where the recipient or processor holds it |
| `safeguard` | `safeguard`, `transfer safeguard`, `transfer mechanism` | the safeguard of a transfer out of the EU/EEA |
| `consentReference` | `consent reference`, `consent mechanism`, `consent record` | where consent is recorded, for a field that rests on consent |
| `owner` | `owner`, `data owner` | the person or team who answers for the field |

Every value is trimmed of white space at both ends. The lawful bases, categories, locations and safeguards may each
hold several values separated by semicolons (`contract; legal obligation`). A column or key that is none of these is
left out and named in a note.

A value that is empty, a dash, a question mark, or one of the words `none`, `n/a`, `na`, `nil`, `tbd`, `tbc`, `todo`,
`to do`, `unknown`, `not known` and `not set` (in any case) counts as empty.

### CSV

A header line names the columns, in any order, and every later line is a record. The file is read as RFC 4180
describes it, with LF, CRLF or a lone CR as line ends and a byte order mark skipped. A field that holds a comma, a
double quote or a line break is put in double quotes, with a double quote inside it written twice.

```
system,store,field,category,data subjects,purpose,lawful basis,retention,processor,agreement,storage country,recipient country,transfer safeguard,owner
shop,customers,email,contact,customers,order confirmations,contract,6 years after the last order,Postmarkly,DPA-014,Ireland,US,SCCs,shop-team
hr,staff,union dues,trade union membership,employees,payroll deduction,legal obligation,6 years,,,DE,,,hr-team
```

A line with no text in any field is skipped. A line with a different number of fields than the header, or with no
field, is an `invalid-record` finding and is not checked. A file with no header, a header with no field column or with
two columns for one field, or a quote that breaks the format is an `unparsable-file` finding.

### JSON

A list of record objects, or an object whose `records` key holds that list; other keys of that object are left out and
named in a note. The file is read strictly as RFC 8259 writes JSON: no comments, no trailing comma, and no name given
twice in one object.

```json
{
  "records": [
    { "system": "loans", "field": "email", "category": "contact", "purpose": "due date reminders",
      "lawfulBasis": "public task", "retention": "2 years", "location": "NL", "recipientLocation": "Switzerland",
      "safeguard": "adequacy decision", "owner": "lending-team" }
  ]
}
```

A value is a text; a whole number is read as its text, and a list of texts is read as the texts joined by semicolons,
so `"location": ["DE", "FR"]` is `DE; FR`. A value of another kind is an `invalid-record` finding and is taken as
empty; a record that is not an object, has no field, or names one field with two keys is an `invalid-record` finding
and is not checked.

### Lawful bases

A lawful basis is compared in its legal form: the letters A to Z lowered, every other character made a space, and a
leading `article`, `art` or `gdpr` and a trailing `gdpr` left out. The six names are `consent`, `contract`,
`legal obligation`, `vital interests`, `public task` and `legitimate interests`. The built-in aliases:

| Alias | Basis |
| --- | --- |
| 6(1)(a) | consent |
| 6(1)(b), performance of a contract, contractual necessity | contract |
| 6(1)(c), compliance with a legal obligation | legal obligation |
| 6(1)(d), vital interest | vital interests |
| 6(1)(e), public interest, official authority | public task |
| 6(1)(f), legitimate interest | legitimate interests |

### Categories

A category is compared in its term form: the letters A to Z lowered and every other character made a space. A
category is special category data when it is one of the eight names of Article 9(1) (`racial or ethnic origin`,
`political opinions`, `religious or philosophical beliefs`, `trade union membership`, `genetic data`, `biometric
data`, `health`, `sex life or sexual orientation`) or an alias, and criminal offence data when it is
`criminal convictions and offences` or an alias. A category that is not a name or an alias as a whole is read by the
longest name or alias it holds as whole words, so `health records` is health and `healthy snacks` is not. Any other
category is ordinary personal data. The built-in aliases are race, racial, racial origin, ethnic, ethnicity, ethnic
origin, political, political opinion, religion, religious, religious beliefs, philosophical beliefs, trade union,
genetic, biometric, biometrics, health data, data concerning health, medical, sex life, sexual orientation, sex life
or orientation, criminal, criminal offences, criminal offence, criminal convictions and criminal records;
`--print-defaults` shows each with its category.

### Places

A storage or recipient location is compared in its term form with the places of `src/countries.js`, a documented data
file:

- the 27 member states of the European Union and Iceland, Liechtenstein and Norway, by name or two-letter code, and
  `EU`, `EEA`, `European Union` and `European Economic Area`: inside the EU/EEA;
- the places with an adequacy decision of the European Commission: Andorra, Argentina, Brazil, Canada (commercial
  organisations only), the Faroe Islands, Guernsey, Israel, the Isle of Man, Japan, Jersey, New Zealand, the Republic
  of Korea, Switzerland, the United Kingdom, the United States (only organisations certified under the EU-US Data
  Privacy Framework) and Uruguay, by name or two-letter code;
- the other names `el` (Greece), `czech republic`, `the netherlands`, `uk`, `great britain`, `korea`, `south korea`,
  `usa` and `united states of america`.

Any other place is a third country with no adequacy decision the tool knows of. A place the tool does not know at all,
a typo included, is also read as outside the EU/EEA, and the finding says so with a near name when there is one
([decision 2](decisions/0002-treat-a-place-the-tool-does-not-know-as-outside-the-eu-eea.md)). The list of adequacy
decisions changes; check the Commission's page before you rely on it, and name a cloud region or a data centre with
`locationAliases`.

### Retention

A retention has a period when it holds a whole number of up to four digits with a unit (`d`, `day`, `days`, `w`,
`wk`, `wks`, `week`, `weeks`, `m`, `mo`, `mos`, `month`, `months`, `y`, `yr`, `yrs`, `year`, `years`), or an ISO 8601
duration such as `P6M` or `P1Y6M`, anywhere in the text: `6 years after the last order`, `30d` and `P2Y` all have one.
A retention with no period that holds a word such as `forever`, `never`, `indefinite`, `indefinitely`, `permanent`,
`permanently`, `perpetual`, `unlimited`, `no limit`, `until further notice` or `never deleted` is open-ended. Anything
else, such as `until the account is closed` or `six years`, cannot be read.

### Safeguards

A safeguard is compared in its legal form, like a lawful basis:

| Kind | Names |
| --- | --- |
| adequacy decision (Article 45) | adequacy, adequacy decision, adequate, 45, data privacy framework, eu us data privacy framework, dpf |
| standard data protection clauses (Article 46(2)(c), (d)) | scc, sccs, eu scc, eu sccs, standard contractual clauses, standard data protection clauses, 46(2)(c), 46(2)(d) |
| binding corporate rules (Article 46(2)(b), Article 47) | bcr, bcrs, binding corporate rules, 47, 46(2)(b) |
| legally binding instrument (Article 46(2)(a)) | legally binding instrument, 46(2)(a) |
| code of conduct (Article 46(2)(e)) | code of conduct, approved code of conduct, 46(2)(e) |
| certification (Article 46(2)(f)) | certification, approved certification, 46(2)(f) |
| clauses or arrangements authorised under Article 46(3) | ad hoc clauses, ad hoc contractual clauses, contractual clauses, administrative arrangement(s), 46(3)(a), 46(3)(b) |
| derogation (Article 49) | derogation, derogations, 49, and any point of Article 49 such as 49(1)(a) |

## Options

| Option | Value |
| --- | --- |
| `--config <file>` | the configuration file below; without it the defaults apply |
| `--format <name>` | `text` (the default), `json`, `csv` or `github` |
| `--json` | the same as `--format json` |
| `--min-severity <level>` | `info`, `warning` or `error`: the lowest level of a finding that is shown; it wins over `minSeverity` of the configuration |
| `--fail-on <level>` | `info`, `warning` or `error`: the lowest level of a finding that fails the run; it wins over `failOn` of the configuration |
| `--explain` | each finding also shows its rule, the points of the public pages it rests on and the tool's own choice; with `--format csv` or `--format github` it is a usage error |
| `--print-defaults` | prints the built-in configuration as a configuration file and exits |
| `--help`, `--version` | the usage, the version |

A path that looks like a web address, an option given twice, `-` for standard input and an unknown option are usage
errors with exit code `2`.

## The configuration file

The configuration is one JSON object, read strictly as RFC 8259 writes JSON: no comments, no trailing comma, and no
name given twice in one object. Every key is optional. A key the tool does not know is an error with its line and, when
it is close to a known key, a suggestion; a run never goes on with a typo left in place.

```json
{
  "name": "Brindlewick data map",
  "rules": { "missingOwner": "error", "derogationTransfer": "warning" },
  "lawfulBasisAliases": { "statutory duty": "legal obligation" },
  "categoryAliases": { "wellbeing": "health", "health insurance number": "other" },
  "locationAliases": { "eu-central-1": "DE" },
  "requireConsentReference": true,
  "minSeverity": "info",
  "failOn": "warning"
}
```

### `name`

A name for the configuration, 1 to 120 characters, shown in the report next to the file.

### `rules`

The level of each rule: `info`, `warning`, `error` or `off`. A rule set to `off` is not reported, and the report names
it in a note. The keys and their defaults:

| Key | Rule | Default |
| --- | --- | --- |
| `rules.missingPurpose` | `missing-purpose` | error |
| `rules.missingLawfulBasis` | `missing-lawful-basis` | error |
| `rules.unknownLawfulBasis` | `unknown-lawful-basis` | error |
| `rules.missingCategory` | `missing-category` | warning |
| `rules.specialCategoryWithoutCondition` | `special-category-without-condition` | error |
| `rules.criminalOffenceData` | `criminal-offence-data` | warning |
| `rules.missingRetention` | `missing-retention` | error |
| `rules.openEndedRetention` | `open-ended-retention` | error |
| `rules.unclearRetention` | `unclear-retention` | warning |
| `rules.missingLocation` | `missing-location` | warning |
| `rules.transferWithoutSafeguard` | `transfer-without-safeguard` | error |
| `rules.unknownSafeguard` | `unknown-safeguard` | error |
| `rules.adequacyUnconfirmed` | `adequacy-unconfirmed` | warning |
| `rules.derogationTransfer` | `derogation-transfer` | info |
| `rules.consentWithoutReference` | `consent-without-reference` | warning |
| `rules.processorWithoutAgreement` | `processor-without-agreement` | warning |
| `rules.missingOwner` | `missing-owner` | warning |
| `rules.duplicateRow` | `duplicate-row` | warning |

`invalid-record`, `unreadable-file` and `unparsable-file` are always errors and have no key.

### `lawfulBasisAliases`

An object of other names for the lawful bases. Each name is compared in its legal form; its value is one of the six
bases, which adds the name or changes what it means, or `off`, which takes a built-in alias away. A name that is one of
the six bases, a name given twice once compared, and `off` for a name that is not a built-in alias are errors. At most
500 names of up to 100 characters.

### `categoryAliases`

An object of other names for the categories, compared in their term form. Its value is one of the nine category names
above, `other`, which marks the name as ordinary personal data even when it holds a special word (`health insurance
number`), or `off`, which takes a built-in alias away. The same errors and limits as `lawfulBasisAliases` apply.

### `locationAliases`

An object of other names for places, such as cloud regions or data centres, compared in their term form. Its value is a
two-letter code in capitals, `EU` or `EEA`. A code of a country of the EU/EEA puts the place inside it, a code with an
adequacy decision gives the place that decision, and any other code makes it a third country. A name the tool already
knows (a country, a code or a built-in name) cannot be an alias. The same limits apply.

### `requireConsentReference`

`true` or `false` (the default). With `true`, a record with consent among its lawful bases and an empty consent
reference is a `consent-without-reference` finding.

### `minSeverity`

The lowest level of a finding that is shown: `info` (the default), `warning` or `error`. The findings below it are
counted in a note and do not fail the run.

### `failOn`

The lowest level of a finding that fails the run: `info`, `warning` or `error` (the default).

`--print-defaults` writes the whole default configuration; read back, it gives the defaults.

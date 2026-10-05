# Method

This document says exactly what the tool reads, how it reads each value, what each rule looks at and cannot see, and
how the report is built. The names used here are the defaults; docs/inputs.md says how the configuration changes them.
The tool is an engineering aid, not legal advice: it checks that a data map holds what a record of processing needs in
a form it can read, and never decides whether the processing is lawful.

## What is read

The input is one or more data map files and, if given, a configuration file. Each file named on the command line is
read once, in the order named; a folder is not walked. A name ending in `.csv` is read as CSV and a name ending in
`.json` as JSON. Each file is read as UTF-8, with or without a byte order mark, with LF, CR LF or CR line ends.

A CSV file starts with a header line. Its columns are matched to the fields by name, in any order, with the letters A
to Z lowered and spaces, hyphens and underscores taken out, so `Lawful Basis`, `lawful_basis` and `lawfulBasis` are
the same column. A JSON file is a list of records, or an object with a `records` list; the keys of a record are matched
the same way. Columns and keys the tool does not read are named in a note. Every value is trimmed of white space at
both ends. docs/inputs.md lists the fields.

All the files of a run make one map, in the order of the files and of the records in each.

## How a record is read

1. **Blank values.** A value that is empty, a dash, a question mark or a blank word such as `none`, `n/a` or `tbd`
   counts as empty (docs/inputs.md lists the words).
2. **Lists.** The lawful basis, the category, the locations and the safeguard may each hold several values separated
   by a semicolon; each value is read on its own, and a value named twice counts once.
3. **The lawful bases.** Each value is compared in its legal form (the letters A to Z lowered, other characters made
   spaces, a leading `article`, `art` or `gdpr` and a trailing `gdpr` left out) with the six names of Article 6(1) and
   the aliases.
4. **The categories.** Each value is compared in its term form with the eight special categories of Article 9(1), the
   criminal offence data of Article 10 and the aliases; a value that is none of them as a whole takes the longest name
   or alias it holds as whole words, and a value with none is ordinary personal data. An alias set to `other` marks a
   value as ordinary.
5. **The retention.** A period is a whole number of up to four digits with a unit of days, weeks, months or years, or
   an ISO 8601 duration, anywhere in the text. With no period, a word such as `forever` or `indefinite` makes the
   retention open-ended; anything else cannot be read.
6. **The places.** Each storage and recipient location is compared in its term form with the places of
   src/countries.js and the aliases of the configuration: inside the EU/EEA, a place with an adequacy decision (with
   the limit of its scope for Canada and the United States), or a third country. A place the tool does not know is a
   third country.
7. **The safeguards.** Each value is compared in its legal form with the names of the safeguards of Articles 45, 46,
   47 and 49 (docs/inputs.md); a point of Article 49, such as `49(1)(a)`, is a derogation.

The same data map and configuration always give the same report: no clock, no random number, no locale, and no order
taken from a hash.

## How a record is checked

Each record is checked on its own, in the order of the files and of the records in each. A record is a transfer when
its storage location or its recipient location names a place outside the EU/EEA. A processor is any value of the
processor column that is not empty, a blank word, `internal`, `in house`, `self` or `own staff`.

## Rules

Each finding has a rule, a level, the file, the line and column of the field it is about (or of the record when the
file has no such column), the system, store and field of the record, what was found and what to change. `--explain`
adds the rule, the points of the public pages it rests on, and the tool's own choice. docs/rules-and-sources.md lists
the points.

### `missing-purpose`

A record whose purpose is empty or a blank word, or a data map with no purpose column. Any other text is a purpose; the
tool cannot tell whether it is specific, explicit or legitimate. One finding per record, at the purpose.

### `missing-lawful-basis`

A record whose lawful basis is empty or a blank word, or a data map with no lawful basis column. One finding per
record, at the lawful basis.

### `unknown-lawful-basis`

A record with a lawful basis value that is none of the six of Article 6(1) and none of the aliases once compared. One
finding per record, listing every unknown value; the known values of the same record count as its bases. The tool
checks the name of a basis, never whether it fits the processing.

### `missing-category`

A record whose category is empty or a blank word, or a data map with no category column. A warning: without a category
the tool cannot tell whether the field is special category or criminal offence data, so those rules cannot look at it.

### `special-category-without-condition`

A record with a category that reads as one of the eight special categories of Article 9(1) and a special category
condition that is empty or a blank word. One finding per record, at the condition, naming the special categories found.
Any text in the condition counts; the tool does not check that it names a point of Article 9(2), or that the condition
applies.

### `criminal-offence-data`

A record with a category that reads as criminal convictions and offences. A warning for every such record, with or
without a condition, at the category: Article 10 allows the processing only under official authority or a law that
permits it, which a data map cannot show. The finding shows the condition when it is filled.

### `missing-retention`

A record whose retention is empty or a blank word, or a data map with no retention column. One finding per record, at
the retention.

### `open-ended-retention`

A record whose retention names no period and holds a word for an open end, such as `forever`, `never`, `indefinite`,
`permanent`, `unlimited` or `until further notice`. A retention that also names a period, such as `deleted permanently
after 30 days`, has an end and is not reported.

### `unclear-retention`

A record whose retention names no period the tool can read and no word for an open end: an event alone (`until the
account is closed`), a number written in words (`six years`), or any other text. A warning, because the period may
still be in the text; write it as a number with a unit.

### `missing-location`

A record whose storage location is empty or a blank word, or a data map with no location column. A warning: without
it the tool cannot tell whether the field leaves the EU/EEA. A recipient location alone does not fill it.

### `transfer-without-safeguard`

A record that is a transfer and whose safeguard is empty or a blank word. One finding per record, at the safeguard,
listing every place outside the EU/EEA of its storage and recipient locations; a place the tool does not know is named
as such, with a near name of a known place when there is one (`Germny`, did you mean `Germany`). Suggestions are made
for the first 100 unknown places of a run; the rest are counted in a note.

### `unknown-safeguard`

A record that is a transfer and whose safeguard holds a value that is not one of the names of docs/inputs.md, such as
`Privacy Shield`, a framework the Court of Justice of the EU struck down, or `46` alone, which names no one safeguard.
One finding per record, listing every unknown value. A safeguard of a record that is not a transfer is not looked at.

### `adequacy-unconfirmed`

A record that is a transfer on an adequacy decision, when the adequacy decision is the only safeguard named besides a
derogation. One finding per place outside the EU/EEA: a place that is not on the list of adequacy decisions of
src/countries.js, and a place whose decision has a limited scope (Canada for commercial organisations, the United
States for organisations certified under the EU-US Data Privacy Framework). A warning, because the list changes and the
tool cannot see whether a recipient is covered.

### `derogation-transfer`

A record that is a transfer whose only safeguards are derogations of Article 49. Info by default: a derogation can be
right for an occasional transfer, but a field in a data map is usually transferred again and again.

### `consent-without-reference`

Only with `requireConsentReference` set to `true`: a record with consent among its lawful bases and a consent reference
that is empty or a blank word. The tool checks that a mechanism or reference is named, not that consent was given or
can be withdrawn.

### `processor-without-agreement`

A record that names a processor or recipient (anything but the words above that say there is none) and an agreement
that is empty or a blank word. The tool cannot tell a processor from another recipient, so it asks for an agreement for
both.

### `missing-owner`

A record whose owner is empty or a blank word, or a data map with no owner column. Any text is an owner. An owner per
field is the tool's own choice: Article 30 asks the record to name the controller, and a field with no owner inside the
organisation has no one to keep its entry right.

### `duplicate-row`

A record whose system, store, field and purpose, compared in their term form, an earlier record already has, in the
order of the files and of the records in each. One finding per later record, at its field, naming the place of the
first. The later record is still checked, so a second row with another retention or location cannot hide a problem.

### `invalid-record`

A record of the data map that cannot be read: a CSV row with a different number of fields than the header, a row or
record with no field, a JSON record that is not an object or that names one field with two keys. The record is not
checked. A JSON value of the wrong kind (an object, a boolean, a number that is not whole, a list that holds something
other than texts) is also reported and is taken as empty. Always an error.

### `unreadable-file`

A file that cannot be read as UTF-8 text: over its size limit, holding a null byte, UTF-16, not valid UTF-8, or not
there to open when it is read. Nothing in it is checked. Always an error.

### `unparsable-file`

A file that the readers refuse: a CSV file that is empty, has a quoted field that is not closed, a character after a
closing quote or a double quote inside an unquoted field, a header with no field column or two columns for one field; a
JSON file that does not parse, repeats a name in an object, or is not a list of records or an object with a `records`
list. Nothing in it is checked. Always an error, with the line and column.

## Input problems

A path named on the command line that is missing, a symbolic link, a folder, a device or a pipe, a file whose name does
not end in `.csv` or `.json`, a file named twice, a configuration with a problem, and input past the limit of a run
(256 MB) stop the run with exit code `2` and no result. The problems are listed on standard error, the first twenty and
then a count.

## The report

The text report shows what was read, the configuration, the rules with their levels, the map in one line (records,
systems, special category and criminal offence data, transfers and processors), the count of records per lawful basis,
and the count of findings; then the systems, each with its records, special category and criminal offence data,
transfers and findings shown; then the transfers out of the EU/EEA with their places and safeguards; then the findings,
errors first, then by file, line, column and rule; then the notes, the notice and the result. The JSON report holds the
same data. The CSV report is the problem list, one record per finding. The GitHub report is one workflow command per
finding.

The result counts every finding at or above the minimum severity, also the ones past the limit of 500 listed per rule.
The findings of a system count every finding shown for its records.

# Limits

The tool reads a GDPR data map as it is written: CSV or JSON files that list personal data fields with their purpose,
lawful basis, category, retention, places and safeguards. It is an engineering aid, not legal advice. It does not look
at the systems, the databases or the data itself, connect to a server, a cloud account or a data catalogue, or ask
anyone anything. A finding points at something in a file; a run without findings says only that the data map holds
none of the problems of docs/method.md. Every report ends with a sentence that says so.

## What it cannot see

- **Whether the processing is lawful.** The tool checks that a lawful basis is one of the six of Article 6(1), that
  special category data names a condition of Article 9(2) and that a transfer names a safeguard. It does not judge
  whether the basis, the condition or the safeguard fits the processing, whether a legitimate interest outweighs the
  rights of the people concerned, or whether consent was freely given. That needs your data protection officer or a
  lawyer.
- **The data itself.** A field that holds health data but is written with the category contact is ordinary data to the
  tool. The tool does not scan databases, logs or documents to find personal data the map does not list, so a field
  missing from the map is not seen.
- **Whether a purpose is specific.** Any text is a purpose and any text is an owner.
- **Whether a retention is right.** The tool reads that a period is there, not that it is as short as the purpose
  needs, or that the data is in fact erased when it ends. A period written in words or tied only to an event is
  reported as one it cannot read.
- **Whether an adequacy decision still holds or covers the recipient.** src/countries.js is a copy of the Commission's
  list of adequacy decisions. The list changes when a decision is adopted or withdrawn; check the Commission's page.
  For Canada and the United States the decision covers only some organisations, and the tool cannot see whether the
  recipient is one of them.
- **Whether a safeguard is in place.** Writing SCCs in the map does not sign them, and the tool does not read a
  transfer impact assessment or the supplementary measures a transfer may need.
- **Onward transfers.** Only the storage location and one recipient location per record are read; a processor's own
  sub-processors and their places are not.
- **Places it does not know.** A place that is not on the list, a typo or a cloud region included, is read as outside
  the EU/EEA ([decision 2](decisions/0002-treat-a-place-the-tool-does-not-know-as-outside-the-eu-eea.md)); name it with
  `locationAliases`.
- **Joint controllers, the data protection officer and security measures.** Article 30 asks for them; the tool does not
  read them.
- **Fields that differ in case or by a typo.** Duplicate rows are compared in their term form, so `Email` and `email`
  are the same field, but `e-mail` and `email` are two. Lawful bases, categories and safeguards are read by name, never
  matched to a near one.
- **Spreadsheet files.** A sheet saved as `.xlsx` or `.ods` is not read; export it as UTF-8 CSV. A CSV file in another
  encoding, or saved as UTF-16, is an `unreadable-file` finding. The separator is always the comma.
- **Dates.** The tool reads no clock and compares no retention period with today
  ([decision 1](decisions/0001-read-no-clock-and-keep-dates-out-of-the-repository.md)).

## The readers

- The CSV reader follows RFC 4180, accepts LF and a lone CR as line ends too, keeps white space inside a field (the
  data map reader trims it afterwards), and refuses a quoted field that is not closed, a character after a closing
  quote, and a double quote inside an unquoted field. It reads no other separator, no comment lines and no escapes with
  a backslash.
- The JSON reader follows RFC 8259 and refuses comments, trailing commas, single quotes and a name given twice in one
  object.

## Size limits

Past a limit, the input is refused with exit code `2` and no result, the file is an error finding, or, where the limit
is on the work and not the input, the report says so in a note.

| What | Limit |
| --- | --- |
| a data map file | 32 MB; a larger file is an `unreadable-file` finding |
| all the files of a run | 256 MB |
| files on the command line | 100 |
| records in a file | 200,000; more is an `unparsable-file` finding |
| a CSV field or a JSON string | 65,536 characters |
| CSV fields in a record | 1,000 |
| JSON values in a file | 5,000,000, nested 32 deep |
| configuration file | 1 MB; nesting 32 deep; 500 aliases of each kind of up to 100 characters |
| suggestions of a near place | the first 100 unknown places of a run |
| findings of one rule | 500 listed; the rest are counted in a note and still count for the result |
| problems of the input | 20 listed; the rest are counted |

The tests check a hundred thousand records with every check to run, three thousand places the tool does not know,
values of sixty thousand characters for every pattern, and runs of hundreds of thousands of quotes, commas, line breaks
and brackets, each with a time check.

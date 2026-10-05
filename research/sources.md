# Sources

The public pages the checks of this tool are based on, each with a short note in this project's own words on what the
page says and which parts of the tool lean on it. Nothing here is a copy of a page: read the page itself for its exact
wording. src/data.js holds the pages and the points the reports show, and test/data.test.js checks that every page
there is listed here. Each page was fetched and read before it was listed.

The tool is an engineering aid, not legal advice. These notes say what the pages say so a reader can follow a finding
back to its source; they are not an interpretation of the law for any one organisation.

## The regulation

The articles of the General Data Protection Regulation are read on gdpr-info.eu, which shows the text of the
regulation one article per page, with the recitals that belong to it.

### Art. 4 GDPR, Definitions (gdpr-info.eu)

https://gdpr-info.eu/art-4-gdpr/

The definitions. Personal data is any information about an identified or identifiable natural person, such as a name,
an identification number, location data or an online identifier; processing is any operation on personal data, from
collection and storage to disclosure and erasure. A controller decides the purposes and means of processing, a
processor processes on the controller's behalf, and a recipient is anyone to whom data are disclosed. Genetic data,
biometric data that identifies a person through technical processing, and data concerning health each have their own
definition. `missing-category` leans on the first, `special-category-without-condition` on the definitions of the
special data, and `processor-without-agreement` on the processor and the recipient.

### Art. 5 GDPR, Principles relating to processing of personal data (gdpr-info.eu)

https://gdpr-info.eu/art-5-gdpr/

The principles. Purpose limitation says personal data are collected for specified, explicit and legitimate purposes
and not processed further in a way that does not fit them. Storage limitation says personal data are kept in a form
that identifies people for no longer than the purposes need, with room for archiving, research and statistics under
safeguards. `missing-purpose` leans on the first; `missing-retention` and `open-ended-retention` on the second.

### Art. 6 GDPR, Lawfulness of processing (gdpr-info.eu)

https://gdpr-info.eu/art-6-gdpr/

Processing is lawful only when at least one of six grounds of Article 6(1) applies: consent (a), a contract with the
person or steps before one (b), a legal obligation of the controller (c), the vital interests of the person or of
someone else (d), a task in the public interest or in the exercise of official authority (e), and the legitimate
interests of the controller or a third party, unless the interests and rights of the person override them (f). The tool
takes its six names and its built-in aliases from this list; `missing-lawful-basis` and `unknown-lawful-basis` rest on
it.

### Art. 7 GDPR, Conditions for consent (gdpr-info.eu)

https://gdpr-info.eu/art-7-gdpr/

Where processing rests on consent, the controller must be able to show that the person consented, and the person may
withdraw consent at any time, as easily as it was given. `consent-without-reference` leans on it: a data map that names
where consent is recorded makes that showing possible.

### Art. 9 GDPR, Processing of special categories of personal data (gdpr-info.eu)

https://gdpr-info.eu/art-9-gdpr/

Article 9(1) prohibits processing data that reveals racial or ethnic origin, political opinions, religious or
philosophical beliefs or trade union membership, and processing genetic data, biometric data to identify a person,
data concerning health and data on sex life or sexual orientation. Article 9(2) lists the conditions under which the
prohibition does not apply: explicit consent, obligations of employment and social protection law, vital interests
when consent cannot be given, the members of a non-profit body, data the person made public, legal claims, substantial
public interest, health and social care, public health, and archiving, research and statistics. The tool takes its
eight special categories from Article 9(1); `special-category-without-condition` asks for one of the conditions of
Article 9(2) and does not judge which one fits.

### Art. 10 GDPR, Processing of personal data relating to criminal convictions and offences (gdpr-info.eu)

https://gdpr-info.eu/art-10-gdpr/

Data on criminal convictions and offences may be processed only under the control of official authority or when Union
or Member State law allows it with safeguards for the people concerned, and a full register of criminal convictions is
kept only under official authority. `criminal-offence-data` leans on it and is a warning, because whether such a law
applies cannot be read from a data map.

### Art. 28 GDPR, Processor (gdpr-info.eu)

https://gdpr-info.eu/art-28-gdpr/

Processing by a processor is governed by a contract or another legal act that sets out the subject and duration of the
processing, its nature and purpose, the kinds of personal data and of people concerned, and the duties and rights of
the controller, and that binds the processor to a list of obligations, from acting only on documented instructions to
deleting or returning the data at the end. `processor-without-agreement` asks the data map to name that agreement.

### Art. 30 GDPR, Records of processing activities (gdpr-info.eu)

https://gdpr-info.eu/art-30-gdpr/

The record of processing activities a controller keeps: the name and contact details of the controller and of the
data protection officer, the purposes of the processing, the categories of data subjects and of personal data, the
categories of recipients, the transfers to third countries with their safeguards, where possible the time limits for
erasure, and where possible a description of the security measures. A processor keeps a record of its own. The columns
a data map holds for this tool follow this list, and `missing-purpose`, `missing-category`, `missing-retention`,
`missing-location`, `transfer-without-safeguard`, `missing-owner` and `duplicate-row` lean on it.

### Art. 44 GDPR, General principle for transfers (gdpr-info.eu)

https://gdpr-info.eu/art-44-gdpr/

A transfer of personal data to a third country or an international organisation, onward transfers included, takes
place only under the conditions of Chapter V of the regulation, so that the protection the regulation gives is not
undermined. The tool reads a record as a transfer when its storage location or the location of its recipient is
outside the EU/EEA; `missing-location` and `transfer-without-safeguard` rest on this article.

### Art. 45 GDPR, Transfers on the basis of an adequacy decision (gdpr-info.eu)

https://gdpr-info.eu/art-45-gdpr/

A transfer may take place without a specific authorisation where the European Commission has decided that the third
country, a territory or sector in it, or an international organisation ensures an adequate level of protection. The
tool accepts an adequacy decision as a safeguard and checks the place against the list of decisions below
(`adequacy-unconfirmed`).

### Art. 46 GDPR, Transfers subject to appropriate safeguards (gdpr-info.eu)

https://gdpr-info.eu/art-46-gdpr/

Without an adequacy decision, a transfer needs appropriate safeguards with enforceable rights and remedies for the
people concerned. Article 46(2) lists the ones that need no authorisation of a supervisory authority: a legally
binding instrument between public authorities (a), binding corporate rules (b), standard data protection clauses of
the Commission (c) or of a supervisory authority approved by the Commission (d), an approved code of conduct (e) and an
approved certification (f). Article 46(3) adds contractual clauses and administrative arrangements that a supervisory
authority authorises. The tool's names of safeguards come from this list, with binding corporate rules also named by
Article 47.

### Art. 49 GDPR, Derogations for specific situations (gdpr-info.eu)

https://gdpr-info.eu/art-49-gdpr/

Without an adequacy decision or appropriate safeguards, a transfer may rest only on a derogation for a specific
situation: explicit consent to the transfer after being told of its risks, a contract with the person or in the
person's interest, important reasons of public interest, legal claims, vital interests when consent cannot be given,
or a public register. `derogation-transfer` reports a transfer whose only safeguard is a derogation, as information,
because a field in a data map is usually transferred again and again.

## The adequacy decisions

### Data protection adequacy for non-EU countries (European Commission)

https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en

The Commission's page that lists the countries and territories it has recognised as giving an adequate level of
protection: Andorra, Argentina, Brazil, Canada (commercial organisations), the Faroe Islands, Guernsey, Israel, the Isle
of Man, Japan, Jersey, New Zealand, the Republic of Korea, Switzerland, the United Kingdom, the United States
(commercial organisations in the EU-US Data Privacy Framework) and Uruguay, and the European Patent Organisation. The
page notes that, apart from the United Kingdom, the decisions do not cover data exchanged in the law enforcement
sector. src/countries.js keeps this list with the two limits of scope, and `adequacy-unconfirmed` reports a place
outside it and a place whose decision has a limited scope. The list changes when a decision is adopted or withdrawn,
so check the page before you rely on the tool's copy.

## Formats

### RFC 4180, Common Format and MIME Type for Comma-Separated Values (CSV) Files

https://www.rfc-editor.org/rfc/rfc4180

The memo that describes CSV: each record on its own line, ended by CRLF, the last line break optional, an optional
header line first, fields separated by commas, spaces kept as part of a field, and every line with the same number of
fields. A field that holds a comma, a double quote or a line break is put in double quotes, and a double quote inside
such a field is written twice. The reader of the tool follows it, accepts LF and a lone CR as line ends too, and refuses
a quoted field that is not closed or a double quote in a field that does not start with one (`unparsable-file`); a row
with a different number of fields than the header is an `invalid-record` finding. `--format csv` writes the problem
list this way, with CRLF line ends.

### RFC 8259, The JSON Data Interchange Format

https://www.rfc-editor.org/rfc/rfc8259

The JSON standard. Its section on objects notes that when the names in an object are not unique, programs that read it
behave in different ways; the reader of the tool refuses a repeated name instead of keeping one of the values, so a
record or a setting never depends on which value a library would keep. Its section on encoding asks for UTF-8 between
systems and lets a reader ignore a byte order mark; the tool reads UTF-8 only, skips a byte order mark, and reports a
UTF-16 file as an `unreadable-file` finding.

### CSV Injection (OWASP)

https://community.owasp.org/attacks/CSV_Injection

The page on formulas hidden in CSV files. A spreadsheet may treat a cell that starts with `=`, `+`, `-`, `@`, a tab or
a line break as a formula, and the page warns that no single escape is safe in every program and for every later
reader. The CSV format of the tool puts a single quote in front of such a field, and docs/threat-model.md says why that
is a help and not a guarantee.

### Workflow commands for GitHub Actions (GitHub Docs)

https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands

The page that describes the `::notice`, `::warning` and `::error` commands with their `file`, `line`, `col` and
`title` properties, which turn a line of output into an annotation on a file. `--format github` writes one such command
per finding, info as a notice, and escapes the characters a command gives a meaning to.

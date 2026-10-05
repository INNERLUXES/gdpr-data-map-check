# Changes

## 1.0.0

First release.

- Checks a GDPR data map or record of processing activities: one or more CSV files (RFC 4180) or JSON files (RFC 8259)
  that list personal data fields with their system, store, category, data subjects, purpose, lawful basis, special
  category condition, retention, processor or recipient, agreement, storage and recipient location, transfer safeguard,
  consent reference and owner, read as one map, with the columns and keys matched by name in any case and order.
- The six lawful bases of Article 6(1), written by name or by point (`Art. 6(1)(b)`), with aliases; the eight special
  categories of Article 9(1) and the criminal offence data of Article 10, found by name, by alias or as whole words in
  a longer category; retention periods read as a number with a unit or an ISO 8601 duration; the countries of the
  EU/EEA and the adequacy decisions of the European Commission as a documented data file (`src/countries.js`); the
  safeguards of Articles 45, 46, 47 and 49 by name or by article.
- Eighteen rules in three levels: no purpose (`missing-purpose`), no lawful basis or an unknown one
  (`missing-lawful-basis`, `unknown-lawful-basis`), no category (`missing-category`), special category data with no
  Article 9 condition (`special-category-without-condition`), criminal offence data (`criminal-offence-data`), no
  retention, an open-ended one or one that cannot be read (`missing-retention`, `open-ended-retention`,
  `unclear-retention`), no storage location (`missing-location`), a transfer out of the EU/EEA with no safeguard or an
  unknown one (`transfer-without-safeguard`, `unknown-safeguard`), an adequacy decision the tool cannot confirm
  (`adequacy-unconfirmed`), a transfer on a derogation (`derogation-transfer`), consent with no consent reference when
  the configuration asks for one (`consent-without-reference`), a processor with no agreement
  (`processor-without-agreement`), no owner (`missing-owner`) and duplicate rows (`duplicate-row`); and three rules of
  input problems that cannot be lowered (`invalid-record`, `unreadable-file`, `unparsable-file`).
- A summary per system (records, special category data, criminal offence data, transfers and findings) and a list of
  the transfers out of the EU/EEA.
- A configuration file in strict JSON over documented defaults: the level of every rule, aliases for lawful bases,
  categories and places, whether consent needs a reference, the minimum severity and the level that fails the run; a
  key the tool does not know is an error with its line and a suggestion, and a key named twice is refused.
- Reports as text, JSON, a CSV problem list (`--format csv`) and GitHub workflow commands (`--format github`) that show
  each finding as an annotation; `--min-severity`, `--fail-on`, `--explain` with the rule and the sources of each
  finding, and `--print-defaults`. Exit code `0` when no finding is at or above the fail-on level, `1` when one is, `2`
  for a usage or input error, with no result.
- Follows no symbolic link, fetches nothing, runs nothing, writes nothing to disk, reports binary, UTF-16 and invalid
  UTF-8 input as errors, neutralizes formulas in the CSV problem list, and has a size limit on every input.
- An engineering aid, not legal advice: every report says so.
- Release packages come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation, after the SSDF gate
  of the repository.

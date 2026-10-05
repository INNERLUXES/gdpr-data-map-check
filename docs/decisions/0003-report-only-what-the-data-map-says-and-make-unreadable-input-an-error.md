# 3. Report only what the data map says, and make unreadable input an error

## Status

Accepted

## Context

A data map is usually a spreadsheet that many people edit. It has lawful bases written in a team's own words, special
categories hidden in longer names, retention periods written as events, rows with a missing cell, columns added for
another purpose, and sometimes a file saved as UTF-16 or in a binary format. A checker could guess: read `goodwill` as
legitimate interests, read an unknown safeguard as SCCs, skip a row it cannot read, or decide which Article 9 condition
fits a field. Each guess would make the map look complete and could be wrong in a way nobody sees, and a guess about the
law would be legal advice the tool cannot give.

## Decision

1. The tool reports what the data map says. An unknown lawful basis is an `unknown-lawful-basis` finding and an
   unknown safeguard an `unknown-safeguard` finding; neither is matched to a near name. A team that uses its own words
   adds them as aliases in the configuration, where a reviewer sees them.
2. The tool checks that a value is there and can be read, never that it fits the processing: any text is a purpose, an
   Article 9 condition or an owner, and a named lawful basis is accepted as it is. Every report says the tool is an
   engineering aid, not legal advice.
3. A record that cannot be read (no field, the wrong number of fields, a JSON record that is not an object) is an
   `invalid-record` finding and is not checked; a file that cannot be read or parsed is an `unreadable-file` or
   `unparsable-file` finding. These three rules are always errors and have no key in the configuration, so a run never
   passes because a part of the input was passed over.
4. A column or key the tool does not read is named in a note, so a column called `Basis of processing` that the tool
   did not recognize is visible.

## Consequences

- A clean run means the data map holds what the checks need in the forms docs/method.md describes, and every report
  ends with a sentence that says what a check of a data map cannot see.
- A data map with many problems gives a long report on the first run; `--min-severity error` and the levels of the
  rules let a team work through it in steps.
- A finding is something a reader can check in one cell of the file, which keeps the review with the people who own the
  data map and their data protection officer.

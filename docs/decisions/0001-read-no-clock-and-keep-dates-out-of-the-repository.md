# 1. Read no clock, and keep dates out of the repository

## Status

Accepted

## Context

A data map check is tempting to tie to the calendar: a review date for each record that turns into an error when it
passes, a retention period counted from a collection date to say which fields are overdue for erasure, a report that
says how many days are left before an adequacy decision is reviewed. Each of these would make the same data map give a
different result on a different day, so a pipeline that passed yesterday could fail today with no change to the
repository, and two people checking the same commit could see two reports. The output could never be saved and
compared.

The checks do not need a date. Whether a field names a purpose, a lawful basis, a condition, a retention period and a
safeguard can all be read from the data map as it is. Whether a period has run out for a given person is a question for
the systems that hold the data, not for the map.

## Decision

1. The tool reads no clock, no time zone and no locale. The same data map and configuration give the same output on
   every machine and on every day.
2. A retention period is read as a period, never compared with today. The configuration and the data map have no key
   or column that holds a date. A team that wants a deadline raises `failOn` or a rule in a commit of its own, where the
   change can be reviewed.
3. No file of this repository holds a date or a number that reads like a year: not the licence, not the changelog, not
   the examples, not the documents, not the comments of the code. `npm run check` and a test fail on any number that
   reads like a year. Version numbers such as Node 22, RFC 4180 or 1.0.0 and the numbers of articles are not years and
   are fine.

## Consequences

- The output of a run can be saved in the repository (`examples/output`) and compared on every change, because it
  does not move with the calendar.
- The regulation is cited by its articles, and the list of adequacy decisions by the Commission's page, never by the
  dates of their texts. A reader checks the current page.
- The README, the documents and the examples can be read at any time without being out of date about a date.

# 2. Treat a place the tool does not know as outside the EU/EEA

## Status

Accepted

## Context

A data map names where each field is stored and where its recipient holds it, and people write places in many ways: a
country name, a two-letter code, a city, a cloud region such as `eu-central-1`, a data centre's own name, or a typo.
The transfer rules depend on one question for each place: is it inside the EU/EEA or not. The tool can answer it only
for the places it knows.

For a place it does not know, the tool can stop with an error, skip the place, or decide on one side. Stopping makes
every cloud region a blocker until someone writes an alias. Skipping means a transfer to an unknown place is never
looked at, so `Germny` and `Singapur` pass without a word. Reading an unknown place as inside the EU/EEA does the same.
Reading it as outside can raise a transfer finding for a place that is in fact inside, which a reader sees and can
correct in one line.

## Decision

1. src/countries.js lists the countries of the EU/EEA and the places with an adequacy decision of the Commission, by
   name and two-letter code, with a few other names, as a documented data file. The configuration adds places with
   `locationAliases`, each mapped to a two-letter code, `EU` or `EEA`.
2. A place that is none of these is a third country with no adequacy decision the tool knows of. A record that names
   it as a storage or recipient location is a transfer, and every finding about it says the place is not one the tool
   knows, with a near name of a known place when there is one.
3. A location alias that maps a name to an EU/EEA code is a choice a reviewer can see in the configuration, never a
   guess of the tool.

## Consequences

- A typo or an unknown place never hides a transfer; at worst it raises a finding with a suggestion.
- A team that writes cloud regions or data centres adds them once to `locationAliases`, where a reviewer sees which
  country each one stands for.
- The list of adequacy decisions is a copy and can fall behind the Commission's page; `adequacy-unconfirmed` is a
  warning for that reason, and docs/limits.md says so.

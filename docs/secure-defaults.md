# Secure defaults

The default run is the safe run. Nothing in the first section needs a flag, and none of it can be switched off. The rest
of the document is about what the tool cannot do for you: which files you give it, where the output goes, and who may
change the configuration. The tool is an engineering aid, not legal advice; a passing run is a data map in good order,
not a finding that the processing is lawful.

## How the tool behaves by default

- **Reads, never follows.** The tool reads the files it is given and the configuration named with `--config`. It
  walks no folder, follows no symbolic link, fetches no web address, refuses an argument that looks like an address,
  evaluates nothing, starts no program and writes nothing to disk.
- **Every rule on from the first run.** The gaps a record of processing must not have are errors (no purpose, no
  lawful basis or an unknown one, special category data with no Article 9 condition, no retention or an open-ended
  one, a transfer out of the EU/EEA with no safeguard or an unknown one), and the ones that need a decision are
  warnings (criminal offence data, a retention or an adequacy decision the tool cannot confirm, no category, no
  location, a processor with no agreement, no owner, duplicate rows).
- **Fail closed on what it cannot read.** A file that cannot be read, a file the readers refuse and a record that
  cannot be read are error findings that fail the run at the default `failOn` of `error`; these three rules have no key
  and cannot be lowered or set off. A path that cannot be used stops the run with exit code `2` and no result.
- **Unknown means outside.** A place the tool does not know is read as outside the EU/EEA, so a typo never hides a
  transfer ([decision 2](decisions/0002-treat-a-place-the-tool-does-not-know-as-outside-the-eu-eea.md)).
- **No guesses.** An unknown lawful basis or safeguard is reported, not matched to a near one; a near place is only
  suggested
  ([decision 3](decisions/0003-report-only-what-the-data-map-says-and-make-unreadable-input-an-error.md)).
- **Unknown keys are errors.** A key in the configuration that the tool does not know stops the run, with its line and
  a suggestion, so a typo such as `requireConsentRefrence` cannot leave a default in place. A key named twice stops the
  run.
- **No regular expression from the input.** No pattern is built from the data maps or the configuration.
- **No prototype tricks.** Objects are built with own properties and names are looked up with `Object.hasOwn`, so
  `__proto__` is only a name.
- **Clean output.** Text from the input, file names included, has control characters, line separators and direction
  controls removed and its length capped before it reaches a report or an error message. The GitHub format escapes
  `%`, CR and LF in a message and also `:` and `,` in a property, so a text cannot end a workflow command early or
  start another one. The CSV format puts a single quote in front of a field that a spreadsheet could read as a formula.
- **The same input gives the same output.** No clock, no zone, no locale and no random number
  ([decision 1](decisions/0001-read-no-clock-and-keep-dates-out-of-the-repository.md)).
- **No dependencies.** Node 22 or newer and nothing else.

## Settings that make the check stricter

- **`"failOn": "warning"`.** Criminal offence data, unclear retention, unconfirmed adequacy decisions, missing
  categories and locations, processors with no agreement, missing owners and duplicate rows fail the run too. Use it
  once the errors are fixed.
- **`"requireConsentReference": true`.** Every field that rests on consent must name where consent is recorded.
- **`"rules": { "derogationTransfer": "warning" }`.** A transfer on a derogation needs a decision before it is
  accepted.
- **Keep the aliases short.** Every alias is a word the check accepts as a lawful basis, a category or a place. A
  location alias that names an EU/EEA code puts the place inside the EU/EEA, and a category alias set to `other` takes a
  word out of the special categories; review each one.

## Running it in a pipeline

```yaml
permissions:
  contents: read
steps:
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
  - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
    with:
      node-version: 22
  - name: GDPR data map check
    run: npx --yes github:INNERLUXES/gdpr-data-map-check data-map.csv --config gdpr-check.json --format github
```

- Give the job read access to the contents and nothing more. The tool needs no secret.
- Pin every action to a full commit, as above, and pin the tool to a release commit or a tag you have read, because
  `npx` runs what it downloads.
- Do not hide the exit code with a trailing `|| true`. To list the findings without failing, keep `failOn` at `error`
  and keep the JSON report or the CSV problem list as an artifact of the job.
- Treat a CSV problem list built from a data map you do not trust as untrusted data: open it with formulas off.
- Keep values out of the data map. It names fields, not the personal data in them.

## Protecting the configuration and the data map

The configuration decides which rules report, what counts as a lawful basis, a special category or a place inside the
EU/EEA, and what fails the run. Keep it and the data map in the repository, put their paths in `CODEOWNERS` with the
people who own data protection, and require their review in branch protection. Review a change that sets a rule to off
or lower, adds an alias, raises `failOn` or removes a column like a change to code: each of them can hide a gap.

## SSDF

The repository is checked against NIST SP 800-218 (SSDF) in its own pipeline and before every release, with
`ssdf-repo-check` pinned to its release commit. The evidence it looks for is in these files:

| Practice | Evidence in this repository |
| --- | --- |
| PO.1 Define security requirements | CONTRIBUTING.md, docs/secure-defaults.md |
| PO.2 Roles and responsibilities | .github/CODEOWNERS |
| PO.3 Toolchain | .github/workflows/ci.yml, codeql.yml, release.yml |
| PO.4 Criteria for security checks | CodeQL with the security-extended queries, the SSDF gate in ci.yml and release.yml |
| PO.5 Secure environments | a `permissions:` block in every workflow, actions pinned to commits |
| PS.1 Protect the code | .gitignore for keys and `.env`, `npm run check` for committed secrets |
| PS.2 Integrity of releases | SHA-256 checksums and a build provenance attestation in release.yml |
| PS.3 Archive and provenance | a CycloneDX SBOM and the CHANGELOG with every release |
| PW.1 Design for security | docs/threat-model.md |
| PW.2 Review the design | docs/decisions |
| PW.4 Reuse secure components | no runtime dependencies, a lock file, Dependabot |
| PW.5 Secure coding | CONTRIBUTING.md, `npm run check` |
| PW.6 Build settings | `npm ci` from the lock file |
| PW.7 Code review | the pull request template and CODEOWNERS |
| PW.8 Testing | `npm test` on Linux, Windows and macOS with Node 22 and 24, `npm run test:coverage`, hostile input tests |
| PW.9 Secure defaults | this document |
| RV.1 Find vulnerabilities | SECURITY.md, Dependabot |
| RV.2 Respond to vulnerabilities | SECURITY.md |

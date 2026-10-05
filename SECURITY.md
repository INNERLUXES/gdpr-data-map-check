# Security

## Reporting a problem

Write to info@innerluxes.dev with the subject line "gdpr-data-map-check security", or use private vulnerability
reporting on this repository. Please do not open a public issue for a vulnerability.

Include a small made-up data map or configuration that shows the problem, the command you ran, what you expected and
what happened. Use made-up systems, fields and teams, never the data map of a real organisation, never personal data,
and never a real key, token, password, host name or address, even an old one.

## Scope

In scope:

- an input that makes the tool read a file other than the data maps and the configuration it was given, or follow a
  symbolic link
- an input that makes the tool open a network connection, run a program or evaluate any part of a file
- an input that makes the tool write a file
- an input that makes the tool hang, take very long or use unbounded memory, such as a very large file, very long
  values, long runs of quotes, commas or brackets, or JSON very deep
- binary, UTF-16 or invalid UTF-8 input that the tool reads as if it were text
- an input that the tool fails to read and passes over without an error finding
- a run that passes at a `failOn` level although a data map it read holds a finding at that level that
  docs/method.md says is reported
- a place outside the EU/EEA that the tool reads as a place inside it
- text from a file or a file name that rewrites the terminal through control or direction characters, starts or ends
  a GitHub workflow command, is shown unescaped in the output, or starts a formula in the CSV problem list
- a name such as `__proto__` that changes how objects behave inside the tool

Out of scope: the forms docs/limits.md says the tool does not read, whether the data map is true to the systems it
describes, whether a lawful basis, a condition or a safeguard fits the processing (the tool is an engineering aid,
not legal advice), who may change the data map or the configuration in your repository, and where your pipeline keeps
the output.

Read [docs/threat-model.md](docs/threat-model.md) for the rest.

## Security

If you believe you have found a security vulnerability in any TypeORM-owned repository, please report it to us as described below.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please report them through [GitHub Security Advisories](https://github.com/typeorm/typeorm/security/advisories/new).

If you cannot use GitHub, you can email [support@typeorm.io](mailto:support@typeorm.io) as a fallback.

Please include as much of the information listed below as you can to help us better understand and resolve the issue:

- The type of issue (e.g., buffer overflow, SQL injection, or cross-site scripting)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Security Model and Scope

TypeORM is an ORM _and_ a SQL-building toolkit. Understanding which of its inputs are
trusted is essential to knowing what constitutes a vulnerability. Please read this section
before filing an advisory — reports outside this scope will be closed with a reference to
this policy.

### What TypeORM guarantees

**Values are safe.** Any untrusted _data_ supplied in a value position — entity values,
criteria values, named parameters, pagination values — is bound as a query parameter or
correctly escaped as a literal.

**Database content is treated as data.** Whatever comes back from the database — values,
result sets, database-reported metadata — is handled as untrusted data wherever TypeORM
processes it: during entity hydration, and in anything TypeORM generates from database
state, including code and files emitted by the CLI.

Bugs in these guarantees are vulnerabilities and we want to hear about them. In scope:

- Untrusted runtime data reaching a generated query unescaped — or, for non-SQL drivers,
  being interpreted as query operators rather than values — through a documented API used
  as documented. This includes TypeORM's _internal_ query generation interpolating entity
  data.
- Parameter-binding or literal-escaping defects in a driver.
- Defects in identifier escaping where TypeORM applies it.
- Database-derived content escaping its context in TypeORM's output: prototype pollution
  or code execution while processing results, or injection into code, files, or commands
  generated from database state.
- Amplification of an existing prototype-pollution primitive: object iteration in
  query-building, result-processing, or code-generation paths must not pick up inherited
  keys, so that a polluted runtime cannot alter generated queries or emitted code through
  TypeORM. (The pollution source itself remains a vulnerability in whatever introduced
  it; such reports are assessed at reduced severity.)

### What TypeORM does not guarantee

**Identifiers and SQL expressions are code, not data.** QueryBuilder builds SQL. By
design, any argument documented to accept an identifier or a SQL fragment — projections,
condition strings, sort and grouping expressions, aliases, computed expressions — is
emitted as the developer wrote it, because expressing arbitrary SQL is the point of those
positions. They **cannot be escaped without breaking documented functionality**, and the
API does not promise they are injection-safe.

Passing untrusted input into such a position is an application vulnerability, equivalent
to concatenating user input into a raw query. Reports that require the application to do
so are out of scope. Use parameter binding for all untrusted data; never build identifiers
or expressions from user input.

**Schema definitions are trusted code.** Entity definitions, migration objects, and their
options are design-time inputs authored by the developer. DDL generated from them is not
hardened against a hostile schema: an attacker who controls your schema definitions
already controls your application. Reports premised on untrusted input reaching schema or
migration definitions are out of scope. (We still accept — and appreciate — pull requests
that escape identifier-only positions as defense-in-depth; those are handled as regular
hardening changes, not advisories.)

**Configuration is trusted code.** Connection options, data source configuration, CLI
arguments, and migration files are developer-authored inputs, on par with application
source. Reports requiring an attacker to control them are out of scope.

**Runtime guards are best-effort, not security boundaries.** TypeORM sometimes adds
validations that catch common application mistakes before they reach the database. These
guards are conveniences layered on top of the model above; they do not move the trust
boundary, and they are not, and cannot be, complete. A bypass of such a guard that
restores previously documented behavior is a regular bug — please file it as an ordinary
issue — not a vulnerability.

### Severity expectations

CVSS scores should reflect TypeORM's contract, not a hypothetical application that pipes
untrusted input into a code position. A report whose attack vector is "the application
passes attacker-controlled input into an identifier, expression, or schema slot" describes
an application vulnerability and will be assessed accordingly. Before filing, check
existing advisories and recent releases — duplicates of an already-tracked mechanism will
be closed as such.

## What to Expect

We aim to acknowledge reports within 72 hours. After triage, the maintainers will work on a fix in a private fork and coordinate a public disclosure with a CVE when appropriate. We will release a patch as soon as possible depending on complexity.

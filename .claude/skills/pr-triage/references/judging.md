# Judging PRs

You read a digest batch (`digest-N.md`) and write `judgments-N.json` next to it. The script measures demand, author history, size and CI. Your job is the part it cannot measure: what the change is worth if it lands.

Judge from the title, description, linked issues and scope line. Do not open the diff or fetch anything for a batch pass. When the description is thin, judge the linked issue instead.

## Output

One JSON object keyed by PR number. Every PR in the batch gets an entry.

```json
{
  "13046": {
    "severity": 4,
    "reach": "postgres,cockroachdb",
    "summary": "Enum arrays with commas or NULLs read back wrong on Postgres",
    "note": "Silent wrong data on read"
  },
  "13040": { "severity": 1, "summary": "Corrects two docs examples" }
}
```

| Field | Required | Meaning |
|---|---|---|
| `severity` | yes | 1 to 5, see the scale below |
| `summary` | yes | At most 15 words, written for a maintainer scanning a list. Say what is broken or added, not what the code does. |
| `reach` | no | Only when the scope line is wrong. One of `core`, `cli`, `docs`, `infra`, `tests`, or a comma-separated list of drivers from `config.json` (`postgres`, `mysql`, `sqlite-abstract`, `sqlserver`, …). Use it when a driver-specific fix shows as `core`, or a core bug shows as one driver. |
| `note` | no | One short phrase a reviewer should know before opening the PR: "breaking change", "large rewrite for a small bug", "duplicates #12345", "changes public API", "description does not match the title". |
| `sentiment` | no | Leave unset in the batch pass. The deep pass sets it. |
| `preferred`, `close` | no | Deep pass only, see below. |

## Severity scale

Score the problem the PR solves, not the quality of the PR.

| Score | Fixes | Examples |
|---|---|---|
| 5 | Data loss or corruption, a security hole, or a crash in a path most users hit | Wrong rows deleted, SQL injection, `save()` throws for common entities |
| 4 | Wrong results with no error, a regression from a recent release, or a broken migration or schema sync | Query returns wrong rows, `synchronize` drops a column, generated migration is wrong every run |
| 3 | A real bug with a workaround, or a crash in an uncommon path | Edge case in a relation type, an option ignored, error on unusual column type |
| 2 | Minor bug, cosmetic output, typings, small feature or ergonomic improvement, performance gain | Wrong TypeScript type, better error message, new option on an existing API |
| 1 | Docs, tests, refactors, tooling, chores, or a feature few users asked for | Typo fix, test cleanup, internal rename |

Adjustments:
- A feature request with strong demand on its linked issue (many reactions or participants) can score 3. Demand is counted separately, so do not inflate severity just for popularity.
- A `fix:` that only changes behaviour nobody reported (no issue, speculative) is at most 2.
- A breaking change to public API: keep the severity of what it fixes, and add `"note": "breaking change"`.

## Deep pass (top candidates only)

For the PRs the agent selects, `node triage.mjs context <n>...` prints the human comments on the PR and its issues. Read them and add `sentiment`:

| Value | When |
|---|---|
| `urgent` | Users report production impact, block an upgrade, or keep asking for a release |
| `positive` | Users confirm the fix works, or a maintainer said they want it |
| `neutral` | Little discussion, or nothing that changes the picture |
| `contested` | Users or maintainers disagree with the approach or question whether it is a bug |
| `blocked` | A maintainer said it cannot merge as is (wrong approach, waiting on another change, needs a design decision). Put the reason in `note`. |

You may also correct `severity`, `reach` or `summary` if the discussion shows the first judgment was wrong.

Read maintainer comments on the linked issues as well as the PR. A maintainer may have said the fix is happening elsewhere, or that community PRs for the issue will be closed. When that applies to a PR, set `"close": "<what the maintainer said, where and when>"`. The PR moves to close candidates with that reason, whatever its score. Only set `close` on an explicit maintainer statement, never on your own opinion of the PR.

## Competing PRs

`clusters.json` lists groups of PRs that fix the same issue. For each group of three or more, and each group whose lead is in the top 15, run `context` on the members and compare. Prefer, in order: a maintainer has already engaged with it; it has tests; it fixes the root cause rather than one symptom; it is the smallest correct change; it does not conflict. Set `"preferred": true` on the one you would review and give the reason in its `note`. The others become `superseded` in the next rank.

---
name: pr-triage
description: Rank TypeORM's open pull requests so maintainers know what to review and merge next. Scores each PR on severity, community demand (reactions, comments and pings on the PR and the issues it fixes), reach (core vs one driver), author track record, size and readiness, then sorts the queue into ready-to-merge, review next, quick wins, blocked, waiting on author and close candidates. Use when asked to prioritise, triage or rank PRs, find what to review next, or clean up the PR backlog.
---

# PR triage

Ranks the open PR queue on `typeorm/typeorm`. A script fetches the data and does the arithmetic. You make the judgments it cannot: how severe the problem is, and what the discussion says.

All commands run from this skill's directory: `node scripts/triage.mjs <command> --out <dir>`. Use the same `--out` throughout; it defaults to `$TMPDIR/typeorm-pr-triage`. The `gh` CLI must be authenticated. In a sandboxed session `gh` needs network and keychain access.

## How the score works

```
value    = 0.40 severity + 0.35 demand + 0.25 reach  (+ sentiment adjustment)
ease     = 0.5 size + 0.5 readiness
priority = 100 × value × (0.6 + 0.4 ease) × (0.6 + 0.4 trust)
```

Value decides most of the order. Ease breaks ties, so a cheap PR beats an expensive one of similar value. Track record is its own multiplier: proven contributors are worth reviewing first. At similar value, a maintainer's PR (×1.0) or a regular contributor's (×0.92) ranks clearly above a first-timer's (×0.68). A newcomer's critical bug can still rank high.

| Signal | Source |
|---|---|
| severity | Your judgment, 1 to 5 (`references/judging.md`). Without one, a guess from the conventional-commit type and labels. |
| demand | Positive reactions on the PR and linked issues, distinct non-maintainer participants, and "+1 / any update?" comments. Bot comments (Qodo, Codex, pkg-pr-new and others) are ignored. Log-scaled. |
| reach | Which code it touches. Core is 1.0; a driver uses its weight in `config.json` (postgres 0.85 … spanner 0.1). A driver named in the title scope, as in `fix(mysql): …`, wins over the touched paths. |
| trust | Merged PRs by the author in this repo. Maintainers score 1. An author with several open PRs and none merged scores low. |
| size | Changed lines under `src/`. Tests and docs do not count. |
| readiness | CI, merge conflicts, tests present for fixes and features, a linked issue. A maintainer approval sets it to 1. |

Buckets, checked in this order:
0. **close-candidate**: you set `close` because a maintainer said so on the PR or its issue.
1. **blocked**: you set `sentiment: "blocked"`.
2. **waiting-on-author**: draft, conflicts, failing CI, or a maintainer's change request with no commit since. Becomes **close-candidate** after 180 days without human activity if its value is low.
3. **ready-to-merge**: approved by a maintainer, with no outstanding change request. Qodo approvals do not count.
4. **quick-win**: small (60 `src` lines at most), easy and worth doing.
5. **needs-review**: everything else.

PRs that fix the same issue form a group, since each would otherwise inherit the issue's demand and crowd the top of the list. All PRs in a group get the group's highest severity. One PR leads each group. That is the one you mark `preferred`, or else the most mergeable. The others become **competing**, or **superseded** once you have picked a lead. The report lists the groups, and lists high-value PRs stuck on their author under **Worth a nudge**.

Tune weights, driver reach and thresholds in `config.json`. They are guesses; change them when the ranking disagrees with your instincts.

## Steps

1. **Fetch.** `node scripts/triage.mjs fetch --out <dir>`. Takes one to two minutes for about 250 PRs. If `<dir>/prs.json` is less than a day old, ask the user whether to reuse it.

2. **Judge every PR.** `node scripts/triage.mjs digest --out <dir>` writes `digest-N.md` batches of 40. For each batch, write `judgments-N.json` following `references/judging.md`. With more than two batches, give each batch to a subagent in parallel. Tell it to read `references/judging.md` and its digest file, write the judgments file, and reply with only the PR numbers it scored 4 or 5. Check that every judgments file exists and parses before going on.

3. **First rank.** `node scripts/triage.mjs rank --out <dir>`.

4. **Deep pass.** Two jobs, which can run as parallel subagents:
   - Take the top 15 of `needs-review`, `quick-win` and `ready-to-merge` from `ranked.json`. Run `node scripts/triage.mjs context <n> <n> …` (five at a time keeps the output readable) and write `judgments-deep-top.json` with `sentiment` and any corrections.
   - Pick a lead for each competing group with three or more PRs, and for each group whose lead is in the top 15 (`clusters.json`, rules in `references/judging.md`). Give a group of ten or more PRs its own subagent. Write `judgments-deep-<name>.json`.

   `judgments-deep-*.json` files load after the batch files and override them field by field.

5. **Final rank.** Run `rank` again and read `report.md`.

6. **Report.** Lead with the five PRs to review first and one line each on why. Then give the counts per bucket, the ready-to-merge list, the quick wins, and the close candidates. Mention PRs whose rank comes from one strong signal, such as high demand on a tiny feature or a severity-5 claim nobody has confirmed. Give the path to `report.html` and tell the user to open it in a browser; also mention `report.md` and `ranked.csv`.

## The interactive report

`rank` also writes `report.html`, one self-contained file that needs no server or network. It is meant to be simple:

- Tabs: Review next, Quick wins, Ready to merge, Nudge the author, Close.
- Each PR shows its summary and plain-language reasons, such as "Serious bug · All databases · 13 people want this · Small: 24 lines · First-time contributor", plus the agent's note. The Close tab shows why each PR should close.
- Four presets re-rank the lists: Balanced (`config.json`), Worst bugs first, Most wanted and Easiest first.

It ranks in the browser with the same code as the CLI (`scripts/scoring.mjs`, inlined), so Balanced always matches `ranked.json`. Fine-grained tuning stays in `config.json`. The page layout lives in `scripts/report-template.html`.

Do not comment on, label, approve or close PRs unless the user asks. This skill only ranks.

## Limits

- Severity and sentiment come from reading text, not running code. A PR that claims to fix data loss may not.
- Different batches calibrate severity a little differently: in testing, two batches scored the same bug 4 and 5. PRs sharing an issue get the highest severity in their group, which hides this inside a group but not between groups.
- Reach weights are rough estimates of driver usage, not measured.
- Demand favours old issues, which have had longer to gather reactions.
- Author history counts PRs merged in this repo only.

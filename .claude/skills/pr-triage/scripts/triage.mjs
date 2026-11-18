#!/usr/bin/env node
// PR triage for TypeORM: gathers signals from GitHub, merges agent judgments, ranks the open PR queue.
//
//   node triage.mjs fetch   [--out DIR] [--repo owner/name] [--limit N]
//   node triage.mjs digest  [--out DIR] [--batch-size 40]
//   node triage.mjs context [--out DIR] <pr-number>...
//   node triage.mjs rank    [--out DIR] [--top 25]
//
// Requires an authenticated `gh` CLI. No npm dependencies.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { rankAll } from "./scoring.mjs"

const SKILL_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CONFIG = JSON.parse(
    fs.readFileSync(path.join(SKILL_DIR, "config.json"), "utf8"),
)

// ---------- args ----------

const argv = process.argv.slice(2)
const command = argv[0]
const flags = {}
const positional = []
for (let i = 1; i < argv.length; i++) {
    if (argv[i].startsWith("--")) flags[argv[i].slice(2)] = argv[++i]
    else positional.push(argv[i])
}
const OUT = path.resolve(
    flags.out ?? path.join(os.tmpdir(), "typeorm-pr-triage"),
)
const REPO = flags.repo ?? "typeorm/typeorm"
const [OWNER, NAME] = REPO.split("/")
fs.mkdirSync(OUT, { recursive: true })

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8"))
const writeJson = (f, v) =>
    fs.writeFileSync(path.join(OUT, f), JSON.stringify(v, null, 2))

// ---------- GitHub ----------

function graphql(query, variables = {}, attempt = 1) {
    try {
        let out
        try {
            out = execFileSync("gh", ["api", "graphql", "--input", "-"], {
                input: JSON.stringify({ query, variables }),
                maxBuffer: 256 * 1024 * 1024,
                stdio: ["pipe", "pipe", "pipe"],
            })
        } catch (e) {
            // gh exits non-zero on partial errors (e.g. one aliased issue not found) but still prints the data
            out = e.stdout
            if (!out?.length) throw e
        }
        const res = JSON.parse(out.toString())
        if (res.errors && !res.data) throw new Error(JSON.stringify(res.errors))
        return res.data
    } catch (e) {
        if (attempt >= 4) throw e
        const wait = 5000 * attempt
        process.stderr.write(
            `  GraphQL error (${String(e.message).slice(0, 160)}), retrying in ${wait / 1000}s\n`,
        )
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait)
        return graphql(query, variables, attempt + 1)
    }
}

const ISSUE_FIELDS = `
  number title url state createdAt body
  author { login }
  labels(first: 10) { nodes { name } }
  reactionGroups { content reactors { totalCount } }
  comments(last: 60) { totalCount nodes { author { __typename login } authorAssociation body createdAt } }`

const PR_QUERY = `
query($owner: String!, $name: String!, $cursor: String, $pageSize: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequests(states: OPEN, first: $pageSize, after: $cursor, orderBy: { field: CREATED_AT, direction: DESC }) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        number title url body createdAt updatedAt isDraft mergeable
        additions deletions changedFiles
        author { __typename login } authorAssociation
        labels(first: 20) { nodes { name } }
        reactionGroups { content reactors { totalCount } }
        files(first: 100) { nodes { path additions deletions } }
        commits(last: 1) { nodes { commit { committedDate statusCheckRollup { state } } } }
        reviews(last: 40) { nodes { author { __typename login } authorAssociation state submittedAt } }
        comments(last: 60) { totalCount nodes { author { __typename login } authorAssociation body createdAt } }
        closingIssuesReferences(first: 5) { nodes { ${ISSUE_FIELDS} } }
      }
    }
  }
}`

const MAINTAINER_ASSOC = new Set(["OWNER", "MEMBER", "COLLABORATOR"])
const isBot = (author) =>
    !author ||
    author.__typename === "Bot" ||
    new RegExp(CONFIG.botLoginPattern, "i").test(author.login)
const isMaintainer = (assoc) => MAINTAINER_ASSOC.has(assoc)

const POSITIVE_REACTIONS = new Set(["THUMBS_UP", "HEART", "HOORAY", "ROCKET"])
function reactions(groups = []) {
    let positive = 0
    let negative = 0
    for (const g of groups) {
        if (POSITIVE_REACTIONS.has(g.content)) positive += g.reactors.totalCount
        if (g.content === "THUMBS_DOWN") negative += g.reactors.totalCount
    }
    return { positive, negative }
}

const PING_RE = new RegExp(CONFIG.pingPattern, "i")
const truncate = (s, n) => (s && s.length > n ? s.slice(0, n) + "…" : s ?? "")

function humanComments(nodes) {
    return nodes
        .filter((c) => !isBot(c.author))
        .map((c) => ({
            login: c.author.login,
            maintainer: isMaintainer(c.authorAssociation),
            at: c.createdAt,
            body: truncate(c.body.trim(), 1200),
        }))
}

function normalizeIssue(issue, prAuthor) {
    const comments = humanComments(issue.comments.nodes)
    const participants = new Set(
        [issue.author?.login, ...comments.map((c) => c.login)].filter(
            (l) => l && l !== prAuthor,
        ),
    )
    return {
        number: issue.number,
        title: issue.title,
        url: issue.url,
        state: issue.state,
        createdAt: issue.createdAt,
        labels: issue.labels.nodes.map((l) => l.name),
        body: truncate(issue.body?.trim(), 800),
        reactions: reactions(issue.reactionGroups),
        commentCount: issue.comments.totalCount,
        participants: participants.size,
        pings: comments.filter((c) => !c.maintainer && PING_RE.test(c.body))
            .length,
        comments,
    }
}

// Issues referenced with a closing keyword or an issue URL that GitHub did not link
function referencedIssueNumbers(body) {
    const nums = new Set()
    const re =
        /\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?|refs?|addresses|related to)\b[:\s]*(?:issue\s*)?#(\d+)/gi
    for (const m of body.matchAll(re)) nums.add(Number(m[1]))
    for (const m of body.matchAll(
        new RegExp(`github\\.com/${OWNER}/${NAME}/issues/(\\d+)`, "gi"),
    ))
        nums.add(Number(m[1]))
    return [...nums].filter((n) => n > 0)
}

function fetchPrs(limit) {
    const prs = []
    let cursor = null
    let total = "?"
    do {
        const data = graphql(PR_QUERY, {
            owner: OWNER,
            name: NAME,
            cursor,
            pageSize: 15,
        })
        const conn = data.repository.pullRequests
        total = conn.totalCount
        prs.push(...conn.nodes)
        cursor = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null
        process.stderr.write(`  fetched ${prs.length}/${total} PRs\n`)
    } while (cursor && prs.length < limit)
    return prs.slice(0, limit)
}

function fetchExtraIssues(numbers) {
    const result = new Map()
    for (let i = 0; i < numbers.length; i += 20) {
        const chunk = numbers.slice(i, i + 20)
        const fields = chunk
            .map(
                (n) =>
                    `i${n}: issueOrPullRequest(number: ${n}) { __typename ... on Issue { ${ISSUE_FIELDS} } }`,
            )
            .join("\n")
        const data = graphql(
            `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { ${fields} } }`,
            { owner: OWNER, name: NAME },
        )
        for (const [key, v] of Object.entries(data.repository ?? {}))
            if (v?.__typename === "Issue") result.set(Number(key.slice(1)), v)
    }
    return result
}

function fetchAuthorStats(logins) {
    const stats = {}
    for (let i = 0; i < logins.length; i += 15) {
        const chunk = logins.slice(i, i + 15)
        const fields = chunk
            .map((login, j) => {
                const q = `repo:${REPO} is:pr author:${login}`
                return `m${j}: search(query: ${JSON.stringify(q + " is:merged")}, type: ISSUE, first: 1) { issueCount }
                        c${j}: search(query: ${JSON.stringify(q + " is:closed is:unmerged")}, type: ISSUE, first: 1) { issueCount }`
            })
            .join("\n")
        const data = graphql(`query { ${fields} }`)
        chunk.forEach((login, j) => {
            stats[login] = {
                merged: data[`m${j}`].issueCount,
                closedUnmerged: data[`c${j}`].issueCount,
            }
        })
        process.stderr.write(
            `  author history ${Math.min(i + 15, logins.length)}/${logins.length}\n`,
        )
    }
    return stats
}

// ---------- signal extraction ----------

function classifyPath(fullPath) {
    // master is a monorepo (packages/typeorm/src/...); older branches use src/ at the root
    const p = fullPath.replace(/^packages\/typeorm\//, "")
    if (p.startsWith("packages/")) return { area: "infra" } // codemod and other side packages
    const driver = p.match(/^src\/driver\/([^/]+)\//)
    if (driver) return { area: "driver", driver: driver[1] }
    if (p.startsWith("src/commands/") || p.startsWith("src/cli"))
        return { area: "cli" }
    if (p.startsWith("src/")) return { area: "core" }
    if (p.startsWith("test/")) return { area: "tests" }
    if (p.startsWith("docs/") || p.endsWith(".md")) return { area: "docs" }
    return { area: "infra" }
}

function computeScope(files, title) {
    const areas = new Set()
    const drivers = new Set()
    let srcLines = 0
    let hasTests = false
    for (const f of files) {
        const c = classifyPath(f.path)
        areas.add(c.area)
        if (c.driver) drivers.add(c.driver)
        if (c.area === "tests") hasTests = true
        if (["driver", "core", "cli"].includes(c.area))
            srcLines += f.additions + f.deletions
    }
    // Conventional-commit scope naming a driver, e.g. "fix(postgres): ..."
    const scopeMatch = title.match(/^\w+\(([^)]+)\)/)
    const titleDrivers = (scopeMatch?.[1] ?? "")
        .split(/[,/ ]+/)
        .map((s) => CONFIG.driverAliases[s.toLowerCase()] ?? s.toLowerCase())
        .filter((s) => s in CONFIG.reach.drivers)

    let scope
    let driverList = [...drivers]
    if (titleDrivers.length && (areas.has("core") || areas.has("driver"))) {
        // "fix(postgres): ..." touching shared code is usually a dialect branch, so the title wins
        scope = "drivers"
        driverList = [...new Set(titleDrivers)]
    } else if (areas.has("core")) scope = "core"
    else if (drivers.size) scope = "drivers"
    else if (areas.has("cli")) scope = "cli"
    else if (areas.has("docs") && !areas.has("tests")) scope = "docs"
    else if (areas.has("tests")) scope = "tests"
    else scope = "infra"

    return { scope, drivers: driverList.sort(), srcLines, hasTests, areas: [...areas] }
}

function conventionalType(title) {
    const m = title.match(/^(\w+)(?:\([^)]*\))?!?:/)
    return m ? m[1].toLowerCase() : "unknown"
}

function reviewState(pr, lastCommitAt) {
    // Latest review per maintainer (the qodo bot can approve, so reviewDecision is not trusted)
    const latest = new Map()
    for (const r of pr.reviews.nodes) {
        if (isBot(r.author) || !isMaintainer(r.authorAssociation)) continue
        if (r.author.login === pr.author?.login) continue
        if (!["APPROVED", "CHANGES_REQUESTED", "COMMENTED"].includes(r.state))
            continue
        if (r.state === "COMMENTED" && latest.has(r.author.login)) continue
        latest.set(r.author.login, r)
    }
    const reviews = [...latest.values()]
    const approvedBy = reviews
        .filter((r) => r.state === "APPROVED")
        .map((r) => r.author.login)
    const changesRequested = reviews.filter(
        (r) => r.state === "CHANGES_REQUESTED",
    )
    const unaddressed = changesRequested.filter(
        (r) => !lastCommitAt || r.submittedAt > lastCommitAt,
    )
    return {
        maintainerReviewers: reviews.map((r) => r.author.login),
        approvedBy,
        changesRequestedBy: changesRequested.map((r) => r.author.login),
        changesRequestedUnaddressed: unaddressed.length > 0,
    }
}

function normalizePr(pr, extraIssues, authorStats, openCounts) {
    const login = pr.author?.login ?? "ghost"
    const lastCommit = pr.commits.nodes[0]?.commit
    const comments = humanComments(pr.comments.nodes)
    const linked = new Map()
    for (const i of pr.closingIssuesReferences.nodes)
        linked.set(i.number, normalizeIssue(i, login))
    for (const n of referencedIssueNumbers(pr.body ?? ""))
        if (!linked.has(n) && extraIssues.has(n))
            linked.set(n, normalizeIssue(extraIssues.get(n), login))
    const issues = [...linked.values()]

    const communityCommenters = new Set(
        comments
            .filter((c) => !c.maintainer && c.login !== login)
            .map((c) => c.login),
    )
    const maintainerTouched =
        comments.some((c) => c.maintainer && c.login !== login) ||
        pr.reviews.nodes.some(
            (r) => !isBot(r.author) && isMaintainer(r.authorAssociation),
        )
    const prReactions = reactions(pr.reactionGroups)
    const lastHumanActivity = [
        pr.createdAt,
        lastCommit?.committedDate,
        ...comments.map((c) => c.at),
        ...pr.reviews.nodes
            .filter((r) => !isBot(r.author))
            .map((r) => r.submittedAt),
    ]
        .filter(Boolean)
        .sort()
        .at(-1)

    return {
        number: pr.number,
        title: pr.title,
        url: pr.url,
        type: conventionalType(pr.title),
        body: truncate(stripTemplate(pr.body ?? ""), 2000),
        labels: pr.labels.nodes.map((l) => l.name),
        createdAt: pr.createdAt,
        lastHumanActivity,
        isDraft: pr.isDraft,
        mergeable: pr.mergeable,
        ci: lastCommit?.statusCheckRollup?.state ?? null,
        lastCommitAt: lastCommit?.committedDate ?? null,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        ...computeScope(pr.files.nodes, pr.title),
        author: {
            login,
            association: pr.authorAssociation,
            isMaintainer: isMaintainer(pr.authorAssociation),
            isBot: isBot(pr.author),
            merged: authorStats[login]?.merged ?? null,
            closedUnmerged: authorStats[login]?.closedUnmerged ?? null,
            openPrs: openCounts[login] ?? 0,
        },
        review: reviewState(pr, lastCommit?.committedDate),
        maintainerTouched,
        reactions: prReactions,
        communityCommenters: communityCommenters.size,
        pings: comments.filter(
            (c) => !c.maintainer && c.login !== login && PING_RE.test(c.body),
        ).length,
        comments,
        issues,
    }
}

function stripTemplate(body) {
    return body
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/### Pull-Request Checklist[\s\S]*/i, "")
        .replace(/### Description of change/i, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}

// ---------- commands ----------

function cmdFetch() {
    const limit = Number(flags.limit ?? Infinity)
    process.stderr.write(`Fetching open PRs from ${REPO}\n`)
    const raw = fetchPrs(limit)

    const missing = new Set()
    for (const pr of raw) {
        const linked = new Set(
            pr.closingIssuesReferences.nodes.map((i) => i.number),
        )
        for (const n of referencedIssueNumbers(pr.body ?? ""))
            if (!linked.has(n)) missing.add(n)
    }
    process.stderr.write(
        `Fetching ${missing.size} issues referenced in PR bodies but not linked\n`,
    )
    const extraIssues = fetchExtraIssues([...missing])

    const openCounts = {}
    for (const pr of raw) {
        const l = pr.author?.login ?? "ghost"
        openCounts[l] = (openCounts[l] ?? 0) + 1
    }
    const logins = [
        ...new Set(
            raw
                .filter(
                    (p) =>
                        p.author &&
                        !isBot(p.author) &&
                        !isMaintainer(p.authorAssociation),
                )
                .map((p) => p.author.login),
        ),
    ]
    process.stderr.write(`Fetching contribution history for ${logins.length} authors\n`)
    const authorStats = fetchAuthorStats(logins)

    const prs = raw.map((pr) =>
        normalizePr(pr, extraIssues, authorStats, openCounts),
    )
    writeJson("prs.json", { fetchedAt: new Date().toISOString(), repo: REPO, prs })
    console.log(`Wrote ${prs.length} PRs to ${path.join(OUT, "prs.json")}`)
}

function ago(iso) {
    const days = Math.round((Date.now() - new Date(iso)) / 86400000)
    return days < 60 ? `${days}d` : days < 730 ? `${Math.round(days / 30)}mo` : `${Math.round(days / 365)}y`
}

function cmdDigest() {
    const { prs } = readJson("prs.json")
    const size = Number(flags["batch-size"] ?? 40)
    const candidates = prs.filter((p) => !p.author.isBot)
    const files = []
    for (let i = 0; i < candidates.length; i += size) {
        const batch = candidates.slice(i, i + size)
        const n = files.length + 1
        const text = batch
            .map((p) => {
                const issues = p.issues
                    .map(
                        (i) =>
                            `  - #${i.number} "${i.title}" (${i.state.toLowerCase()}, opened ${ago(i.createdAt)} ago, +${i.reactions.positive} reactions, ${i.participants} participants, labels: ${i.labels.join(", ") || "none"})`,
                    )
                    .join("\n")
                return [
                    `## #${p.number} ${p.title}`,
                    `scope: ${p.scope}${p.drivers.length ? ` [${p.drivers.join(", ")}]` : ""} | src lines changed: ${p.srcLines} | tests: ${p.hasTests ? "yes" : "no"} | labels: ${p.labels.join(", ") || "none"}`,
                    issues ? `linked issues:\n${issues}` : "linked issues: none",
                    "",
                    truncate(p.body, 900) || "(no description)",
                    "",
                ].join("\n")
            })
            .join("\n")
        const file = path.join(OUT, `digest-${n}.md`)
        fs.writeFileSync(file, text)
        files.push({ file, judgments: path.join(OUT, `judgments-${n}.json`), prs: batch.map((p) => p.number) })
    }
    writeJson("digest-index.json", files)
    console.log(`Wrote ${files.length} digest batches:`)
    for (const f of files)
        console.log(`  ${f.file}  (${f.prs.length} PRs) -> write ${f.judgments}`)
}

function cmdContext() {
    const { prs } = readJson("prs.json")
    for (const num of positional.map(Number)) {
        const p = prs.find((x) => x.number === num)
        if (!p) {
            console.log(`#${num}: not in prs.json`)
            continue
        }
        console.log(`\n==================== #${p.number} ${p.title}`)
        console.log(`${p.url}\nauthor: ${p.author.login} (${p.author.association}, ${p.author.merged ?? "?"} merged)`)
        console.log(`review: ${JSON.stringify(p.review)}`)
        console.log(`\n--- PR description\n${truncate(p.body, 1500)}`)
        console.log(`\n--- PR comments (humans only, ${p.comments.length})`)
        for (const c of p.comments.slice(-15))
            console.log(`[${c.at.slice(0, 10)}] ${c.login}${c.maintainer ? " (maintainer)" : ""}: ${truncate(c.body, 600)}\n`)
        for (const i of p.issues) {
            console.log(`\n--- Issue #${i.number} "${i.title}" (+${i.reactions.positive} reactions, ${i.commentCount} comments)\n${truncate(i.body, 600)}`)
            for (const c of i.comments.slice(-12))
                console.log(`[${c.at.slice(0, 10)}] ${c.login}${c.maintainer ? " (maintainer)" : ""}: ${truncate(c.body, 400)}\n`)
        }
    }
}

// ---------- ranking (scoring lives in scoring.mjs, shared with report.html) ----------

function loadJudgments() {
    const all = {}
    for (const f of fs.readdirSync(OUT).filter((f) => /^judgments.*\.json$/.test(f))) {
        const data = readJson(f)
        for (const [k, v] of Object.entries(data))
            all[k] = { ...(all[k] ?? {}), ...v }
    }
    return all
}

// The subset of prs.json the HTML report needs: no comment or issue bodies
function slimPr(p) {
    const { body, comments, issues, ...rest } = p
    return {
        ...rest,
        issues: issues.map(({ body, comments, ...i }) => i),
    }
}

function writeHtml(prs, judgments, fetchedAt) {
    const template = fs.readFileSync(path.join(SKILL_DIR, "scripts", "report-template.html"), "utf8")
    const scoring = fs
        .readFileSync(path.join(SKILL_DIR, "scripts", "scoring.mjs"), "utf8")
        .replace(/^export /gm, "")
    const data = { repo: REPO, fetchedAt, config: CONFIG, judgments, prs: prs.map(slimPr) }
    // Keep "</script>" inside JSON strings from closing the script tag
    const json = JSON.stringify(data).replace(/</g, "\\u003c")
    const html = template
        .replace("/*__SCORING__*/", () => scoring)
        .replace("/*__DATA__*/null", () => json)
    fs.writeFileSync(path.join(OUT, "report.html"), html)
}

function cmdRank() {
    const { prs, fetchedAt } = readJson("prs.json")
    const judgments = loadJudgments()
    const top = Number(flags.top ?? 25)
    const humanPrs = prs.filter((p) => !p.author.isBot)
    const { ranked, clusters } = rankAll(humanPrs, judgments, CONFIG)

    writeHtml(humanPrs, judgments, fetchedAt)
    writeJson("ranked.json", ranked)
    const csvCols = ["rank", "number", "priority", "bucket", "value", "ease", "title", "author", "scope", "srcLines", "url"]
    fs.writeFileSync(
        path.join(OUT, "ranked.csv"),
        [csvCols.join(","), ...ranked.map((r) => csvCols.map((c) => JSON.stringify(r[c] ?? "")).join(","))].join("\n"),
    )

    const unjudged = ranked.filter((r) => !r.judged).length
    const byBucket = Object.groupBy(ranked, (r) => r.bucket)
    const line = (r) =>
        `| ${r.rank} | [#${r.number}](${r.url}) | ${r.priority} | ${truncate(r.summary ?? r.title, 90)} | ${r.scope} | ${r.components.severity} | ${r.components.demandRaw} | @${r.author}${r.authorMerged != null ? ` (${r.authorMerged})` : ""} | ${r.srcLines} |`
    const header = "| # | PR | prio | summary | scope | sev | demand | author (merged) | src lines |\n|---|---|---|---|---|---|---|---|---|"
    const section = (title, bucket, n = top) => {
        const rows = (byBucket[bucket] ?? []).slice(0, n)
        return rows.length ? `## ${title} (${byBucket[bucket].length})\n\n${header}\n${rows.map(line).join("\n")}\n` : ""
    }
    const issueTitles = new Map(prs.flatMap((p) => p.issues.map((i) => [i.number, i])))
    const byNum = new Map(ranked.map((r) => [r.number, r]))
    const clusterSection = clusters.length
        ? `## Competing PRs (${clusters.length} groups)\n\nPRs that fix the same issue. Pick one, close the rest. The lead is the most mergeable${clusters.some((c) => c.preferredByAgent) ? " or the one the agent preferred" : ""}.\n\n` +
          clusters
              .map((c) => {
                  const iss = c.issues.map((n) => { const i = issueTitles.get(n); return `#${n} "${truncate(i?.title, 70)}" (+${i?.reactions.positive ?? 0})` }).join(", ")
                  const members = c.members.map((n) => byNum.get(n)).sort((a, b) => b.priority - a.priority)
                  return `- ${iss}\n` + members.map((m) => `  - ${m.number === c.lead ? "**lead** " : ""}[#${m.number}](${m.url}) ${m.priority} ${m.bucket}${m.waitingOn.length ? ` (${m.waitingOn.join(", ")})` : ""}, @${m.author}, ${m.srcLines} src lines`).join("\n")
              })
              .join("\n") + "\n"
        : ""
    const nudge = (byBucket["waiting-on-author"] ?? []).filter((r) => r.value >= CONFIG.nudgeMinValue && !r.competing?.length)
    const nudgeSection = nudge.length
        ? `## Worth a nudge (${nudge.length})\n\nHigh-value PRs stuck on the author: conflicts, failing CI or unaddressed review.\n\n| # | PR | prio | summary | stuck on | author |\n|---|---|---|---|---|---|\n` +
          nudge.slice(0, top).map((r) => `| ${r.rank} | [#${r.number}](${r.url}) | ${r.priority} | ${truncate(r.summary ?? r.title, 90)} | ${r.waitingOn.join(", ")} | @${r.author} |`).join("\n") + "\n"
        : ""
    const closeSection = (rows) =>
        rows.length
            ? `## Close candidates (${rows.length})\n\n| PR | why | author |\n|---|---|---|\n` +
              rows.map((r) => `| [#${r.number}](${r.url}) ${truncate(r.title, 70)} | ${r.closeReason ?? `no activity for ${r.staleDays} days, ${r.waitingOn.join(", ")}`} | @${r.author} |`).join("\n") + "\n"
            : ""
    writeJson("clusters.json", clusters)
    const md = [
        `# PR triage, ${REPO}`,
        `Data fetched ${fetchedAt}. ${ranked.length} open PRs. ${unjudged ? `**${unjudged} PRs have no agent judgment; their severity is a heuristic.**` : ""}`,
        "",
        Object.entries(byBucket).map(([b, rs]) => `- ${b}: ${rs.length}`).join("\n"),
        "",
        section("Ready to merge", "ready-to-merge"),
        section("Review next", "needs-review"),
        section("Quick wins", "quick-win"),
        clusterSection,
        nudgeSection,
        section("Blocked", "blocked"),
        closeSection(byBucket["close-candidate"] ?? []),
    ].join("\n")
    fs.writeFileSync(path.join(OUT, "report.md"), md)
    console.log(`Wrote report.html, ranked.json, ranked.csv, report.md to ${OUT}`)
    if (unjudged) console.log(`${unjudged} PRs lack judgments (heuristic severity used)`)
    console.log(Object.entries(byBucket).map(([b, rs]) => `${b}: ${rs.length}`).join(", "))
}

const commands = { fetch: cmdFetch, digest: cmdDigest, context: cmdContext, rank: cmdRank }
if (!commands[command]) {
    console.error("usage: triage.mjs fetch|digest|context|rank [--out DIR]")
    process.exit(1)
}
commands[command]()

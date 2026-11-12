// Scoring and bucketing for PR triage. Pure functions, no imports: triage.mjs uses this module,
// and report.html inlines its source (with `export` stripped) so the browser ranks exactly as the CLI does.

export const BUCKET_ORDER = [
    "ready-to-merge",
    "quick-win",
    "needs-review",
    "competing",
    "superseded",
    "waiting-on-author",
    "blocked",
    "close-candidate",
]

const clamp = (x) => Math.max(0, Math.min(1, x))
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d

function heuristicSeverity(p, C) {
    const labels = p.labels.join(" ")
    if (/security/.test(labels)) return 5
    if (/regression/.test(labels) || /regression/i.test(p.title)) return 4
    return C.severityByType[p.type] ?? 2
}

function reachScore(p, override, C) {
    const r = C.reach
    const combine = (ws) => clamp(1 - ws.reduce((acc, w) => acc * (1 - w), 1))
    if (override) {
        if (typeof r[override] === "number") return r[override]
        const ds = override.split(",").map((s) => s.trim()).filter((d) => d in r.drivers)
        if (ds.length) return combine(ds.map((d) => r.drivers[d]))
    }
    if (p.scope === "drivers") return combine(p.drivers.map((d) => r.drivers[d] ?? 0.2))
    return r[p.scope] ?? 0.3
}

function trustScore(a, C) {
    if (a.isMaintainer) return 1
    const t = C.trust
    const m = a.merged ?? 0
    let s = m >= 20 ? t.merged20 : m >= 5 ? t.merged5 : m >= 2 ? t.merged2 : m === 1 ? t.merged1 : t.merged0
    // Many open PRs and nothing merged yet: a burst of drive-by PRs
    if (m === 0 && a.openPrs >= t.burstOpenPrs) s = t.burst
    const closed = a.closedUnmerged ?? 0
    if (closed >= 3 && closed > 2 * m) s -= 0.15
    return clamp(s)
}

function score(p, j, C, now) {
    const w = C.weights
    const issueReactions = p.issues.reduce((s, i) => s + i.reactions.positive, 0)
    const issueParticipants = p.issues.reduce((s, i) => s + i.participants, 0)
    const issuePings = p.issues.reduce((s, i) => s + i.pings, 0)
    const demandRaw =
        p.reactions.positive +
        issueReactions +
        w.participantWeight * (issueParticipants + p.communityCommenters) +
        w.pingWeight * (p.pings + issuePings)
    const demand = clamp(Math.log1p(demandRaw) / Math.log1p(w.demandCap))
    const severityRaw = j.severity ?? heuristicSeverity(p, C)
    const severity = (severityRaw - 1) / 4
    const reach = reachScore(p, j.reach, C)
    const sentimentAdj = C.sentiment[j.sentiment ?? "unknown"] ?? 0
    const parts = {
        severity: w.value.severity * severity,
        demand: w.value.demand * demand,
        reach: w.value.reach * reach,
        sentiment: sentimentAdj,
    }
    const value = clamp(parts.severity + parts.demand + parts.reach + parts.sentiment)

    const size = 1 / (1 + p.srcLines / w.sizeHalfPoint)
    const trust = trustScore(p.author, C)
    const ciScore = { SUCCESS: 1, PENDING: 0.6, EXPECTED: 0.6, FAILURE: 0, ERROR: 0 }[p.ci] ?? 0.6
    const mergeScore = { MERGEABLE: 1, UNKNOWN: 0.6, CONFLICTING: 0 }[p.mergeable] ?? 0.6
    const needsTests = ["fix", "feat", "perf"].includes(p.type) && ["core", "drivers", "cli"].includes(p.scope)
    const testsScore = !needsTests || p.hasTests ? 1 : 0
    const readiness = p.review.approvedBy.length
        ? 1
        : (ciScore + mergeScore + testsScore + (p.issues.length ? 1 : 0.5)) / 4
    const ease = clamp(w.ease.size * size + w.ease.readiness * readiness)

    // Track record is its own multiplier, not part of ease: proven contributors are worth reviewing first
    const trackRecord = 1 - w.trackRecordInfluence + w.trackRecordInfluence * trust
    const priority = 100 * value * (1 - w.easeInfluence + w.easeInfluence * ease) * trackRecord

    // Whose move is it?
    const waitingOn = []
    if (p.isDraft) waitingOn.push("draft")
    if (p.mergeable === "CONFLICTING") waitingOn.push("merge conflicts")
    if (p.ci === "FAILURE" || p.ci === "ERROR") waitingOn.push("CI failing")
    if (p.review.changesRequestedUnaddressed) waitingOn.push("changes requested")

    const staleDays = (now - new Date(p.lastHumanActivity)) / 86400000
    let bucket
    if (j.close) bucket = "close-candidate"
    else if (j.sentiment === "blocked") bucket = "blocked"
    else if (waitingOn.length)
        bucket = staleDays > C.staleDays && value < C.closeCandidateMaxValue ? "close-candidate" : "waiting-on-author"
    else if (p.review.approvedBy.length && !p.review.changesRequestedBy.length) bucket = "ready-to-merge"
    else if (ease >= C.quickWin.minEase && p.srcLines <= C.quickWin.maxSrcLines && value >= C.quickWin.minValue)
        bucket = "quick-win"
    else bucket = "needs-review"

    return {
        priority: round(priority, 1),
        bucket,
        waitingOn,
        value: round(value),
        ease: round(ease),
        parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, round(v, 3)])),
        components: {
            severity: severityRaw,
            severitySource: j.severity != null ? "judged" : "heuristic",
            demand: round(demand),
            demandRaw: round(demandRaw, 1),
            reach: round(reach),
            sentiment: j.sentiment ?? null,
            size: round(size),
            trust: round(trust),
            readiness: round(readiness),
            ci: ciScore,
            mergeable: mergeScore,
            tests: testsScore,
        },
        staleDays: Math.round(staleDays),
    }
}

// PR number -> group id; PRs sharing any linked issue are in the same group
function issueGroups(prs) {
    const issueToPrs = new Map()
    for (const p of prs)
        for (const i of p.issues) issueToPrs.set(i.number, [...(issueToPrs.get(i.number) ?? []), p.number])
    const parent = new Map()
    const find = (x) => ((parent.get(x) ?? x) === x ? x : find(parent.get(x)))
    for (const nums of issueToPrs.values()) for (const n of nums.slice(1)) parent.set(find(n), find(nums[0]))
    return new Map(prs.map((p) => [p.number, find(p.number)]))
}

// PRs that fix the same issue compete: each inherits the issue's demand, so without grouping
// one popular issue fills the top of the list. Keep one lead per group; the rest become "competing".
function applyClusters(ranked, groupOf, judgments) {
    const groups = new Map()
    for (const r of ranked) {
        const root = groupOf.get(r.number)
        groups.set(root, [...(groups.get(root) ?? []), r])
    }
    const clusters = []
    for (const members of groups.values()) {
        if (members.length < 2) continue
        const preferred = members.find((m) => judgments[m.number]?.preferred)
        const lead =
            preferred ??
            [...members].sort(
                (a, b) => BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket) || b.priority - a.priority,
            )[0]
        const issues = [...new Set(members.flatMap((m) => m.issues))]
        for (const m of members) {
            m.competing = members.filter((o) => o !== m).map((o) => o.number)
            if (m === lead || m.bucket === "close-candidate") continue
            if (preferred) m.bucket = "superseded"
            else if (["needs-review", "quick-win"].includes(m.bucket)) m.bucket = "competing"
        }
        const allClosing = lead.bucket === "close-candidate"
        clusters.push({
            issues,
            lead: allClosing ? null : lead.number,
            preferredByAgent: !!preferred,
            members: members.map((m) => m.number),
        })
    }
    return clusters.sort((a, b) => b.members.length - a.members.length)
}

// prs: normalized PRs (bots already excluded); judgments: { [number]: {...} }; C: config
export function rankAll(prs, judgments, C, now = Date.now()) {
    const groupOf = issueGroups(prs)
    // PRs fixing the same issue fix the same problem: give them one severity, the highest judged,
    // so batch-to-batch scoring differences do not decide which competing PR leads
    const groupSeverity = new Map()
    for (const p of prs) {
        const s = judgments[p.number]?.severity
        const g = groupOf.get(p.number)
        if (s != null) groupSeverity.set(g, Math.max(groupSeverity.get(g) ?? 0, s))
    }
    const ranked = prs
        .map((p) => {
            const own = judgments[p.number] ?? {}
            const shared = groupSeverity.get(groupOf.get(p.number))
            const j = shared != null && own.severityLocked !== true ? { ...own, severity: shared } : own
            return {
                number: p.number,
                title: p.title,
                url: p.url,
                author: p.author.login,
                authorMerged: p.author.merged,
                type: p.type,
                scope: p.scope + (p.drivers.length ? `:${p.drivers.join("+")}` : ""),
                srcLines: p.srcLines,
                issues: p.issues.map((i) => i.number),
                summary: j.summary ?? null,
                note: j.note ?? null,
                closeReason: j.close ?? null,
                judged: j.severity != null,
                severityShared: j !== own && shared !== own.severity,
                ...score(p, j, C, now),
            }
        })
        .sort((a, b) => b.priority - a.priority)
    ranked.forEach((r, i) => (r.rank = i + 1))
    const clusters = applyClusters(ranked, groupOf, judgments)
    return { ranked, clusters }
}

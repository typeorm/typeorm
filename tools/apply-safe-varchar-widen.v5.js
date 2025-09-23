const fs = require("fs")
const path = require("path")

const file = path.join(__dirname, "..", "src", "driver", "postgres", "PostgresQueryRunner.ts")
let src = fs.readFileSync(file, "utf8")

// Clean any previous runs from our tool
src = src.replace(/\n\s*\/\/ ---- SAFE VARCHAR WIDEN (?:START|END)[\s\S]*?\/\/ ---- SAFE VARCHAR WIDEN END\s*/gm, "\n")

// --- string/comment-aware scanners for () and {} ---
function scanParamsClose(s, fromParen) {
  let i = fromParen + 1, depth = 1, inS = null, inBlock = false, inLine = false, esc = false
  while (i < s.length) {
    const ch = s[i], prev = s[i - 1]
    if (inLine)  { if (ch === "\n") inLine = false; i++; continue }
    if (inBlock) { if (prev === "*" && ch === "/") inBlock = false; i++; continue }
    if (inS)     { if (!esc && ch === inS) inS = null; esc = !esc && ch === "\\"; i++; continue }
    if (prev === "/" && ch === "/") { inLine = true;  i++; continue }
    if (prev === "/" && ch === "*") { inBlock = true; i++; continue }
    if (ch === "'" || ch === '"' || ch === "`") { inS = ch; i++; continue }
    if (ch === "(") depth++
    else if (ch === ")") { depth--; if (depth === 0) return i }
    i++
  }
  throw new Error("No matching ')' for method parameters")
}
function scanNextBrace(s, from) {
  let i = from, inS = null, inBlock = false, inLine = false, esc = false
  while (i < s.length) {
    const ch = s[i], prev = s[i - 1]
    if (inLine)  { if (ch === "\n") inLine = false; i++; continue }
    if (inBlock) { if (prev === "*" && ch === "/") inBlock = false; i++; continue }
    if (inS)     { if (!esc && ch === inS) inS = null; esc = !esc && ch === "\\"; i++; continue }
    if (prev === "/" && ch === "/") { inLine = true;  i++; continue }
    if (prev === "/" && ch === "*") { inBlock = true; i++; continue }
    if (ch === "'" || ch === '"' || ch === "`") { inS = ch; i++; continue }
    if (ch === "{") return i
    i++
  }
  throw new Error("No method body '{'")
}
function matchBraceClose(s, open) {
  let i = open + 1, depth = 1, inS = null, inBlock = false, inLine = false, esc = false
  while (i < s.length) {
    const ch = s[i], prev = s[i - 1]
    if (inLine)  { if (ch === "\n") inLine = false; i++; continue }
    if (inBlock) { if (prev === "*" && ch === "/") inBlock = false; i++; continue }
    if (inS)     { if (!esc && ch === inS) inS = null; esc = !esc && ch === "\\"; i++; continue }
    if (prev === "/" && ch === "/") { inLine = true;  i++; continue }
    if (prev === "/" && ch === "*") { inBlock = true; i++; continue }
    if (ch === "'" || ch === '"' || ch === "`") { inS = ch; i++; continue }
    if (ch === "{") depth++
    else if (ch === "}") { depth--; if (depth === 0) return i }
    i++
  }
  throw new Error("No matching '}' for method body")
}
function findMethod(source, className, methodName) {
  const cls = source.indexOf(`export class ${className}`)
  if (cls < 0) throw new Error(`${className} not found`)
  const start = source.indexOf(`async ${methodName}(`, cls)
  if (start < 0) return null
  const paren = source.indexOf("(", start)
  const paramsClose = scanParamsClose(source, paren)
  const open = scanNextBrace(source, paramsClose + 1)
  const close = matchBraceClose(source, open)
  const nextLineStart = source.indexOf("\n", open) + 1
  const indent = (source.slice(nextLineStart).match(/^\s*/) || ["    "])[0]
  return { open, bodyStart: open + 1, bodyEnd: close - 1, indent }
}

// Insert BEFORE the first `if (!oldColumn)` in changeColumn(...)
{
  const m = findMethod(src, "PostgresQueryRunner", "changeColumn")
  if (!m) throw new Error("changeColumn(...) not found")

  const needle = "if (!oldColumn)"
  const anchor = src.indexOf(needle, m.bodyStart)
  if (anchor < 0 || anchor > m.bodyEnd) throw new Error("Could not locate `if (!oldColumn)` guard inside changeColumn(...)")

  const block = `
${m.indent}// ---- SAFE VARCHAR WIDEN START (PostgreSQL: ALTER TYPE, not drop+add) ----
${m.indent}{ try {
${m.indent}  const toNum = (v: any) => v == null ? null : (/^\\d+$/).test(String(v).trim()) ? parseInt(String(v), 10) : null
${m.indent}  const otype = String((oldColumn as any)?.type ?? '').toLowerCase()
${m.indent}  const ntype = String(((newColumn as any)?.type ?? (oldColumn as any)?.type) ?? '').toLowerCase()
${m.indent}  const isVarOld = otype === 'varchar' || otype === 'character varying'
${m.indent}  const isVarNew = ntype === 'varchar' || ntype === 'character varying'
${m.indent}  const oldLen = toNum((oldColumn as any)?.length)
${m.indent}  const newLen = toNum((newColumn as any)?.length)
${m.indent}  const sameDim = (((newColumn as any)?.isArray) ?? false) === (((oldColumn as any)?.isArray) ?? false)
${m.indent}  if (isVarOld && isVarNew && oldLen !== null && newLen !== null && newLen > oldLen && sameDim) {
${m.indent}    const upType = this.driver.createFullType(newColumn)
${m.indent}    await this.query(\`ALTER TABLE \${this.escapePath(table)} ALTER COLUMN "\${(newColumn as any).name}" TYPE \${upType}\`)
${m.indent}    // update cached table metadata so follow-up ops see the new length
${m.indent}    const cached = table.findColumnByName((newColumn as any).name)
${m.indent}    if (cached) (cached as any).length = (newColumn as any).length
${m.indent}    return
${m.indent}  }
${m.indent}} catch { /* fall back to existing logic */ } }
${m.indent}// ---- SAFE VARCHAR WIDEN END ----
`

  src = src.slice(0, anchor) + block + src.slice(anchor)
}

fs.writeFileSync(file, src, "utf8")
console.log("✅ Inserted SAFE VARCHAR WIDEN fast-path into changeColumn().")

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "driver", "postgres", "PostgresQueryRunner.ts");
let src = fs.readFileSync(file, "utf8");

// Remove any previous blocks from our tool
src = src.replace(/\n\s*\/\/ ---- SAFE VARCHAR WIDEN (?:START|REWRITE)[\s\S]*?\/\/ ---- SAFE VARCHAR WIDEN END\s*/gm, "\n");

// --- scanners that respect (), {}, strings and comments ---
function scanParamsClose(source, fromParen) {
  let i = fromParen + 1, depth = 1;
  let inS = null, inBlock = false, inLine = false, esc = false;
  while (i < source.length) {
    const ch = source[i], prev = source[i - 1];
    if (inLine)  { if (ch === "\n") inLine = false; i++; continue; }
    if (inBlock) { if (prev === "*" && ch === "/") inBlock = false; i++; continue; }
    if (inS) { if (!esc && ch === inS) inS = null; esc = !esc && ch === "\\"; i++; continue; }
    if (prev === "/" && ch === "/") { inLine = true;  i++; continue; }
    if (prev === "/" && ch === "*") { inBlock = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { inS = ch; i++; continue; }
    if (ch === "(") depth++;
    else if (ch === ")") { depth--; if (depth === 0) return i; }
    i++;
  }
  throw new Error("Could not find matching ')' for method parameters");
}
function scanNextBrace(source, fromIndex) {
  let i = fromIndex;
  let inS = null, inBlock = false, inLine = false, esc = false;
  while (i < source.length) {
    const ch = source[i], prev = source[i - 1];
    if (inLine)  { if (ch === "\n") inLine = false; i++; continue; }
    if (inBlock) { if (prev === "*" && ch === "/") inBlock = false; i++; continue; }
    if (inS) { if (!esc && ch === inS) inS = null; esc = !esc && ch === "\\"; i++; continue; }
    if (prev === "/" && ch === "/") { inLine = true;  i++; continue; }
    if (prev === "/" && ch === "*") { inBlock = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { inS = ch; i++; continue; }
    if (ch === "{") return i;
    i++;
  }
  throw new Error("Could not find method body '{'");
}
function matchBraceClose(source, openIndex) {
  let i = openIndex + 1, depth = 1;
  let inS = null, inBlock = false, inLine = false, esc = false;
  while (i < source.length) {
    const ch = source[i], prev = source[i - 1];
    if (inLine)  { if (ch === "\n") inLine = false; i++; continue; }
    if (inBlock) { if (prev === "*" && ch === "/") inBlock = false; i++; continue; }
    if (inS) { if (!esc && ch === inS) inS = null; esc = !esc && ch === "\\"; i++; continue; }
    if (prev === "/" && ch === "/") { inLine = true;  i++; continue; }
    if (prev === "/" && ch === "*") { inBlock = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { inS = ch; i++; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return i; }
    i++;
  }
  throw new Error("Could not find matching '}' for method body");
}
function findMethod(source, className, methodName) {
  const cls = source.indexOf(`export class ${className}`);
  if (cls < 0) throw new Error(`${className} not found`);
  const start = source.indexOf(`async ${methodName}(`, cls);
  if (start < 0) return null;
  const paren = source.indexOf("(", start);
  const paramsClose = scanParamsClose(source, paren);
  const open = scanNextBrace(source, paramsClose + 1);
  const close = matchBraceClose(source, open);
  const nextLineStart = source.indexOf("\n", open) + 1;
  const indent = (source.slice(nextLineStart).match(/^\s*/) || ["    "])[0];
  return { open, bodyStart: open + 1, bodyEnd: close - 1, indent };
}

// Insert AFTER 'newColumn' declaration in changeColumn(...)
function insertAfterNewColumnDecl(source, method) {
  const body = source.slice(method.bodyStart, method.bodyEnd + 1);
  const decl = /\b(?:const|let)\s+newColumn\b[\s\S]*?;/.exec(body);
  if (!decl) throw new Error("'newColumn' declaration not found inside changeColumn(...)");
  const insertAt = method.bodyStart + decl.index + decl[0].length;

  const block = `
${method.indent}// ---- SAFE VARCHAR WIDEN START (PostgreSQL: ALTER TYPE instead of drop+add) ----
${method.indent}{ try {
${method.indent}  const toNum = (v) => (v == null ? null : (/^\\d+$/).test(String(v).trim()) ? parseInt(String(v), 10) : null);
${method.indent}  const _table = InstanceChecker.isTable(tableOrName) ? tableOrName : await this.getTable(tableOrName);
${method.indent}  if (_table && newColumn && oldColumn) {
${method.indent}    const otype = String(oldColumn.type ?? '').toLowerCase();
${method.indent}    const ntype = String((newColumn.type ?? oldColumn.type) ?? '').toLowerCase();
${method.indent}    const isVarOld = otype === 'varchar' || otype === 'character varying';
${method.indent}    const isVarNew = ntype === 'varchar' || ntype === 'character varying';
${method.indent}    const oldLen = toNum(oldColumn.length);
${method.indent}    const newLen = toNum(newColumn.length);
${method.indent}    if (isVarOld && isVarNew && oldLen !== null && newLen !== null && newLen > oldLen && ((newColumn.isArray ?? false) === (oldColumn.isArray ?? false))) {
${method.indent}      const upType = this.driver.createFullType(newColumn);
${method.indent}      await this.query(\`ALTER TABLE \${this.escapePath(_table)} ALTER COLUMN "\${newColumn.name}" TYPE \${upType}\`);
${method.indent}      const cached = _table.findColumnByName(newColumn.name);
${method.indent}      if (cached) cached.length = newColumn.length;
${method.indent}      return; // we handled the change safely
${method.indent}    }
${method.indent}  }
${method.indent}} catch { /* fall back to existing logic */ } }
${method.indent}// ---- SAFE VARCHAR WIDEN END ----
`;
  return source.slice(0, insertAt) + block + source.slice(insertAt);
}

// Insert at the top of changeColumns(...) (bulk), only if *all* are widen-only
function insertBulkAtTop(source, method) {
  const block = `
${method.indent}// ---- SAFE VARCHAR WIDEN START (bulk) ----
${method.indent}{ try {
${method.indent}  const toNum = (v) => (v == null ? null : (/^\\d+$/).test(String(v).trim()) ? parseInt(String(v), 10) : null);
${method.indent}  const _table = InstanceChecker.isTable(tableOrName) ? tableOrName : await this.getTable(tableOrName);
${method.indent}  if (_table && Array.isArray(changedColumns) && changedColumns.length) {
${method.indent}    let allSafe = true;
${method.indent}    for (const { oldColumn, newColumn } of changedColumns) {
${method.indent}      const otype = String(oldColumn.type ?? '').toLowerCase();
${method.indent}      const ntype = String((newColumn.type ?? oldColumn.type) ?? '').toLowerCase();
${method.indent}      const isVarOld = otype === 'varchar' || otype === 'character varying';
${method.indent}      const isVarNew = ntype === 'varchar' || ntype === 'character varying';
${method.indent}      const oldLen = toNum(oldColumn.length);
${method.indent}      const newLen = toNum(newColumn.length);
${method.indent}      if (!(isVarOld && isVarNew && oldLen !== null && newLen !== null && newLen > oldLen && ((newColumn.isArray ?? false) === (oldColumn.isArray ?? false)))) { allSafe = false; break; }
${method.indent}    }
${method.indent}    if (allSafe) {
${method.indent}      for (const { newColumn } of changedColumns) {
${method.indent}        const upType = this.driver.createFullType(newColumn);
${method.indent}        await this.query(\`ALTER TABLE \${this.escapePath(_table)} ALTER COLUMN "\${newColumn.name}" TYPE \${upType}\`);
${method.indent}        const cached = _table.findColumnByName(newColumn.name);
${method.indent}        if (cached) cached.length = newColumn.length;
${method.indent}      }
${method.indent}      return; // early exit for widen-only batch
${method.indent}    }
${method.indent}  }
${method.indent}} catch { /* fall back to existing logic */ } }
${method.indent}// ---- SAFE VARCHAR WIDEN END ----
`;
  return source.slice(0, method.open + 1) + block + source.slice(method.open + 1);
}

{
  const m = findMethod(src, "PostgresQueryRunner", "changeColumn");
  if (!m) throw new Error("changeColumn(...) not found");
  src = insertAfterNewColumnDecl(src, m);
}
{
  const m = findMethod(src, "PostgresQueryRunner", "changeColumns");
  if (!m) throw new Error("changeColumns(...) not found");
  src = insertBulkAtTop(src, m);
}

fs.writeFileSync(file, src, "utf8");
console.log("✅ Inserted SAFE VARCHAR WIDEN fast-paths into changeColumn() and changeColumns().");

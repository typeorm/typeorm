const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "driver", "postgres", "PostgresQueryRunner.ts");
let src = fs.readFileSync(file, "utf8");

// Remove any previous injections from our tool
src = src.replace(/\n\s*\/\/ ---- SAFE VARCHAR WIDEN (?:START|REWRITE)[\s\S]*?\/\/ ---- SAFE VARCHAR WIDEN END\s*/gm, "\n");

// Tiny scanners that respect strings & comments when matching () and {}.
function scanParamsClose(source, fromParen) {
  let i = fromParen + 1, depth = 1;
  let inS = null, inBlock = false, inLine = false, esc = false;
  while (i < source.length) {
    const ch = source[i], prev = source[i - 1];
    if (inLine) { if (ch === "\n") inLine = false; i++; continue; }
    if (inBlock) { if (prev === "*" && ch === "/") inBlock = false; i++; continue; }
    if (inS) { if (!esc && ch === inS) inS = null; esc = !esc && ch === "\\"; i++; continue; }
    if (prev === "/" && ch === "/") { inLine = true; i++; continue; }
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
    if (inLine) { if (ch === "\n") inLine = false; i++; continue; }
    if (inBlock) { if (prev === "*" && ch === "/") inBlock = false; i++; continue; }
    if (inS) { if (!esc && ch === inS) inS = null; esc = !esc && ch === "\\"; i++; continue; }
    if (prev === "/" && ch === "/") { inLine = true; i++; continue; }
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
    if (inLine) { if (ch === "\n") inLine = false; i++; continue; }
    if (inBlock) { if (prev === "*" && ch === "/") inBlock = false; i++; continue; }
    if (inS) { if (!esc && ch === inS) inS = null; esc = !esc && ch === "\\"; i++; continue; }
    if (prev === "/" && ch === "/") { inLine = true; i++; continue; }
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

function insertRewriteBeforeExecute(source, method) {
  const execNeedle = "await this.executeQueries(";
  const execIdx = source.indexOf(execNeedle, method.bodyStart);
  if (execIdx < 0 || execIdx > method.bodyEnd)
    throw new Error("executeQueries(...) call not found inside method body");

  // indentation of the execute line
  const lineStart = source.lastIndexOf("\n", execIdx) + 1;
  const indent = (source.slice(lineStart).match(/^\s*/) || ["    "])[0];

  const lines = [
    "",
    "// ---- SAFE VARCHAR WIDEN REWRITE (convert DROP+ADD to ALTER TYPE) ----",
    "try {",
    "  const toNum = (v) => (v == null ? null : (/^\\d+$/).test(String(v).trim()) ? parseInt(String(v), 10) : null);",
    "  const otype = String((oldColumn && oldColumn.type) ?? \"\").toLowerCase();",
    "  const ntype = String(((newColumn && newColumn.type) ?? (oldColumn && oldColumn.type)) ?? \"\").toLowerCase();",
    "  const isVarOld = otype === \"varchar\" || otype === \"character varying\";",
    "  const isVarNew = ntype === \"varchar\" || ntype === \"character varying\";",
    "  const oldLen = toNum(oldColumn && oldColumn.length);",
    "  const newLen = toNum(newColumn && newColumn.length);",
    "  const sameDim = ((newColumn && newColumn.isArray) ?? false) === ((oldColumn && oldColumn.isArray) ?? false);",
    "  if (isVarOld && isVarNew && oldLen !== null && newLen !== null && newLen > oldLen && sameDim) {",
    "    const table = (typeof tableOrName === \"string\") ? await this.getTable(tableOrName) : tableOrName;",
    "    if (table) {",
    "      const upType   = this.driver.createFullType(newColumn);",
    "      const downType = this.driver.createFullType(oldColumn);",
    "      const nameQ = '\"' + newColumn.name + '\"';",
    "      const dropRe = /\\bdrop\\s+column\\b/i;",
    "      const addRe  = /\\badd\\s+column\\b/i;",
    "      const keepUp   = upQueries.filter(q => !(dropRe.test(q.query) && q.query.includes(nameQ)) && !(addRe.test(q.query) && q.query.includes(nameQ)));",
    "      const keepDown = downQueries.filter(q => !(dropRe.test(q.query) && q.query.includes(nameQ)) && !(addRe.test(q.query) && q.query.includes(nameQ)));",
    "      keepUp.push(new Query(\"ALTER TABLE \" + this.escapePath(table) + \" ALTER COLUMN \" + nameQ + \" TYPE \" + upType));",
    "      keepDown.push(new Query(\"ALTER TABLE \" + this.escapePath(table) + \" ALTER COLUMN \" + nameQ + \" TYPE \" + downType));",
    "      upQueries.length = 0; upQueries.push(...keepUp);",
    "      downQueries.length = 0; downQueries.push(...keepDown);",
    "      const cached = (typeof tableOrName === \"string\" ? table : tableOrName).findColumnByName(newColumn.name);",
    "      if (cached) cached.length = newColumn.length;",
    "    }",
    "  }",
    "} catch { /* fall back to original plan */ }",
    "// ---- SAFE VARCHAR WIDEN END ----",
    ""
  ];
  const block = "\n" + lines.map(l => indent + l).join("\n");
  return source.slice(0, execIdx) + block + source.slice(execIdx);
}

// Patch both changeColumn & changeColumns (bulk), each before their executeQueries call
{
  const m = findMethod(src, "PostgresQueryRunner", "changeColumn");
  if (!m) throw new Error("changeColumn(...) not found");
  src = insertRewriteBeforeExecute(src, m);
}
{
  const m = findMethod(src, "PostgresQueryRunner", "changeColumns");
  if (!m) throw new Error("changeColumns(...) not found");
  src = insertRewriteBeforeExecute(src, m);
}

fs.writeFileSync(file, src, "utf8");
console.log("✅ Inserted SAFE VARCHAR WIDEN rewrite before executeQueries() in changeColumn & changeColumns.");

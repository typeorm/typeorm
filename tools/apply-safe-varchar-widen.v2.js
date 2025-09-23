const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "driver", "postgres", "PostgresQueryRunner.ts");
let src = fs.readFileSync(file, "utf8");

// Remove any previous injections from our tool
src = src.replace(/\n\s*\/\/ ---- SAFE VARCHAR WIDEN START[\s\S]*?\/\/ ---- SAFE VARCHAR WIDEN END\s*/gm, "\n");

// --- tiny scanner helpers: skip strings & comments, match () and {} safely ---
function scanParamsClose(source, fromParen) {
  // fromParen points to '('
  let i = fromParen + 1, depth = 1;
  let inS = null, inBlock = false, inLine = false, esc = false;
  while (i < source.length) {
    const ch = source[i], prev = source[i - 1];

    if (inLine) { if (ch === "\n") inLine = false; i++; continue; }
    if (inBlock) { if (prev === "*" && ch === "/") inBlock = false; i++; continue; }

    if (inS) {
      if (!esc && ch === inS) inS = null;
      esc = !esc && ch === "\\";
      i++; continue;
    }

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

    if (inS) {
      if (!esc && ch === inS) inS = null;
      esc = !esc && ch === "\\";
      i++; continue;
    }

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

    if (inS) {
      if (!esc && ch === inS) inS = null;
      esc = !esc && ch === "\\";
      i++; continue;
    }

    if (prev === "/" && ch === "/") { inLine = true; i++; continue; }
    if (prev === "/" && ch === "*") { inBlock = true; i++; continue; }

    if (ch === "'" || ch === '"' || ch === "`") { inS = ch; i++; continue; }

    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return i; }
    i++;
  }
  throw new Error("Could not find matching '}' for method body");
}

function findMethodBody(source, className, methodName) {
  const cls = source.indexOf(`export class ${className}`);
  if (cls < 0) throw new Error(`${className} not found`);

  const start = source.indexOf(`async ${methodName}(`, cls);
  if (start < 0) return null;

  const paren = source.indexOf("(", start);
  if (paren < 0) throw new Error(`'(' for ${methodName} not found`);
  const paramsClose = scanParamsClose(source, paren);
  const open = scanNextBrace(source, paramsClose + 1);
  const close = matchBraceClose(source, open);

  const nextLineStart = source.indexOf("\n", open) + 1;
  const indent = (source.slice(nextLineStart).match(/^\s*/) || ["    "])[0];
  return { open, bodyStart: open + 1, bodyEnd: close - 1, indent };
}

// --- build the two blocks we’ll inject ---
function buildChangeColumnBlock(indent) {
  const lines = [
    "",
    "// ---- SAFE VARCHAR WIDEN START (PostgreSQL: use ALTER TYPE instead of drop+add) ----",
    "{ try {",
    "  const toNum = (v) => (v == null ? null : (/^\\d+$/).test(String(v).trim()) ? parseInt(String(v), 10) : null);",
    "  const _table = InstanceChecker.isTable(tableOrName) ? tableOrName : await this.getTable(tableOrName);",
    "  if (_table) {",
    "    const _old = InstanceChecker.isTableColumn(oldColumnOrName) ? oldColumnOrName : _table.findColumnByName(oldColumnOrName);",
    "    if (_old) {",
    "      const otype = String(_old.type ?? '').toLowerCase();",
    "      const ntype = String((newColumn.type ?? _old.type) ?? '').toLowerCase();",
    "      const isVarOld = otype === 'varchar' || otype === 'character varying';",
    "      const isVarNew = ntype === 'varchar' || ntype === 'character varying';",
    "      const oldLen = toNum(_old.length);",
    "      const newLen = toNum(newColumn.length);",
    "      if (isVarOld && isVarNew && oldLen !== null && newLen !== null && newLen > oldLen && ((newColumn.isArray ?? false) === (_old.isArray ?? false))) {",
    "        const upType = this.driver.createFullType(newColumn);",
    "        await this.query(`ALTER TABLE ${this.escapePath(_table)} ALTER COLUMN \"${newColumn.name}\" TYPE ${upType}`);",
    "        const cached = _table.findColumnByName(newColumn.name);",
    "        if (cached) cached.length = newColumn.length;",
    "        return; // early exit: handled safely",
    "      }",
    "    }",
    "  }",
    "} catch { /* ignore & fall back to existing logic */ } }",
    "// ---- SAFE VARCHAR WIDEN END ----",
    ""
  ];
  return "\n" + lines.map(l => indent + l).join("\n");
}

function buildChangeColumnsBlock(indent) {
  const lines = [
    "",
    "// ---- SAFE VARCHAR WIDEN START (bulk) ----",
    "{ try {",
    "  const toNum = (v) => (v == null ? null : (/^\\d+$/).test(String(v).trim()) ? parseInt(String(v), 10) : null);",
    "  const _table = InstanceChecker.isTable(tableOrName) ? tableOrName : await this.getTable(tableOrName);",
    "  if (_table) {",
    "    let allSafe = true;",
    "    const pairs = [];",
    "    for (const pair of changedColumns) {",
    "      const _old = pair.oldColumn;",
    "      const _new = pair.newColumn;",
    "      const otype = String(_old.type ?? '').toLowerCase();",
    "      const ntype = String((_new.type ?? _old.type) ?? '').toLowerCase();",
    "      const isVarOld = otype === 'varchar' || otype === 'character varying';",
    "      const isVarNew = ntype === 'varchar' || ntype === 'character varying';",
    "      const oldLen = toNum(_old.length);",
    "      const newLen = toNum(_new.length);",
    "      if (isVarOld && isVarNew && oldLen !== null && newLen !== null && newLen > oldLen && ((_new.isArray ?? false) === (_old.isArray ?? false))) {",
    "        pairs.push({ name: _new.name, newLen: _new.length, upType: this.driver.createFullType(_new) });",
    "      } else { allSafe = false; break; }",
    "    }",
    "    if (allSafe && pairs.length > 0) {",
    "      for (const p of pairs) {",
    "        await this.query(`ALTER TABLE ${this.escapePath(_table)} ALTER COLUMN \"${p.name}\" TYPE ${p.upType}`);",
    "        const cached = _table.findColumnByName(p.name);",
    "        if (cached) cached.length = p.newLen;",
    "      }",
    "      return; // early exit for widen-only",
    "    }",
    "  }",
    "} catch { /* ignore & fall back to existing logic */ } }",
    "// ---- SAFE VARCHAR WIDEN END ----",
    ""
  ];
  return "\n" + lines.map(l => indent + l).join("\n");
}

// Inject into changeColumn
{
  const m = findMethodBody(src, "PostgresQueryRunner", "changeColumn");
  if (!m) throw new Error("changeColumn(...) not found");
  const block = buildChangeColumnBlock(m.indent);
  src = src.slice(0, m.open + 1) + block + src.slice(m.open + 1);
}

// Inject into changeColumns (note: uses param type with `{ ... }[]`, so we must skip to after ')')
{
  const m = findMethodBody(src, "PostgresQueryRunner", "changeColumns");
  if (!m) throw new Error("changeColumns(...) not found");
  const block = buildChangeColumnsBlock(m.indent);
  src = src.slice(0, m.open + 1) + block + src.slice(m.open + 1);
}

fs.writeFileSync(file, src, "utf8");
console.log("✅ Inserted safe varchar widen fast-path into changeColumn() and changeColumns().");

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "driver", "postgres", "PostgresQueryRunner.ts");
let src = fs.readFileSync(file, "utf8");

// Remove any previous injections from our tool
src = src
  .replace(/\n\s*\/\/ ---- SAFE VARCHAR WIDEN START[\s\S]*?\/\/ ---- SAFE VARCHAR WIDEN END\s*/gm, "\n");

// Small helper to find a class method body
function findMethodBody(source, className, methodName) {
  const cls = source.indexOf(`export class ${className}`);
  if (cls < 0) throw new Error(`${className} not found`);
  const m = source.indexOf(`async ${methodName}(`, cls);
  if (m < 0) return null;
  const open = source.indexOf("{", m);
  if (open < 0) throw new Error(`Opening brace for ${methodName} not found`);
  // crude brace matcher
  let i = open + 1, depth = 1;
  while (i < source.length && depth > 0) {
    const ch = source[i++];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  if (depth !== 0) throw new Error(`${methodName} body not properly closed`);
  const bodyStart = open + 1;
  const bodyEnd = i - 1;
  // indentation for next line
  const nextLineStart = source.indexOf("\n", open) + 1;
  const indent = (source.slice(nextLineStart).match(/^\s*/) || ["    "])[0];
  return { start: m, open, bodyStart, bodyEnd, indent };
}

// Build an early-return block that handles only varchar(n) -> varchar(m>n)
function buildChangeColumnBlock(indent) {
  const lines = [
    "",
    "// ---- SAFE VARCHAR WIDEN START (PostgreSQL: use ALTER TYPE instead of drop+add) ----",
    "{ try {",
    "  const toNum = (v: any): number | null => v == null ? null : (/^\\d+$/).test(String(v).trim()) ? parseInt(String(v), 10) : null;",
    "  const _table = InstanceChecker.isTable(tableOrName) ? tableOrName : await this.getTable(tableOrName);",
    "  if (_table) {",
    "    const _old = InstanceChecker.isTableColumn(oldColumnOrName) ? oldColumnOrName : _table.findColumnByName(oldColumnOrName);",
    "    if (_old) {",
    "      const otype = String(_old.type ?? \"\").toLowerCase();",
    "      const ntype = String((newColumn.type ?? _old.type) ?? \"\").toLowerCase();",
    "      const isVarOld = otype === \"varchar\" || otype === \"character varying\";",
    "      const isVarNew = ntype === \"varchar\" || ntype === \"character varying\";",
    "      const oldLen = toNum((_old as any).length);",
    "      const newLen = toNum((newColumn as any).length);",
    "      if (isVarOld && isVarNew && oldLen !== null && newLen !== null && newLen > oldLen && ((newColumn as any).isArray ?? false) === ((_old as any).isArray ?? false)) {",
    "        const upType = this.driver.createFullType(newColumn);",
    "        const sql = \"ALTER TABLE \" + this.escapePath(_table) + \" ALTER COLUMN \\\"\" + newColumn.name + \"\\\" TYPE \" + upType;",
    "        await this.query(sql);",
    "        const cached = _table.findColumnByName(newColumn.name);",
    "        if (cached) (cached as any).length = (newColumn as any).length;",
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

// Similar fast path for the plural form; returns early only when *all* changes are widen-only.
// This avoids interfering with mixed changes (type + nullability, etc.).
function buildChangeColumnsBlock(indent) {
  const lines = [
    "",
    "// ---- SAFE VARCHAR WIDEN START (bulk) ----",
    "{ try {",
    "  const toNum = (v: any): number | null => v == null ? null : (/^\\d+$/).test(String(v).trim()) ? parseInt(String(v), 10) : null;",
    "  const _table = InstanceChecker.isTable(tableOrName) ? tableOrName : await this.getTable(tableOrName);",
    "  if (_table) {",
    "    let allSafe = true;",
    "    const pairs: { name: string; newLen: string | number | undefined; upType: string }[] = [];",
    "    for (const pair of changedColumns) {",
    "      const _old = pair.oldColumn;",
    "      const _new = pair.newColumn;",
    "      const otype = String(_old.type ?? \"\").toLowerCase();",
    "      const ntype = String((_new.type ?? _old.type) ?? \"\").toLowerCase();",
    "      const isVarOld = otype === \"varchar\" || otype === \"character varying\";",
    "      const isVarNew = ntype === \"varchar\" || ntype === \"character varying\";",
    "      const oldLen = toNum((_old as any).length);",
    "      const newLen = toNum((_new as any).length);",
    "      if (isVarOld && isVarNew && oldLen !== null && newLen !== null && newLen > oldLen && ((_new as any).isArray ?? false) === ((_old as any).isArray ?? false)) {",
    "        pairs.push({ name: _new.name, newLen: (_new as any).length, upType: this.driver.createFullType(_new) });",
    "      } else {",
    "        allSafe = false; break;",
    "      }",
    "    }",
    "    if (allSafe && pairs.length > 0) {",
    "      for (const p of pairs) {",
    "        const sql = \"ALTER TABLE \" + this.escapePath(_table) + \" ALTER COLUMN \\\"\" + p.name + \"\\\" TYPE \" + p.upType;",
    "        await this.query(sql);",
    "        const cached = _table.findColumnByName(p.name);",
    "        if (cached) (cached as any).length = p.newLen as any;",
    "      }",
    "      return; // early exit for bulk widen-only",
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

// Inject into changeColumns
{
  const m = findMethodBody(src, "PostgresQueryRunner", "changeColumns");
  if (!m) throw new Error("changeColumns(...) not found");
  const block = buildChangeColumnsBlock(m.indent);
  src = src.slice(0, m.open + 1) + block + src.slice(m.open + 1);
}

fs.writeFileSync(file, src, "utf8");
console.log("✅ Inserted safe varchar widen fast-path into changeColumn() and changeColumns().");

## Root Cause & Fix

The bug is in the `changeColumn()` method across all RDBMS query runners. When column length, precision, or scale changes but the **base type stays the same**, the code unconditionally drops and recreates the column:

```typescript
if (
    oldColumn.type !== newColumn.type ||
    oldColumn.length !== newColumn.length ||  // <-- THIS
    ...
) {
    await this.dropColumn(table, oldColumn)  // DATA LOSS
    await this.addColumn(table, newColumn)
}
```

### The Fix

Separate "same type, different length" from "different type". When only length/precision/scale changes, use the database's native ALTER/MODIFY syntax which preserves data:

**PostgreSQL / CockroachDB / Spanner:**
```sql
ALTER TABLE t ALTER COLUMN col TYPE character varying(51)
```

**MySQL / Aurora MySQL:**
```sql
ALTER TABLE t MODIFY col VARCHAR(51) ...
```

**Oracle:**
```sql
ALTER TABLE t MODIFY (col VARCHAR2(51))
```

### Files Changed (6 drivers)
- `src/driver/postgres/PostgresQueryRunner.ts`
- `src/driver/cockroachdb/CockroachQueryRunner.ts`
- `src/driver/mysql/MysqlQueryRunner.ts`
- `src/driver/aurora-mysql/AuroraMysqlQueryRunner.ts`
- `src/driver/oracle/OracleQueryRunner.ts`
- `src/driver/spanner/SpannerQueryRunner.ts`

**Diff stat:** +111 / -7 across 6 files

The new `else if` branch generates proper up/down queries via `upQueries.push()` / `downQueries.push()`, so migration generation (`migration:generate`) and schema sync both benefit from the fix. The `down` migration correctly reverses by using the old column type string.

The codebase already uses this exact pattern for spatial type changes (e.g. `PostgresQueryRunner.ts` line 2347-2365), confirming this is the intended approach.

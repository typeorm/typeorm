import { mysql } from "./generate/mysql"
import { postgres } from "./generate/postgres"
import { sqlite } from "./generate/sqlite"
import { oracle } from "./generate/oracle"
import { cockroachdb } from "./generate/cockroachdb"
import { mssql } from "./generate/mssql.js"

export const resultsTemplates: Record<string, Record<string, string>> = {
    mysql,
    mariadb: mysql,
    mssql,
    sqlite,
    "better-sqlite3": sqlite,
    postgres,
    oracle,
    cockroachdb,
    libsql: sqlite,
}

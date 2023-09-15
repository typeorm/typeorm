import { mysql } from "./generate/mysql"
import { postgres } from "./generate/postgres"
import { sqlite } from "./generate/sqlite"
import { oracle } from "./generate/oracle"
import { cockroachdb } from "./generate/cockroachdb"

export const resultsTemplates: Record<string, any> = {
    mysql,
    mariadb: mysql,
    sqlite,
    "better-sqlite3": sqlite,
    postgres,
    oracle,
    cockroachdb,
}

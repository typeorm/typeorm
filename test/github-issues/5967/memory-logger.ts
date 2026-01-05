import { Logger } from "../../../src/logger/Logger"

export class MemoryLogger implements Logger {
    constructor(public enabled = true) {}

    private _queries: string[] = []
    get queries() {
        return this._queries
    }

    logQuery(query: string) {
        if (this.enabled) {
            this._queries.push(query)
        }
    }

    logQueryError() {}

    logQuerySlow() {}

    logSchemaBuild() {}

    logMigration() {}

    log() {}

    clear() {
        this._queries = []
    }
}

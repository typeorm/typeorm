import { Statement } from "sqlite3"
import { Readable } from "../../platform/PlatformTools"

/**
 * Provides a readable interface over a SQLite query statement.
 */
export class SqliteQueryStream extends Readable {
    constructor(protected statement: Statement) {
        super({ objectMode: true })
        this.finalizeStatementWhenDone()
    }

    public override _read(): void {
        // SQLite's statement returns one row at a time, so we
        // can just call 'get' each time the stream wants more data.
        this.statement.get((err, row) => {
            if (err) {
                this.destroy(err)
            } else if (row) {
                this.push(row)
            } else {
                this.push(null)
            }
        })
    }

    /**
     * SQLite locks the database while a statement is being executed.
     * To unlock, we need to call finalize when we're done.
     */
    protected finalizeStatementWhenDone(): void {
        const finalize = () => this.statement.finalize()
        this.once("end", finalize)
        this.once("error", finalize)
    }
}

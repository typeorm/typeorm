import { DataSource, FileLogger } from "typeorm"

// Case 1: no options — uses default "ormlogs.log" relative to cwd now
const logger1 = new FileLogger("all")

// Case 2: explicit relative logPath — resolved from cwd now
const logger2 = new FileLogger("all", { logPath: "logs/orm.log" })

// Case 3: logPath starting with "./"
const logger3 = new FileLogger("all", { logPath: "./ormlogs.log" })

// Case 4: absolute logPath — no change needed
const logger4 = new FileLogger("all", { logPath: "/var/log/typeorm.log" })

// Case 5: inside DataSource options
new DataSource({
    type: "postgres",
    logger: new FileLogger("all", { logPath: "db.log" }),
})

// Case 6: path built from path.resolve — user knows what they're doing
import path from "node:path"
const logger6 = new FileLogger("all", {
    logPath: path.resolve(process.cwd(), "orm.log"),
})

// Case 7: class property initializer — should get TODO on the class property
class A {
    logger = new FileLogger("all")
}

// Case 8: export default — should get TODO
export default new FileLogger("all")

// Case 9: quoted-key absolute logPath — should NOT get TODO
const logger9 = new FileLogger("all", { logPath: "/abs.log" })

// Case 10: UNC path — should NOT get TODO
const logger10 = new FileLogger("all", { logPath: "\\\\server\\share\\x.log" })

// Case 11: two FileLoggers in the same statement — should get ONE TODO, not two
const loggers = [new FileLogger("all"), new FileLogger("query")]

// Case 12: dynamic options variable — user knows what they're doing, should NOT get TODO
const opts = { logPath: "logs/orm.log" }
const logger12 = new FileLogger("all", opts)

// Case 13: explicit `undefined` options — same as omitting, should get TODO
const logger13 = new FileLogger("all", undefined)

// Case 14: explicit `null` options — same as omitting, should get TODO
const logger14 = new FileLogger("all", null)

// Case 15: spread with explicit logPath override — should get TODO (logPath is a relative literal)
const extra = { level: "info" }
const logger15 = new FileLogger("all", { ...extra, logPath: "logs/orm.log" })

// Case 16: spread only — opts may contain an absolute logPath, should NOT get TODO
const logger16 = new FileLogger("all", { ...extra })

// Case 17: `logPath: undefined` inside options — same as omitting, should get TODO
const logger17 = new FileLogger("all", { logPath: undefined })

// Case 18: `logPath: null` inside options — same as omitting, should get TODO
const logger18 = new FileLogger("all", { logPath: null })

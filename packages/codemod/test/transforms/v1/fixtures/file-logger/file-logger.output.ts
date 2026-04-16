import { DataSource, FileLogger } from "typeorm"

// Case 1: no options — uses default "ormlogs.log" relative to cwd now
// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger1 = new FileLogger("all")

// Case 2: explicit relative logPath — resolved from cwd now
// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger2 = new FileLogger("all", { logPath: "logs/orm.log" })

// Case 3: logPath starting with "./"
// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger3 = new FileLogger("all", { logPath: "./ormlogs.log" })

// Case 4: absolute logPath — no change needed
const logger4 = new FileLogger("all", { logPath: "/var/log/typeorm.log" })

// Case 5: inside DataSource options
// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
new DataSource({
    type: "postgres",
    logger: new FileLogger("all", { logPath: "db.log" }),
})

// Case 6: path built from path.resolve — user knows what they're doing
import path from "node:path"
const logger6 = new FileLogger("all", {
    logPath: path.resolve(process.cwd(), "orm.log"),
})

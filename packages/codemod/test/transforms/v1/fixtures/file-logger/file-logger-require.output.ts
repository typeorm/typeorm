// CommonJS require — destructured named binding, destructured alias, and
// whole-module binding should all be tracked just like ES imports.
const { FileLogger } = require("typeorm")
const { FileLogger: FL } = require("typeorm")
const typeorm = require("typeorm")

// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger1 = new FileLogger("all")
// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger2 = new FL("all", { logPath: "logs/orm.log" })
// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger3 = new typeorm.FileLogger("all")
const logger4 = new FileLogger("all", { logPath: "/var/log/orm.log" })

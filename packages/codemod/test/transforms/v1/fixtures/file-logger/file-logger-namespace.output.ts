// Namespace import — `FileLogger` is accessed as `typeorm.FileLogger`. The
// transform should follow the namespace binding and still flag usages.
import * as typeorm from "typeorm"

// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger = new typeorm.FileLogger("all")
// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger2 = new typeorm.FileLogger("all", { logPath: "logs/orm.log" })
const logger3 = new typeorm.FileLogger("all", { logPath: "/var/log/orm.log" })

// Aliased import — `FileLogger` is renamed to `FL`. The transform should
// follow the local binding and still flag usages of `new FL(...)`.
import { FileLogger as FL } from "typeorm"

// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger = new FL("all")
// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger2 = new FL("all", { logPath: "logs/orm.log" })
const logger3 = new FL("all", { logPath: "/var/log/orm.log" })

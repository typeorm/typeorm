// Aliased import — `FileLogger` is renamed to `FL`. The transform should
// follow the local binding and still flag usages of `new FL(...)`.
import { FileLogger as FL } from "typeorm"

const logger = new FL("all")
const logger2 = new FL("all", { logPath: "logs/orm.log" })
const logger3 = new FL("all", { logPath: "/var/log/orm.log" })

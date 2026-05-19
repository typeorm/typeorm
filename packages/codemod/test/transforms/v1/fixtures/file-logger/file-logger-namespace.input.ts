// Namespace import — `FileLogger` is accessed as `typeorm.FileLogger`. The
// transform should follow the namespace binding and still flag usages.
import * as typeorm from "typeorm"

const logger = new typeorm.FileLogger("all")
const logger2 = new typeorm.FileLogger("all", { logPath: "logs/orm.log" })
const logger3 = new typeorm.FileLogger("all", { logPath: "/var/log/orm.log" })

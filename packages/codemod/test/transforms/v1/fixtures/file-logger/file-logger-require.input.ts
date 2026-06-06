// CommonJS require — destructured named binding, destructured alias, and
// whole-module binding should all be tracked just like ES imports.
const { FileLogger } = require("typeorm")
const { FileLogger: FL } = require("typeorm")
const typeorm = require("typeorm")

const logger1 = new FileLogger("all")
const logger2 = new FL("all", { logPath: "logs/orm.log" })
const logger3 = new typeorm.FileLogger("all")
const logger4 = new FileLogger("all", { logPath: "/var/log/orm.log" })

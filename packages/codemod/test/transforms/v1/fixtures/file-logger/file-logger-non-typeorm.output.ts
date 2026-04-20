// FileLogger imported from a non-typeorm package — the transform should
// leave this file entirely untouched.
import { FileLogger } from "my-own-logger"

const logger = new FileLogger("all")
const logger2 = new FileLogger("all", { logPath: "logs/orm.log" })

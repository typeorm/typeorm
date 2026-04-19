import { FileLogger, LoggerOptions } from "typeorm"

// Options wrapped in `as LoggerOptions` — the codemod must unwrap the
// TSAsExpression before inspecting the object, otherwise it treats options
// as dynamic and silently skips the non-absolute logPath case.
const logger = new FileLogger("all", {
    logPath: "relative/path.log",
} as LoggerOptions)

const logger2 = new FileLogger("all", {
    logPath: "/absolute/path.log",
} as LoggerOptions)

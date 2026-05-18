import { FileLogger, LoggerOptions } from "typeorm"

// Options wrapped in `as LoggerOptions` — the codemod must unwrap the
// TSAsExpression before inspecting the object, otherwise it treats options
// as dynamic and silently skips the non-absolute logPath case.
// TODO(typeorm-v1): `FileLogger` now resolves `logPath` from `process.cwd()` instead of the app root — use an absolute path if the app is not started from its root folder
const logger = new FileLogger("all", {
    logPath: "relative/path.log",
} as LoggerOptions)

const logger2 = new FileLogger("all", {
    logPath: "/absolute/path.log",
} as LoggerOptions)

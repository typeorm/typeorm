import { run as jscodeshift } from "jscodeshift/src/Runner"
import { colors } from "../lib/colors"
import { createSpinner } from "../lib/spinner"
import { formatTime } from "../lib/format-time"
import { stats } from "../transforms/stats"

export interface TransformError {
    file: string
    message: string
    /** Full stack trace captured from jscodeshift output, if any. */
    stack?: string
}

export interface TransformResult {
    ok: number
    error: number
    skip: number
    nochange: number
    timeElapsed: number
    parseErrors: TransformError[]
    todos: Map<string, string[]>
    applied: Map<string, number>
}

export interface RunTransformsOptions {
    transforms: string[]
    paths: string[]
    dry: boolean
    workers?: number
    ignore?: string[]
}

// Patterns that should never be processed by any codemod transform.
// Ambient declarations (`.d.ts`) describe types consumers rely on — renaming
// identifiers inside them would silently corrupt published types.
const DEFAULT_IGNORE_PATTERNS = ["**/*.d.ts"]

export const runTransforms = async (
    options: RunTransformsOptions,
): Promise<TransformResult> => {
    const { transforms, paths, dry, workers, ignore } = options
    const allTodos = new Map<string, string[]>()
    const allApplied = new Map<string, number>()
    const allParseErrors: TransformError[] = []
    let totalOk = 0
    let totalError = 0
    let totalSkip = 0
    let totalNochange = 0
    let totalTime = 0

    for (const transform of transforms) {
        let fileCount = 0
        let processed = 0
        let startTime = 0
        const spinner = createSpinner("Scanning files...")

        const progressText = () => {
            const elapsed = (Date.now() - startTime) / 1000
            let text = `Processing ${processed}/${fileCount} files... ${colors.dim(formatTime(elapsed))}`
            if (processed > 0 && processed < fileCount) {
                const remaining =
                    (elapsed / processed) * (fileCount - processed)
                text += colors.dim(` (ETA: ${formatTime(remaining)})`)
            }
            return text
        }

        // Intercept stdout to capture jscodeshift progress and transform
        // errors. Stack-trace lines follow each ERR line and don't match the
        // status pattern; attach them to the most recent error so users see
        // why a transform threw instead of just a one-line summary.
        const parseErrors: TransformError[] = []
        let activeError: TransformError | undefined
        const stackBuffer: string[] = []
        const flushStack = () => {
            if (activeError && stackBuffer.length > 0) {
                activeError.stack = stackBuffer.join("").trimEnd()
            }
            activeError = undefined
            stackBuffer.length = 0
        }
        const originalWrite = process.stdout.write.bind(process.stdout)
        process.stdout.write = ((chunk: string | Uint8Array) => {
            const str = typeof chunk === "string" ? chunk : chunk.toString()

            // Capture file count from jscodeshift's "Processing N files..."
            const countMatch = /Processing (\d+) files/.exec(str)
            if (countMatch) {
                fileCount = Number.parseInt(countMatch[1], 10)
                startTime = Date.now()
                spinner.update(`Processing 0/${fileCount} files...`)
                return true
            }

            // Track per-file completion and collect errors
            if (str.includes(" ERR ")) {
                flushStack()
                processed++
                const errMatch =
                    / ERR (.+?) Transformation error \((.+)\)/.exec(str)
                if (errMatch) {
                    activeError = {
                        file: errMatch[1],
                        message: errMatch[2],
                    }
                    parseErrors.push(activeError)
                }
            } else if (
                str.includes(" OKK ") ||
                str.includes(" NOC ") ||
                str.includes(" SKIP ")
            ) {
                flushStack()
                processed++
            } else {
                // Suppress other jscodeshift output, but keep stack-trace
                // lines that follow an ERR so we can surface them later.
                if (activeError) stackBuffer.push(str)
                return false
            }

            spinner.update(progressText)
            return true
        }) as typeof process.stdout.write

        const ignorePattern = [...DEFAULT_IGNORE_PATTERNS, ...(ignore ?? [])]

        let result: Awaited<ReturnType<typeof jscodeshift>>
        try {
            result = await jscodeshift(transform, paths, {
                dry,
                print: false,
                verbose: 2,
                extensions: "ts,tsx,js,jsx",
                parser: "tsx",
                ignorePattern,
                ...(workers !== undefined && { cpus: workers }),
            })
        } catch (err) {
            spinner.stop(
                `${colors.red("✖")} Transform failed: ${err instanceof Error ? err.message : String(err)}`,
            )
            throw err
        } finally {
            flushStack()
            process.stdout.write = originalWrite
        }

        const elapsed = Number.parseFloat(result.timeElapsed)
        const total = result.ok + result.error + result.skip + result.nochange
        const errorSuffix = result.error > 0 ? `, ${result.error} errors` : ""
        spinner.stop(
            `${colors.green("✔")} Changed ${result.ok} out of ${total} files (${formatTime(elapsed)})${errorSuffix}`,
        )

        totalOk += result.ok
        totalError += result.error
        allParseErrors.push(...parseErrors)
        totalSkip += result.skip
        totalNochange += result.nochange
        totalTime += Number.parseFloat(result.timeElapsed)

        for (const [transform, files] of stats.collect.todos(
            result.stats ?? {},
        )) {
            const existing = allTodos.get(transform) ?? []
            existing.push(...files)
            allTodos.set(transform, existing)
        }

        for (const [name, count] of stats.collect.applied(result.stats ?? {})) {
            allApplied.set(name, (allApplied.get(name) ?? 0) + count)
        }
    }

    return {
        ok: totalOk,
        error: totalError,
        skip: totalSkip,
        nochange: totalNochange,
        timeElapsed: totalTime,
        parseErrors: allParseErrors,
        todos: allTodos,
        applied: allApplied,
    }
}

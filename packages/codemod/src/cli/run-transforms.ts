import { run as jscodeshift } from "jscodeshift/src/Runner"
import { colors } from "../lib/colors"
import { createSpinner } from "../lib/spinner"
import { formatTime } from "../lib/format-time"
import { stats } from "../transforms/stats"

export interface TransformResult {
    ok: number
    error: number
    skip: number
    nochange: number
    timeElapsed: number
    parseErrors: { file: string; message: string }[]
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
export const DEFAULT_IGNORE_PATTERNS = ["**/*.d.ts"]

/**
 * Merges user-supplied `--ignore` patterns with the defaults. Defaults are
 * listed first so they apply alongside any user additions.
 */
export const buildIgnorePatterns = (userPatterns?: string[]): string[] => [
    ...DEFAULT_IGNORE_PATTERNS,
    ...(userPatterns ?? []),
]

interface StdoutInterceptor {
    write: typeof process.stdout.write
    parseErrors: { file: string; message: string }[]
    unclassifiedOutput: string[]
    getSuppressedOutputCount: () => number
    getFileCount: () => number
    getProcessed: () => number
}

// Cap on buffered unclassified lines. `printUnclassifiedOutput` already
// slices to the first 20 for display; keeping a slightly larger window
// lets us show both head and tail if we ever want it, while bounding
// memory for noisy transforms that emit thousands of warnings.
const MAX_UNCLASSIFIED_BUFFER = 200

// Matches ` ERR <file> Transformation error (<message>)` lines that
// jscodeshift prints for parse/transform failures. Anything else with
// ` ERR ` is captured as `<unknown>`.
const ERR_LINE = / ERR (.+?) Transformation error \((.+)\)/

// Wires up the stdout interception. Returns the interceptor's collected
// state and the replacement `write` function. The calling code restores
// the original `process.stdout.write` in its `finally`.
const createStdoutInterceptor = (
    onFileCountDetected: (count: number) => void,
    onProcessedIncrement: () => void,
    onProgressTick: () => void,
): StdoutInterceptor => {
    const parseErrors: { file: string; message: string }[] = []
    const unclassifiedOutput: string[] = []
    let suppressedOutputCount = 0
    let fileCount = 0
    let processed = 0

    // `process.stdout.write` has two overloads:
    //   write(chunk, cb?)
    //   write(chunk, encoding, cb?)
    // We classify / buffer and never actually write, so we honor the
    // contract by invoking the callback synchronously with no error and
    // returning `true` (non-buffered). Losing the callback would leave any
    // caller honoring backpressure waiting forever.
    type WriteCallback = (err?: Error | null) => void
    const write = ((
        chunk: string | Uint8Array,
        encodingOrCb?: BufferEncoding | WriteCallback,
        cb?: WriteCallback,
    ) => {
        const str = typeof chunk === "string" ? chunk : chunk.toString()
        const callback = typeof encodingOrCb === "function" ? encodingOrCb : cb
        const done = () => {
            callback?.()
        }

        const countMatch = /Processing (\d+) files/.exec(str)
        if (countMatch) {
            fileCount = Number.parseInt(countMatch[1], 10)
            onFileCountDetected(fileCount)
            done()
            return true
        }

        if (str.includes(" ERR ")) {
            processed++
            onProcessedIncrement()
            const errMatch = ERR_LINE.exec(str)
            parseErrors.push(
                errMatch
                    ? { file: errMatch[1], message: errMatch[2] }
                    : { file: "<unknown>", message: str.trim() },
            )
            onProgressTick()
            done()
            return true
        }

        if (
            str.includes(" OKK ") ||
            str.includes(" NOC ") ||
            str.includes(" SKIP ")
        ) {
            processed++
            onProcessedIncrement()
            onProgressTick()
            done()
            return true
        }

        const trimmed = str.trim()
        if (trimmed.length > 0) {
            if (unclassifiedOutput.length < MAX_UNCLASSIFIED_BUFFER) {
                unclassifiedOutput.push(trimmed)
            } else {
                suppressedOutputCount++
            }
        }
        done()
        return true
    }) as typeof process.stdout.write

    return {
        write,
        parseErrors,
        unclassifiedOutput,
        getSuppressedOutputCount: () => suppressedOutputCount,
        getFileCount: () => fileCount,
        getProcessed: () => processed,
    }
}

// Renders the progress text shown by the spinner while a transform runs.
const buildProgressText = (
    fileCount: number,
    processed: number,
    startTime: number,
): string => {
    const elapsed = (Date.now() - startTime) / 1000
    let text = `Processing ${processed}/${fileCount} files... ${colors.dim(formatTime(elapsed))}`
    if (processed > 0 && processed < fileCount) {
        const remaining = (elapsed / processed) * (fileCount - processed)
        text += colors.dim(` (ETA: ${formatTime(remaining)})`)
    }
    return text
}

// Prints buffered worker output post-run so warnings and stack traces
// aren't silently dropped. Called unconditionally when output is present.
// `suppressedBeyondCap` counts lines that hit MAX_UNCLASSIFIED_BUFFER and
// were dropped before they reached `lines`.
const printUnclassifiedOutput = (
    lines: string[],
    suppressedBeyondCap: number,
    write: (chunk: string) => boolean,
): void => {
    if (lines.length === 0 && suppressedBeyondCap === 0) return
    write(
        `${colors.yellow("!")} Unclassified worker output (possible warnings or stack traces):\n`,
    )
    for (const line of lines.slice(0, 20)) {
        write(`  ${line}\n`)
    }
    const bufferedSuppressed = Math.max(0, lines.length - 20)
    const totalSuppressed = bufferedSuppressed + suppressedBeyondCap
    if (totalSuppressed > 0) {
        write(`  ... (${totalSuppressed} more lines suppressed)\n`)
    }
}

// Runs a single transform and reports the per-transform result.
const runOneTransform = async (
    transform: string,
    paths: string[],
    dry: boolean,
    workers: number | undefined,
    ignore: string[] | undefined,
): Promise<{
    result: Awaited<ReturnType<typeof jscodeshift>>
    parseErrors: { file: string; message: string }[]
}> => {
    const spinner = createSpinner("Scanning files...")
    let startTime = 0

    const interceptor = createStdoutInterceptor(
        (count) => {
            startTime = Date.now()
            spinner.update(`Processing 0/${count} files...`)
        },
        () => {},
        () => {
            spinner.update(() =>
                buildProgressText(
                    interceptor.getFileCount(),
                    interceptor.getProcessed(),
                    startTime,
                ),
            )
        },
    )

    const originalWrite = process.stdout.write.bind(process.stdout)
    process.stdout.write = interceptor.write

    let result: Awaited<ReturnType<typeof jscodeshift>>
    try {
        result = await jscodeshift(transform, paths, {
            dry,
            print: false,
            verbose: 2,
            extensions: "ts,tsx,js,jsx",
            parser: "tsx",
            ignorePattern: buildIgnorePatterns(ignore),
            ...(workers !== undefined && { cpus: workers }),
        })
    } catch (err) {
        spinner.stop(
            `${colors.red("✖")} Transform failed: ${err instanceof Error ? err.message : String(err)}`,
        )
        // Restore stdout first so worker warnings/stack traces that were
        // buffered during the run are printed against the real terminal
        // instead of being re-captured by the interceptor. Guard the print
        // in try/catch: a best-effort diagnostic must never mask the
        // original transform error.
        process.stdout.write = originalWrite
        try {
            printUnclassifiedOutput(
                interceptor.unclassifiedOutput,
                interceptor.getSuppressedOutputCount(),
                originalWrite,
            )
        } catch {
            // Swallow — the original `err` is what the user cares about.
        }
        throw err
    } finally {
        process.stdout.write = originalWrite
    }

    const elapsed = Number.parseFloat(result.timeElapsed)
    const total = result.ok + result.error + result.skip + result.nochange
    const errorSuffix = result.error > 0 ? `, ${result.error} errors` : ""
    spinner.stop(
        `${colors.green("✔")} Changed ${result.ok} out of ${total} files (${formatTime(elapsed)})${errorSuffix}`,
    )

    printUnclassifiedOutput(
        interceptor.unclassifiedOutput,
        interceptor.getSuppressedOutputCount(),
        originalWrite,
    )

    return { result, parseErrors: interceptor.parseErrors }
}

export const runTransforms = async (
    options: RunTransformsOptions,
): Promise<TransformResult> => {
    const { transforms, paths, dry, workers, ignore } = options
    const allTodos = new Map<string, string[]>()
    const allApplied = new Map<string, number>()
    const allParseErrors: { file: string; message: string }[] = []
    let totalOk = 0
    let totalError = 0
    let totalSkip = 0
    let totalNochange = 0
    let totalTime = 0

    for (const transform of transforms) {
        const { result, parseErrors } = await runOneTransform(
            transform,
            paths,
            dry,
            workers,
            ignore,
        )

        totalOk += result.ok
        totalError += result.error
        totalSkip += result.skip
        totalNochange += result.nochange
        totalTime += Number.parseFloat(result.timeElapsed)
        allParseErrors.push(...parseErrors)

        for (const [transformName, files] of stats.collect.todos(
            result.stats ?? {},
        )) {
            const existing = allTodos.get(transformName) ?? []
            existing.push(...files)
            allTodos.set(transformName, existing)
        }

        for (const [statName, count] of stats.collect.applied(
            result.stats ?? {},
        )) {
            allApplied.set(statName, (allApplied.get(statName) ?? 0) + count)
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

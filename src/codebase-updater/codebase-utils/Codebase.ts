import fs from "fs"
import path from "path"
import * as ts from "typescript"
import { determineModuleSystemForFile } from "../../util/ImportUtils"
import { replaceCodeBlankLinesWithComments } from "./replaceCodeBlankLinesWithComments"
import { getRelativeImportPath as getRelativeImportPathUtil } from "./getRelativeImportPath"

export class Codebase {
    public readonly entryFilePath: string

    public readonly program: ts.Program
    public readonly host: ts.CompilerHost
    public readonly checker: ts.TypeChecker

    protected sourceFiles = new Map<string, ts.SourceFile>()
    protected updatedSourceFilePaths = new Set<string>()

    protected transformedFilesMap = new Map<
        string,
        { comment: string; content: string }
    >()

    protected moduleSystem!: "esm" | "commonjs"
    protected initializePromise?: Promise<void>

    public constructor({
        entryFilePath,
        moduleSystem,
    }: {
        entryFilePath: string
        moduleSystem?: "esm" | "commonjs"
    }) {
        this.entryFilePath = entryFilePath

        if (moduleSystem != null) this.moduleSystem = moduleSystem

        const tsconfigPath = ts.findConfigFile(entryFilePath, ts.sys.fileExists)
        const tsconfig =
            tsconfigPath != null
                ? ts.readJsonConfigFile(tsconfigPath, ts.sys.readFile)
                : {}

        this.host = ts.createCompilerHost(tsconfig, false)
        this._addHostReadFileMiddleware()

        this.program = ts.createProgram(
            [this.entryFilePath],
            tsconfig,
            this.host,
        )
        this.checker = this.program.getTypeChecker()
    }

    public async initialize(): Promise<this> {
        if (this.initializePromise == null)
            this.initializePromise = (async () => {
                if (this.moduleSystem == null)
                    this.moduleSystem = await determineModuleSystemForFile(
                        this.entryFilePath,
                    )
            })()

        await this.initializePromise

        return this
    }

    public getSourceFile(filePath: string): ts.SourceFile | undefined {
        const absoluteFilePath = path.resolve(filePath)
        let sourceFile = this.sourceFiles.get(absoluteFilePath)
        if (sourceFile == null) {
            sourceFile = this.program.getSourceFile(absoluteFilePath)

            if (sourceFile != null)
                this.sourceFiles.set(absoluteFilePath, sourceFile)
        }

        return sourceFile
    }

    public updateSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
        const absoluteFilePath = path.resolve(sourceFile.fileName)
        this.sourceFiles.set(absoluteFilePath, sourceFile)
        return sourceFile
    }

    public markSourceFileAsUpdated(sourceFile: ts.SourceFile): ts.SourceFile {
        const filePath = path.resolve(sourceFile.fileName)
        this.updatedSourceFilePaths.add(filePath)

        const knownSourceFile = this.getSourceFile(filePath)
        if (knownSourceFile == null) this.sourceFiles.set(filePath, sourceFile)

        return sourceFile
    }

    public getModifiedSourceFiles(): ts.SourceFile[] {
        const res = []

        for (const filePath of this.updatedSourceFilePaths) {
            const sourceFile = this.getSourceFile(filePath)

            if (sourceFile != null) res.push(sourceFile)
        }

        return res
    }

    public getRelativeImportPath(
        containingFilePath: string,
        importedFilePath: string,
    ) {
        return getRelativeImportPathUtil(
            containingFilePath,
            importedFilePath,
            this.moduleSystem,
        )
    }

    public writeChangesToFilesystem(): string[] {
        const writtenFilePaths = []
        const pendingFileWrites: { filePath: string; content: string }[] = []

        this.getSourceFile(this.entryFilePath)
        const transformedEntryFile = this.transformedFilesMap.get(
            path.resolve(this.entryFilePath),
        )
        const entryFileUsesCrlf =
            transformedEntryFile?.content.includes("\r\n") ?? false

        for (const filePath of this.updatedSourceFilePaths) {
            const sourceFile = this.getSourceFile(filePath)
            if (sourceFile == null) return []

            const transformedFile = this.transformedFilesMap.get(filePath)

            const printer = ts.createPrinter({
                newLine:
                    transformedFile == null
                        ? entryFileUsesCrlf
                            ? ts.NewLineKind.CarriageReturnLineFeed
                            : ts.NewLineKind.LineFeed
                        : transformedFile.content.includes("\r\n")
                        ? ts.NewLineKind.CarriageReturnLineFeed
                        : ts.NewLineKind.LineFeed,
                removeComments: false,
            })
            const printFile = ts.createSourceFile(
                path.basename(filePath),
                "",
                ts.ScriptTarget.Latest,
                false,
                ts.ScriptKind.TS,
            )
            const compiledFileContent = printer.printNode(
                ts.EmitHint.Unspecified,
                sourceFile,
                printFile,
            )

            let resultFileContent = compiledFileContent
            if (transformedFile != null) {
                resultFileContent = compiledFileContent
                    .split(transformedFile.comment)
                    .join("") // remove blank-line-preserving comments
            }

            pendingFileWrites.push({
                filePath,
                content: resultFileContent,
            })
        }

        for (const { filePath, content } of pendingFileWrites) {
            fs.writeFileSync(filePath, content, "utf8")

            writtenFilePaths.push(filePath)
        }

        return writtenFilePaths
    }

    private _addHostReadFileMiddleware() {
        const originalHostReadFile = this.host.readFile
        this.host.readFile = (fileName: string) => {
            const absoluteFilePath = path.resolve(fileName)
            const extName = path.extname(absoluteFilePath)

            if (/^\.[cm]?[jt]s$/.test(extName)) {
                // this is needed in order to preserve blank lines after generating the new file from the AST
                const transformedFile = replaceCodeBlankLinesWithComments(
                    fs.readFileSync(absoluteFilePath, "utf8"),
                )
                this.transformedFilesMap.set(absoluteFilePath, transformedFile)

                return transformedFile.content
            }

            return originalHostReadFile.call(this.host, fileName)
        }
    }
}

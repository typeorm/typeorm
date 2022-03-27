import * as fs from "fs"
import * as path from "path"
import * as ts from "typescript"

export function importAndAddItemToInitializerArrayPropertyInFile({
    filePath,
    initializerName,
    initializerPropertyName,
    importedFilePath,
    importedExportName,
    importDefault,
    importType,
    updateOtherRelevantFiles,
    treatImportNamespaceAsList = false,
    exportImportAllFromFileWhenImportingNamespace = true,
}: {
    filePath: string
    initializerName: string
    initializerPropertyName: string
    importedFilePath: string
    importedExportName: string
    importDefault: boolean
    importType: "esm" | "commonjs"
    updateOtherRelevantFiles: boolean
    treatImportNamespaceAsList?: boolean
    exportImportAllFromFileWhenImportingNamespace?: boolean
}): string[] /* returns updated file paths, an empty array means no update was done */ {
    const tsconfigPath = ts.findConfigFile(filePath, ts.sys.fileExists)
    const tsconfig =
        tsconfigPath != null
            ? ts.readJsonConfigFile(tsconfigPath, ts.sys.readFile)
            : {}
    const transformedFileContentMap = new Map<
        string,
        ReturnType<typeof replaceBlankLinesWithComments>
    >()
    const sourceFiles = new Map<string, ts.SourceFile>()
    const updatedSourceFilePaths = new Set<string>()
    const filesToAddImportIn = new Set<string>()
    let importsAdded = false
    let linkingError = false

    const host = ts.createCompilerHost(tsconfig, false)
    const originalHostReadFile = host.readFile
    host.readFile = (fileName: string) => {
        const absoluteFilePath = path.resolve(fileName)
        const extName = path.extname(absoluteFilePath)

        if (/^\.[cm]?[jt]s$/.test(extName)) {
            // this is needed in order to preserve blank lines after generating the new file from the AST
            const transformedFile = replaceBlankLinesWithComments(
                fs.readFileSync(absoluteFilePath, "utf8"),
            )
            transformedFileContentMap.set(absoluteFilePath, transformedFile)

            return transformedFile.content
        }

        return originalHostReadFile.call(host, fileName)
    }

    const program = ts.createProgram([filePath], tsconfig, host)
    const checker = program.getTypeChecker()
    let entrySourceFile = getSourceFile(filePath) as ts.SourceFile

    const importedFileRelativePath = getImportedFileRelativePath()

    const variableDeclarationReplacementMap = new Map<
        ts.VariableDeclaration,
        ts.VariableDeclaration
    >()

    function getImportedFileRelativePath() {
        let relativePath = path.relative(
            path.dirname(filePath),
            importedFilePath,
        )
        if (!relativePath.startsWith(".")) relativePath = "./" + relativePath

        const extName = path.extname(relativePath)

        const changeExtName = (newExt: string) =>
            relativePath.slice(0, -extName.length) + newExt

        if (extName == ".mts") return changeExtName(".mjs")
        else if (extName == ".cts") return changeExtName(".cjs")
        else if (extName == ".ts") {
            if (importType == "esm") return changeExtName(".js")
            else return changeExtName("")
        }

        return relativePath
    }

    function getSourceFile(filePath: string) {
        const absoluteFilePath = path.resolve(filePath)
        let sourceFile = sourceFiles.get(absoluteFilePath)
        if (sourceFile == null) {
            sourceFile = program.getSourceFile(absoluteFilePath)

            if (sourceFile != null)
                sourceFiles.set(absoluteFilePath, sourceFile)
        }

        return sourceFile
    }

    function updateSourceFile(sourceFile: ts.SourceFile) {
        const absoluteFilePath = path.resolve(sourceFile.fileName)
        sourceFiles.set(absoluteFilePath, sourceFile)
    }

    function markSourceFilePathAsUpdated(sourceFilePath: string) {
        const filePath = path.resolve(sourceFilePath)
        updatedSourceFilePaths.add(filePath)
    }

    function addImport(sourceFile: ts.SourceFile) {
        let lastImportStatementIndex = 0
        for (let i = sourceFile.statements.length - 1; i >= 0; i--) {
            const statement = sourceFile.statements[i]

            if (ts.isImportDeclaration(statement)) {
                lastImportStatementIndex = i
                break
            }
        }

        updateSourceFile(
            ts.factory.updateSourceFile(sourceFile, [
                ...sourceFile.statements.slice(0, lastImportStatementIndex + 1),
                ts.factory.createImportDeclaration(
                    undefined,
                    undefined,
                    importDefault
                        ? ts.factory.createImportClause(
                              false,
                              ts.factory.createIdentifier(importedExportName),
                              undefined,
                          )
                        : ts.factory.createImportClause(
                              false,
                              undefined,
                              ts.factory.createNamedImports([
                                  ts.factory.createImportSpecifier(
                                      false,
                                      undefined,
                                      ts.factory.createIdentifier(
                                          importedExportName,
                                      ),
                                  ),
                              ]),
                          ),
                    ts.factory.createStringLiteral(importedFileRelativePath),
                ),
                ...sourceFile.statements.slice(lastImportStatementIndex + 1),
            ]),
        )
    }

    function addReferenceToListPropertyOnInitializer(
        sourceFile: ts.SourceFile,
    ) {
        let referenceAdded = false

        function findAndUpdateInitializer(
            initializerArgumentsHandler: (
                initializerArguments: ts.NodeArray<ts.Expression>,
            ) => ts.Expression[],
        ) {
            sourceFile = ts.factory.updateSourceFile(
                sourceFile,
                sourceFile.statements.map((statement) => {
                    if (referenceAdded) return statement

                    if (ts.isVariableStatement(statement)) {
                        return ts.factory.updateVariableStatement(
                            statement,
                            statement.modifiers,
                            ts.factory.updateVariableDeclarationList(
                                statement.declarationList,
                                statement.declarationList.declarations
                                    .map((declaration) => {
                                        if (
                                            !referenceAdded &&
                                            ts.isVariableDeclaration(
                                                declaration,
                                            ) &&
                                            declaration.initializer != null &&
                                            ts.isNewExpression(
                                                declaration.initializer,
                                            ) &&
                                            declaration.initializer.arguments !=
                                                null
                                        ) {
                                            return ts.factory.updateVariableDeclaration(
                                                declaration,
                                                declaration.name,
                                                declaration.exclamationToken,
                                                declaration.type,
                                                ts.factory.updateNewExpression(
                                                    declaration.initializer,
                                                    declaration.initializer
                                                        .expression,
                                                    declaration.initializer
                                                        .typeArguments,
                                                    initializerArgumentsHandler(
                                                        declaration.initializer
                                                            .arguments,
                                                    ),
                                                ),
                                            )
                                        }

                                        return declaration
                                    })
                                    .map(updateDeclaration),
                            ),
                        )
                    }

                    if (
                        ts.isExpressionStatement(statement) &&
                        ts.isNewExpression(statement.expression) &&
                        statement.expression.arguments != null &&
                        ts.isIdentifier(statement.expression.expression) &&
                        statement.expression.expression.getText() ===
                            initializerName
                    ) {
                        return ts.factory.updateExpressionStatement(
                            statement,
                            ts.factory.updateNewExpression(
                                statement.expression,
                                statement.expression.expression,
                                statement.expression.typeArguments,
                                initializerArgumentsHandler(
                                    statement.expression.arguments,
                                ),
                            ),
                        )
                    }

                    if (
                        ts.isExportAssignment(statement) &&
                        ts.isNewExpression(statement.expression) &&
                        statement.expression.arguments != null &&
                        ts.isIdentifier(statement.expression.expression) &&
                        statement.expression.expression.getText() ===
                            initializerName
                    ) {
                        return ts.factory.updateExportAssignment(
                            statement,
                            statement.decorators,
                            statement.modifiers,
                            ts.factory.updateNewExpression(
                                statement.expression,
                                statement.expression.expression,
                                statement.expression.typeArguments,
                                initializerArgumentsHandler(
                                    statement.expression.arguments,
                                ),
                            ),
                        )
                    }

                    return statement
                }),
            )
        }

        function addToExistingInitializerArgumentsProperty(
            initializerArguments: ts.NodeArray<ts.Expression>,
        ): ts.Expression[] {
            return initializerArguments.map((argument, index) => {
                if (index > 0) return argument

                if (ts.isObjectLiteralExpression(argument)) {
                    return ts.factory.updateObjectLiteralExpression(
                        argument,
                        argument.properties.map((property) => {
                            if (
                                ts.isPropertyAssignment(property) &&
                                property.name.getText() ===
                                    initializerPropertyName
                            ) {
                                return ts.factory.updatePropertyAssignment(
                                    property,
                                    property.name,
                                    updateExpression(property.initializer),
                                )
                            } else if (
                                ts.isShorthandPropertyAssignment(property) &&
                                property.name.getText() ===
                                    initializerPropertyName
                            ) {
                                const refSymbol = checker.getSymbolAtLocation(
                                    property.name,
                                )

                                if (refSymbol == null) return property

                                const refShorthandSymbol =
                                    checker.getShorthandAssignmentValueSymbol(
                                        refSymbol.valueDeclaration,
                                    )

                                if (
                                    refShorthandSymbol == null ||
                                    refShorthandSymbol.declarations == null
                                )
                                    return property

                                for (const declaration of refShorthandSymbol.declarations)
                                    handleDeclaration(declaration)
                            }

                            return property
                        }),
                    )
                }

                return argument
            })
        }

        function addNewInitializerArgumentsProperty(
            initializerArguments: ts.NodeArray<ts.Expression>,
        ): ts.Expression[] {
            if (initializerArguments.length === 0) {
                return [
                    ts.factory.createObjectLiteralExpression(
                        [
                            ts.factory.createPropertyAssignment(
                                ts.factory.createIdentifier(
                                    initializerPropertyName,
                                ),
                                updateArrayLiteralExpression(
                                    ts.factory.createArrayLiteralExpression(
                                        [],
                                        true,
                                    ),
                                    sourceFile,
                                ),
                            ),
                        ],
                        true,
                    ),
                ]
            }

            return initializerArguments.map((argument, index) => {
                if (index > 0) return argument

                if (ts.isObjectLiteralExpression(argument)) {
                    const propertyNameAlreadyExists = argument.properties.some(
                        (property) => {
                            if (
                                ts.isPropertyAssignment(property) &&
                                property.name.getText() ===
                                    initializerPropertyName
                            )
                                return true

                            if (
                                ts.isShorthandPropertyAssignment(property) &&
                                property.name.getText() ===
                                    initializerPropertyName
                            )
                                return true

                            return false
                        },
                    )

                    if (propertyNameAlreadyExists) return argument

                    return ts.factory.updateObjectLiteralExpression(
                        argument,
                        argument.properties.concat([
                            ts.factory.createPropertyAssignment(
                                ts.factory.createIdentifier(
                                    initializerPropertyName,
                                ),
                                updateArrayLiteralExpression(
                                    ts.factory.createArrayLiteralExpression(
                                        [],
                                        true,
                                    ),
                                    sourceFile,
                                ),
                            ),
                        ]),
                    )
                }

                return argument
            })
        }

        function updateExpression(expression: ts.Expression): ts.Expression {
            if (ts.isArrayLiteralExpression(expression))
                return updateArrayLiteralExpression(expression)

            const refSymbol = checker.getSymbolAtLocation(expression)

            if (refSymbol?.declarations == null) return expression

            for (const declaration of refSymbol.declarations)
                handleDeclaration(declaration)

            return expression
        }

        function updateArrayLiteralExpression(
            arrayLiteralExpression: ts.ArrayLiteralExpression,
            sourceFile?: ts.SourceFile,
        ): ts.ArrayLiteralExpression {
            if (sourceFile == null)
                sourceFile = arrayLiteralExpression.getSourceFile()

            if (sourceFile == null) {
                linkingError = true
                return arrayLiteralExpression
            }

            const sourceFilePath = path.resolve(sourceFile.fileName)
            if (
                !updateOtherRelevantFiles &&
                sourceFilePath === path.resolve(entrySourceFile.fileName)
            )
                return arrayLiteralExpression

            const res = ts.factory.updateArrayLiteralExpression(
                arrayLiteralExpression,
                arrayLiteralExpression.elements.concat([
                    ts.factory.createIdentifier(importedExportName),
                ]),
            )

            markSourceFilePathAsUpdated(sourceFilePath)
            filesToAddImportIn.add(sourceFilePath)

            referenceAdded = true

            return res
        }

        function handleDeclaration(declaration: ts.Declaration) {
            if (
                ts.isVariableDeclaration(declaration) &&
                declaration.initializer != null &&
                ts.isArrayLiteralExpression(declaration.initializer)
            ) {
                const newDeclaration = ts.factory.updateVariableDeclaration(
                    declaration,
                    declaration.name,
                    declaration.exclamationToken,
                    declaration.type,
                    updateArrayLiteralExpression(
                        declaration.initializer == null
                            ? ts.factory.createArrayLiteralExpression([], true)
                            : declaration.initializer,
                        declaration.initializer == null
                            ? sourceFile
                            : undefined,
                    ),
                )

                variableDeclarationReplacementMap.set(
                    declaration,
                    newDeclaration,
                )

                markSourceFilePathAsUpdated(
                    path.resolve(declaration.getSourceFile().fileName),
                )
            } else if (ts.isImportSpecifier(declaration)) {
                const declarationNamedImportSymbol =
                    checker.getSymbolAtLocation(declaration.name)

                if (declarationNamedImportSymbol == null) return

                const sourceDeclarationSymbol = checker.getAliasedSymbol(
                    declarationNamedImportSymbol,
                )

                if (
                    sourceDeclarationSymbol == null ||
                    sourceDeclarationSymbol.declarations == null
                )
                    return

                for (const delcaration of sourceDeclarationSymbol.declarations)
                    handleDeclaration(delcaration)
            } else if (
                treatImportNamespaceAsList &&
                ts.isNamespaceImport(declaration)
            ) {
                const declarationNamedImportSymbol =
                    checker.getSymbolAtLocation(declaration.name)

                if (declarationNamedImportSymbol == null) return

                const sourceDeclarationSymbol = checker.getAliasedSymbol(
                    declarationNamedImportSymbol,
                )

                if (
                    sourceDeclarationSymbol.valueDeclaration == null ||
                    !ts.isSourceFile(sourceDeclarationSymbol.valueDeclaration)
                )
                    return

                const referenceSourceFile = getSourceFile(
                    sourceDeclarationSymbol.valueDeclaration.fileName,
                )

                if (referenceSourceFile == null) return

                updateSourceFile(
                    addExportFromImportToSourceFile(referenceSourceFile),
                )
                markSourceFilePathAsUpdated(referenceSourceFile.fileName)
                importsAdded = true
                referenceAdded = true
            }
        }

        function addExportFromImportToSourceFile(
            sourceFile: ts.SourceFile,
        ): ts.SourceFile {
            let lastExportStatementIndex = 0
            for (let i = sourceFile.statements.length - 1; i >= 0; i--) {
                const statement = sourceFile.statements[i]

                if (
                    ts.isExportDeclaration(statement) ||
                    ts.isImportDeclaration(statement)
                ) {
                    lastExportStatementIndex = i
                    break
                }
            }

            return ts.factory.updateSourceFile(sourceFile, [
                ...sourceFile.statements.slice(0, lastExportStatementIndex + 1),
                ts.factory.createExportDeclaration(
                    undefined,
                    undefined,
                    false,
                    exportImportAllFromFileWhenImportingNamespace
                        ? undefined // export * from "./file"
                        : ts.factory.createNamedExports([
                              ts.factory.createExportSpecifier(
                                  false,
                                  importDefault
                                      ? ts.factory.createIdentifier("default") // export { default as Something } from "./file"
                                      : undefined, // export { Something } from "./file"
                                  ts.factory.createIdentifier(
                                      importedExportName,
                                  ),
                              ),
                          ]),
                    ts.factory.createStringLiteral(importedFileRelativePath),
                ),
                ...sourceFile.statements.slice(lastExportStatementIndex + 1),
            ])
        }

        function updateDeclaration(
            declaration: ts.VariableDeclaration,
        ): ts.VariableDeclaration {
            const res = variableDeclarationReplacementMap.get(declaration)

            if (res != null) {
                variableDeclarationReplacementMap.delete(declaration)
                return res
            }

            return declaration
        }

        function updateGlobalDeclarations(sourceFile: ts.SourceFile) {
            updateSourceFile(
                ts.factory.updateSourceFile(
                    sourceFile,
                    sourceFile.statements.map((statement) => {
                        if (ts.isVariableStatement(statement)) {
                            return ts.factory.updateVariableStatement(
                                statement,
                                statement.modifiers,
                                ts.factory.updateVariableDeclarationList(
                                    statement.declarationList,
                                    statement.declarationList.declarations.map(
                                        updateDeclaration,
                                    ),
                                ),
                            )
                        }

                        return statement
                    }),
                ),
            )
        }

        function addToExistingInitializerProperty() {
            findAndUpdateInitializer(addToExistingInitializerArgumentsProperty)
        }

        function createInitializerProperty() {
            findAndUpdateInitializer(addNewInitializerArgumentsProperty)
        }

        addToExistingInitializerProperty()

        if (!referenceAdded) createInitializerProperty()

        updateSourceFile(sourceFile)

        for (const updateSourceFilePath of updatedSourceFilePaths) {
            const sourceFile = getSourceFile(updateSourceFilePath)
            if (sourceFile == null) {
                linkingError = true
                continue
            }

            updateGlobalDeclarations(sourceFile)
        }

        return referenceAdded
    }

    function generateAndUpdateChangedFiles() {
        const updatedFilePathsResult = []
        const fileUpdates: { filePath: string; content: string }[] = []

        for (const filePath of updatedSourceFilePaths) {
            const astSourceFile = getSourceFile(filePath)
            if (astSourceFile == null) {
                linkingError = true
                continue
            }

            const transformedFileContent =
                transformedFileContentMap.get(filePath)
            if (transformedFileContent == null) continue

            const printer = ts.createPrinter({
                newLine: transformedFileContent.content.includes("\r\n")
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
                astSourceFile,
                printFile,
            )

            const transformedFile = transformedFileContentMap.get(filePath)

            if (transformedFile == null) {
                linkingError = true
                continue
            }

            const resultFileContent = compiledFileContent
                .split(transformedFile.comment)
                .join("") // remove blank-line-preserving comments

            fileUpdates.push({
                filePath,
                content: resultFileContent,
            })
        }

        for (const { filePath, content } of fileUpdates) {
            fs.writeFileSync(filePath, content, "utf8")

            updatedFilePathsResult.push(filePath)
        }

        return updatedFilePathsResult
    }

    const referenceAdded =
        addReferenceToListPropertyOnInitializer(entrySourceFile)

    for (const filePath of filesToAddImportIn) {
        const sourceFile = getSourceFile(filePath)
        if (sourceFile == null) {
            linkingError = true
            continue
        }

        addImport(sourceFile)

        importsAdded = true
    }

    if (!referenceAdded || linkingError || !importsAdded) return []

    const updatedFilePathsResult = generateAndUpdateChangedFiles()

    return updatedFilePathsResult
}

function replaceBlankLinesWithComments(fileContent: string): {
    content: string
    comment: string
} {
    const comment = "// blank line " + Math.random()

    if (fileContent.includes(comment))
        return replaceBlankLinesWithComments(fileContent)

    const includesCrlf = fileContent.includes("\r\n")

    if (includesCrlf) fileContent = fileContent.split("\r\n").join("\n")

    return {
        content: fileContent
            .split("\n")
            .map((line) => {
                if (line.trim().length === 0) return comment

                return line
            })
            .join(includesCrlf ? "\r\n" : "\n"),
        comment,
    }
}

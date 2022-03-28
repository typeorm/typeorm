import * as path from "path"
import * as ts from "typescript"
import { Codebase } from "./codebase-utils/Codebase.js"

export class ImportAndAddItemToInitializerArrayPropertyInCodebase {
    public readonly filePath: string
    public readonly initializerName: string
    public readonly initializerPropertyName: string
    public readonly importedFilePath: string
    public readonly importedFileImportName: string
    public readonly importedFileExportName: string
    public readonly importDefault: boolean
    public readonly updateOtherRelevantFiles: boolean
    public readonly treatImportNamespaceAsList: boolean
    public readonly exportImportAllFromFileWhenImportingNamespace: boolean

    private codebase: Codebase
    private referenceAdded: boolean = false
    private importAdded: boolean = false
    private filesToAddImportInFilePaths = new Set<string>()
    private variableDeclarationReplacementMap = new Map<
        ts.VariableDeclaration,
        ts.VariableDeclaration
    >()

    private linkingError: boolean = false

    /**
     * @param {string} filePath - file path of the file to edit
     * @param {string} initializerName - name of the class while its instantiation should be manipulated
     * @param {string} initializerPropertyName - name of the property that should be manipulated
     * @param {string} importedFilePath - file path of the file to import
     * @param {string} importedFileImportName - name of the import to use in the manipulated array
     * @param {undefined | string} importedFileExportName - name of the export from `importedFilePath` file
     * @param {boolean} importDefault - is the export from `importedFilePath` file a default export?
     * @param {undefined | "esm" | "commonjs"} importType - determines whether and `.js` extension should be used in the import, if omitted then it's determined automatically
     * @param {boolean} updateOtherRelevantFiles - should other files other than the `filePath` can be updated if necessary?
     * @param {boolean} treatImportNamespaceAsList - given `import * as value from "./something"` treat `value` as a valid list
     * @param {boolean} exportImportAllFromFileWhenImportingNamespace - in `treatImportNamespaceAsList` case, add `export * from "./importedFilePath` instead of `export { importedFileImportName } from "./importedFilePath`
     */
    public constructor({
        filePath,
        initializerName,
        initializerPropertyName,
        importedFilePath,
        importedFileImportName,
        importedFileExportName,
        importDefault,
        updateOtherRelevantFiles,
        treatImportNamespaceAsList,
        exportImportAllFromFileWhenImportingNamespace,
        moduleSystem,
    }: {
        filePath: string
        initializerName: string
        initializerPropertyName: string
        importedFilePath: string
        importedFileImportName: string
        importedFileExportName: string
        importDefault: boolean
        updateOtherRelevantFiles: boolean
        treatImportNamespaceAsList: boolean
        exportImportAllFromFileWhenImportingNamespace: boolean
        moduleSystem?: "esm" | "commonjs"
    }) {
        this.filePath = filePath
        this.initializerName = initializerName
        this.initializerPropertyName = initializerPropertyName
        this.importedFilePath = importedFilePath
        this.importedFileImportName = importedFileImportName
        this.importedFileExportName = importedFileExportName
        this.importDefault = importDefault
        this.updateOtherRelevantFiles = updateOtherRelevantFiles
        this.treatImportNamespaceAsList = treatImportNamespaceAsList
        this.exportImportAllFromFileWhenImportingNamespace =
            exportImportAllFromFileWhenImportingNamespace

        this.addToExistingInitializerArgumentsPropertyArgumentsHandler =
            this.addToExistingInitializerArgumentsPropertyArgumentsHandler.bind(
                this,
            )
        this.addNewInitializerArgumentsPropertyArgumentsHandler =
            this.addNewInitializerArgumentsPropertyArgumentsHandler.bind(this)
        this.updateDeclaration = this.updateDeclaration.bind(this)

        this.codebase = new Codebase({
            entryFilePath: this.filePath,
            moduleSystem,
        })
    }

    /**
     * @returns {string[]} - list of modified file paths. empty list means no files could be modified.
     */
    public async manipulateCodebase(): Promise<string[]> {
        await this.codebase.initialize()

        let entrySourceFile = this.codebase.getSourceFile(
            this.codebase.entryFilePath,
        ) as ts.SourceFile

        // try to add to existing property
        entrySourceFile = this.findAndUpdateInitializer(
            entrySourceFile,
            this.addToExistingInitializerArgumentsPropertyArgumentsHandler,
        )

        if (!this.referenceAdded)
            // try to add new property
            entrySourceFile = this.findAndUpdateInitializer(
                entrySourceFile,
                this.addNewInitializerArgumentsPropertyArgumentsHandler,
            )

        // updated modified global declarations in files, such as `const value = []`
        this.codebase.updateSourceFile(entrySourceFile)
        for (const sourceFile of this.codebase.getModifiedSourceFiles()) {
            this.codebase.updateSourceFile(
                this.updateGlobalFileDeclarations(sourceFile),
            )
        }

        // add import statement to files that depend on it
        for (const filePath of this.filesToAddImportInFilePaths) {
            const sourceFile = this.codebase.getSourceFile(filePath)
            if (sourceFile == null) {
                this.linkingError = true
                break
            }

            this.codebase.updateSourceFile(
                this.addImportToSourceFile(sourceFile),
            )

            this.importAdded = true
        }

        if (!this.referenceAdded || this.linkingError || !this.importAdded)
            return []

        const updatedFilePaths = this.codebase.writeChangesToFilesystem()

        return updatedFilePaths
    }

    private findAndUpdateInitializer(
        sourceFile: ts.SourceFile,
        initializerArgumentsHandler: (
            initializerArguments: ts.NodeArray<ts.Expression>,
            sourceFile: ts.SourceFile,
        ) => ts.Expression[],
    ) {
        return ts.factory.updateSourceFile(
            sourceFile,
            sourceFile.statements.map((statement) => {
                if (this.referenceAdded) return statement

                // const *something* = new Initializer()
                // export const *something* = new Initializer()
                if (ts.isVariableStatement(statement)) {
                    return ts.factory.updateVariableStatement(
                        statement,
                        statement.modifiers,
                        ts.factory.updateVariableDeclarationList(
                            statement.declarationList,
                            statement.declarationList.declarations
                                .map((declaration) => {
                                    // const something = *new Initializer()*
                                    // export const something = *new Initializer()*
                                    if (
                                        !this.referenceAdded &&
                                        ts.isVariableDeclaration(declaration) &&
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
                                                    sourceFile,
                                                ),
                                            ),
                                        )
                                    }

                                    return declaration
                                })
                                .map(this.updateDeclaration),
                        ),
                    )
                }

                // *new Initializer()*
                if (
                    ts.isExpressionStatement(statement) &&
                    ts.isNewExpression(statement.expression) &&
                    statement.expression.arguments != null &&
                    ts.isIdentifier(statement.expression.expression) &&
                    statement.expression.expression.getText() ===
                        this.initializerName
                ) {
                    return ts.factory.updateExpressionStatement(
                        statement,
                        ts.factory.updateNewExpression(
                            statement.expression,
                            statement.expression.expression,
                            statement.expression.typeArguments,
                            initializerArgumentsHandler(
                                statement.expression.arguments,
                                sourceFile,
                            ),
                        ),
                    )
                }

                // *export default* new Initializer()
                if (
                    ts.isExportAssignment(statement) &&
                    ts.isNewExpression(statement.expression) &&
                    statement.expression.arguments != null &&
                    ts.isIdentifier(statement.expression.expression) &&
                    statement.expression.expression.getText() ===
                        this.initializerName
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
                                sourceFile,
                            ),
                        ),
                    )
                }

                return statement
            }),
        )
    }

    // new Initializer(*{ property: [] }*)
    private addToExistingInitializerArgumentsPropertyArgumentsHandler(
        initializerArguments: ts.NodeArray<ts.Expression>,
        sourceFile: ts.SourceFile,
    ): ts.Expression[] {
        return initializerArguments.map((argument, index) => {
            if (index > 0 || !ts.isObjectLiteralExpression(argument))
                return argument

            return ts.factory.updateObjectLiteralExpression(
                argument,
                argument.properties.map((property) => {
                    if (
                        ts.isPropertyAssignment(property) &&
                        property.name.getText() === this.initializerPropertyName
                    ) {
                        return ts.factory.updatePropertyAssignment(
                            property,
                            property.name,
                            this.updateExpression(
                                property.initializer,
                                sourceFile,
                            ),
                        )
                    } else if (
                        ts.isShorthandPropertyAssignment(property) &&
                        property.name.getText() === this.initializerPropertyName
                    ) {
                        const refSymbol =
                            this.codebase.checker.getSymbolAtLocation(
                                property.name,
                            )

                        if (refSymbol == null) return property

                        const refShorthandSymbol =
                            this.codebase.checker.getShorthandAssignmentValueSymbol(
                                refSymbol.valueDeclaration,
                            )

                        if (
                            refShorthandSymbol == null ||
                            refShorthandSymbol.declarations == null
                        )
                            return property

                        for (const declaration of refShorthandSymbol.declarations)
                            this.handleDeclaration(declaration, sourceFile)
                    }

                    return property
                }),
            )
        })
    }

    // new Initializer(**)
    private addNewInitializerArgumentsPropertyArgumentsHandler(
        initializerArguments: ts.NodeArray<ts.Expression>,
        sourceFile: ts.SourceFile,
    ): ts.Expression[] {
        if (initializerArguments.length === 0) {
            return [
                ts.factory.createObjectLiteralExpression(
                    [
                        ts.factory.createPropertyAssignment(
                            ts.factory.createIdentifier(
                                this.initializerPropertyName,
                            ),
                            this.updateArrayLiteralExpression(
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
            if (index > 0 || !ts.isObjectLiteralExpression(argument))
                return argument

            const propertyNameAlreadyExists = argument.properties.some(
                (property) => {
                    if (
                        ts.isPropertyAssignment(property) &&
                        property.name.getText() === this.initializerPropertyName
                    )
                        return true

                    if (
                        ts.isShorthandPropertyAssignment(property) &&
                        property.name.getText() === this.initializerPropertyName
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
                            this.initializerPropertyName,
                        ),
                        this.updateArrayLiteralExpression(
                            ts.factory.createArrayLiteralExpression([], true),
                            sourceFile,
                        ),
                    ),
                ]),
            )
        })
    }

    // Initializer({property: *value*})
    // Initializer({property: *[]*})
    private updateExpression(
        expression: ts.Expression,
        sourceFile: ts.SourceFile,
    ): ts.Expression {
        // Initializer({property: *[]*})
        if (ts.isArrayLiteralExpression(expression))
            return this.updateArrayLiteralExpression(expression)

        // Initializer({property: *value*})
        // refSymbol is where this variable expression is referencing to
        const refSymbol = this.codebase.checker.getSymbolAtLocation(expression)

        if (refSymbol?.declarations == null) return expression

        for (const declaration of refSymbol.declarations)
            this.handleDeclaration(declaration, sourceFile)

        return expression
    }

    private updateArrayLiteralExpression(
        arrayLiteralExpression: ts.ArrayLiteralExpression,
        sourceFile?: ts.SourceFile,
    ): ts.ArrayLiteralExpression {
        if (sourceFile == null)
            sourceFile = arrayLiteralExpression.getSourceFile()

        if (sourceFile == null) {
            this.linkingError = true
            return arrayLiteralExpression
        }

        const res = ts.factory.updateArrayLiteralExpression(
            arrayLiteralExpression,
            arrayLiteralExpression.elements.concat([
                ts.factory.createIdentifier(this.importedFileImportName),
            ]),
        )

        this.codebase.markSourceFileAsUpdated(sourceFile)
        this.filesToAddImportInFilePaths.add(path.resolve(sourceFile.fileName))

        this.referenceAdded = true

        return res
    }

    private handleDeclaration(
        declaration: ts.Declaration,
        sourceFile: ts.SourceFile,
    ) {
        // *const value = []*
        if (
            ts.isVariableDeclaration(declaration) &&
            declaration.initializer != null &&
            ts.isArrayLiteralExpression(declaration.initializer)
        ) {
            if (
                !this.updateOtherRelevantFiles &&
                path.resolve(sourceFile.fileName) !=
                    path.resolve(this.codebase.entryFilePath)
            )
                return

            const newDeclaration = ts.factory.updateVariableDeclaration(
                declaration,
                declaration.name,
                declaration.exclamationToken,
                declaration.type,
                this.updateArrayLiteralExpression(
                    declaration.initializer == null
                        ? ts.factory.createArrayLiteralExpression([], true)
                        : declaration.initializer,
                    declaration.initializer == null ? sourceFile : undefined,
                ),
            )

            this.variableDeclarationReplacementMap.set(
                declaration,
                newDeclaration,
            )

            this.codebase.markSourceFileAsUpdated(declaration.getSourceFile())
        } else if (
            // *import {value} from "./somewhere"*
            ts.isImportSpecifier(declaration)
        ) {
            const declarationNamedImportSymbol =
                this.codebase.checker.getSymbolAtLocation(declaration.name)

            if (declarationNamedImportSymbol == null) return

            // get the referenced declaration in the imported file
            const sourceDeclarationSymbol =
                this.codebase.checker.getAliasedSymbol(
                    declarationNamedImportSymbol,
                )

            if (
                sourceDeclarationSymbol == null ||
                sourceDeclarationSymbol.declarations == null
            )
                return

            for (const declaration of sourceDeclarationSymbol.declarations)
                this.handleDeclaration(declaration, sourceFile)
        } else if (
            // *import * as value from "./somewhere"*
            this.treatImportNamespaceAsList &&
            ts.isNamespaceImport(declaration)
        ) {
            const declarationNamedImportSymbol =
                this.codebase.checker.getSymbolAtLocation(declaration.name)

            if (declarationNamedImportSymbol == null) return

            const sourceDeclarationSymbol =
                this.codebase.checker.getAliasedSymbol(
                    declarationNamedImportSymbol,
                )

            if (
                sourceDeclarationSymbol.valueDeclaration == null ||
                !ts.isSourceFile(sourceDeclarationSymbol.valueDeclaration)
            )
                return

            // get the latest file version known to the codebase for this imported file
            let referenceSourceFile = this.codebase.getSourceFile(
                sourceDeclarationSymbol.valueDeclaration.fileName,
            )

            if (referenceSourceFile == null) return

            if (
                !this.updateOtherRelevantFiles &&
                path.resolve(referenceSourceFile.fileName) !=
                    path.resolve(this.codebase.entryFilePath)
            )
                return

            referenceSourceFile = this.codebase.updateSourceFile(
                this.addExportFromImportToSourceFile(referenceSourceFile),
            )
            this.codebase.markSourceFileAsUpdated(referenceSourceFile)
            this.importAdded = true
            this.referenceAdded = true
        }
    }

    // export * from "./somewhere"
    // export { Something } from "./somewhere"
    // export { ExportName as ImportName } from "./somewhere"
    private addExportFromImportToSourceFile(
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
                this.exportImportAllFromFileWhenImportingNamespace
                    ? undefined // export * from "./file"
                    : ts.factory.createNamedExports([
                          ts.factory.createExportSpecifier(
                              false,
                              this.importDefault
                                  ? ts.factory.createIdentifier("default") // export { default as Something } from "./file"
                                  : this.importedFileImportName ==
                                        this.importedFileExportName ||
                                    this.importedFileExportName == null
                                  ? undefined // export { Something } from "./file"
                                  : ts.factory.createIdentifier(
                                        // export { ExportName as ImportName } from "./file"
                                        this.importedFileExportName,
                                    ),
                              ts.factory.createIdentifier(
                                  this.importedFileImportName,
                              ),
                          ),
                      ]),
                ts.factory.createStringLiteral(
                    this.codebase.getRelativeImportPath(
                        sourceFile.fileName,
                        this.importedFilePath,
                    ),
                ),
            ),
            ...sourceFile.statements.slice(lastExportStatementIndex + 1),
        ])
    }

    private updateDeclaration(
        declaration: ts.VariableDeclaration,
    ): ts.VariableDeclaration {
        const res = this.variableDeclarationReplacementMap.get(declaration)

        if (res != null) {
            this.variableDeclarationReplacementMap.delete(declaration)
            return res
        }

        return declaration
    }

    private updateGlobalFileDeclarations(
        sourceFile: ts.SourceFile,
    ): ts.SourceFile {
        return ts.factory.updateSourceFile(
            sourceFile,
            sourceFile.statements.map((statement) => {
                if (ts.isVariableStatement(statement)) {
                    return ts.factory.updateVariableStatement(
                        statement,
                        statement.modifiers,
                        ts.factory.updateVariableDeclarationList(
                            statement.declarationList,
                            statement.declarationList.declarations.map(
                                this.updateDeclaration,
                            ),
                        ),
                    )
                }

                return statement
            }),
        )
    }

    // import Something from "./something"
    // import { Something } from "./something"
    // import { ExportName as ImportName } from "./something"
    private addImportToSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
        let lastImportStatementIndex = 0
        for (let i = sourceFile.statements.length - 1; i >= 0; i--) {
            const statement = sourceFile.statements[i]

            if (ts.isImportDeclaration(statement)) {
                lastImportStatementIndex = i
                break
            }
        }

        return ts.factory.updateSourceFile(sourceFile, [
            ...sourceFile.statements.slice(0, lastImportStatementIndex + 1),
            ts.factory.createImportDeclaration(
                undefined,
                undefined,
                this.importDefault
                    ? // import Something from "./something"
                      ts.factory.createImportClause(
                          false,
                          ts.factory.createIdentifier(
                              this.importedFileImportName,
                          ),
                          undefined,
                      )
                    : ts.factory.createImportClause(
                          false,
                          undefined,
                          ts.factory.createNamedImports([
                              ts.factory.createImportSpecifier(
                                  false,
                                  this.importedFileImportName ==
                                      this.importedFileExportName ||
                                      this.importedFileExportName == null
                                      ? undefined // import { Something } from "./something"
                                      : ts.factory.createIdentifier(
                                            // import { ExportName as ImportName } from "./something"
                                            this.importedFileExportName,
                                        ),
                                  ts.factory.createIdentifier(
                                      this.importedFileImportName,
                                  ),
                              ),
                          ]),
                      ),
                ts.factory.createStringLiteral(
                    this.codebase.getRelativeImportPath(
                        sourceFile.fileName,
                        this.importedFilePath,
                    ),
                ),
            ),
            ...sourceFile.statements.slice(lastImportStatementIndex + 1),
        ])
    }
}

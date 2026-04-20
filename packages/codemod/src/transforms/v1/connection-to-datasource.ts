import path from "node:path"
import type {
    API,
    ASTNode,
    FileInfo,
    Identifier,
    ObjectPattern,
} from "jscodeshift"
import {
    expandLocalNamesForImports,
    forEachIdentifierParam,
    getStringValue,
    isIdentifier,
    renameReExportSpecifiers,
    setStringValue,
} from "../ast-helpers"

/**
 * Unwraps common TypeScript expression wrappers (`as`, `!`, parens) around
 * an identifier and returns the identifier's name. Used so accessor-chain
 * tracking also recognizes `(ds as DataSource).manager`, `ds!.manager`, and
 * `(ds).manager` — patterns jscodeshift would otherwise miss because the
 * surface node is a `TSAsExpression` / `TSNonNullExpression` / paren.
 */
const unwrapIdentifierName = (node: ASTNode): string | null => {
    let current: ASTNode = node
    while (true) {
        if (current.type === "Identifier") return current.name
        if (
            current.type === "TSAsExpression" ||
            current.type === "TSNonNullExpression" ||
            current.type === "TSSatisfiesExpression" ||
            current.type === "TSTypeAssertion"
        ) {
            current = current.expression
            continue
        }
        return null
    }
}

export const name = path.basename(__filename, path.extname(__filename))
export const description = "migrate from `Connection` to `DataSource`"

export const connectionToDataSource = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const typeRenames: Record<string, string> = {
        Connection: "DataSource",
        ConnectionOptions: "DataSourceOptions",
        BaseConnectionOptions: "BaseDataSourceOptions",
        MysqlConnectionOptions: "MysqlDataSourceOptions",
        MariaDbConnectionOptions: "MariaDbDataSourceOptions",
        PostgresConnectionOptions: "PostgresDataSourceOptions",
        CockroachConnectionOptions: "CockroachDataSourceOptions",
        SqlServerConnectionOptions: "SqlServerDataSourceOptions",
        OracleConnectionOptions: "OracleDataSourceOptions",
        SqliteConnectionOptions: "BetterSqlite3DataSourceOptions",
        BetterSqlite3ConnectionOptions: "BetterSqlite3DataSourceOptions",
        SapConnectionOptions: "SapDataSourceOptions",
        MongoConnectionOptions: "MongoDataSourceOptions",
        CordovaConnectionOptions: "CordovaDataSourceOptions",
        NativescriptConnectionOptions: "NativescriptDataSourceOptions",
        ReactNativeConnectionOptions: "ReactNativeDataSourceOptions",
        ExpoConnectionOptions: "ExpoDataSourceOptions",
        AuroraMysqlConnectionOptions: "AuroraMysqlDataSourceOptions",
        AuroraPostgresConnectionOptions: "AuroraPostgresDataSourceOptions",
        SpannerConnectionOptions: "SpannerDataSourceOptions",
    }

    const methodRenames: Record<string, string> = {
        connect: "initialize",
        close: "destroy",
    }

    // TypeORM types whose instances had their `.connection` property renamed
    // to `.dataSource` directly.
    const typesWithConnectionProp = new Set([
        "QueryRunner",
        "EntityManager",
        "Repository",
        "TreeRepository",
        "MongoRepository",
        "SelectQueryBuilder",
        "InsertQueryBuilder",
        "UpdateQueryBuilder",
        "DeleteQueryBuilder",
        "SoftDeleteQueryBuilder",
        "RelationQueryBuilder",
        "EntityMetadata",
    ])

    // Metadata types whose v0.3 `.connection` getter was removed entirely in
    // v1 (renamed in #12249). Access now goes through `.entityMetadata.dataSource`
    // — a naive `.dataSource` rewrite would produce invalid code because these
    // classes never exposed a top-level `.dataSource` field.
    const typesWithIndirectDataSource = new Set([
        "ColumnMetadata",
        "IndexMetadata",
    ])

    // Full-path overrides for deep imports where the v1 module also moved
    // to a different directory. The generic last-segment swap below cannot
    // handle these because swapping only the filename leaves the old
    // directory intact (e.g. `typeorm/driver/sqlite/` was removed in v1).
    const deepPathRewrites: Record<string, string> = {
        "typeorm/driver/sqlite/SqliteConnectionOptions":
            "typeorm/driver/better-sqlite3/BetterSqlite3DataSourceOptions",
    }

    const localRenames = new Map<string, string>()
    const typeormPathPrefix = "typeorm/"

    // Returns the rewritten module path for a `typeorm[/...]` import, or the
    // original when no rewrite applies. Consults `deepPathRewrites` first for
    // cross-directory moves, then falls back to swapping the last path
    // segment when it's an exact rename key.
    const rewriteTypeormPath = (source: string): string => {
        if (!source.startsWith(typeormPathPrefix)) return source
        const fullPathRewrite = deepPathRewrites[source]
        if (fullPathRewrite) return fullPathRewrite
        const lastSlash = source.lastIndexOf("/")
        // No slash or trailing slash → no segment to rewrite
        if (lastSlash === -1 || lastSlash === source.length - 1) return source
        const lastSegment = source.slice(lastSlash + 1)
        const renamedSegment = typeRenames[lastSegment]
        if (!renamedSegment) return source
        return source.slice(0, lastSlash + 1) + renamedSegment
    }

    root.find(j.ImportDeclaration).forEach((path) => {
        const source = path.node.source.value
        if (
            typeof source !== "string" ||
            (source !== "typeorm" && !source.startsWith(typeormPathPrefix))
        ) {
            return
        }

        path.node.specifiers?.forEach((spec) => {
            if (
                spec.type !== "ImportSpecifier" ||
                spec.imported.type !== "Identifier"
            ) {
                return
            }
            const oldImported = spec.imported.name
            const newImported = typeRenames[oldImported]
            if (!newImported) return

            const hasAlias =
                spec.local?.type === "Identifier" &&
                spec.local.name !== oldImported

            spec.imported.name = newImported
            // With an alias (`Connection as Foo`), the local binding already
            // points to the renamed import — usages need no rewriting. Without
            // one, propagate the rename to the local binding.
            if (!hasAlias) {
                const localName =
                    spec.local?.type === "Identifier"
                        ? spec.local.name
                        : oldImported
                localRenames.set(localName, newImported)
                if (spec.local?.type === "Identifier") {
                    spec.local.name = newImported
                }
            }
            hasChanges = true
        })

        // Dedupe specifiers that now share the same imported name after the
        // rename — e.g. `import { Connection, DataSource }` would otherwise
        // emit `import { DataSource, DataSource }`. Keep the first occurrence
        // of each imported name and drop subsequent duplicates.
        if (path.node.specifiers) {
            const seen = new Set<string>()
            path.node.specifiers = path.node.specifiers.filter((spec) => {
                if (
                    spec.type !== "ImportSpecifier" ||
                    spec.imported.type !== "Identifier"
                ) {
                    return true
                }
                const key = `${spec.imported.name}::${spec.local?.type === "Identifier" ? spec.local.name : ""}`
                if (seen.has(key)) {
                    hasChanges = true
                    return false
                }
                seen.add(key)
                return true
            })
        }

        const rewritten = rewriteTypeormPath(source)
        if (rewritten !== source) {
            path.node.source.value = rewritten
            hasChanges = true
        }
    })

    // Re-export source paths (`export { X } from "typeorm/driver/..."`)
    // follow the same deep-path rewrite rules as import sources so barrel
    // files that re-export renamed modules end up pointing at the v1 path.
    root.find(j.ExportNamedDeclaration).forEach((exportPath) => {
        const source = exportPath.node.source?.value
        if (typeof source !== "string") return
        const rewritten = rewriteTypeormPath(source)
        if (rewritten !== source) {
            exportPath.node.source!.value = rewritten
            hasChanges = true
        }
    })

    // Rewrite a single `{ X [: Y] }` property in a destructured require of
    // typeorm. Records the local binding in `localRenames` so the shared
    // NewExpression/TSTypeReference rewrite loop below picks it up.
    const rewriteRequireDestructuredProperty = (
        prop: ObjectPattern["properties"][number],
    ): boolean => {
        if (prop.type !== "Property" && prop.type !== "ObjectProperty") {
            return false
        }
        if (prop.key.type !== "Identifier") return false
        const oldImported: string = prop.key.name
        const newName: string | undefined = typeRenames[oldImported]
        if (!newName) return false

        const localName: string =
            prop.value.type === "Identifier" ? prop.value.name : oldImported
        localRenames.set(localName, newName)

        prop.key.name = newName
        if (prop.value.type === "Identifier" && prop.shorthand) {
            prop.value.name = newName
        }
        return true
    }

    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "require" },
    }).forEach((callPath) => {
        const [arg] = callPath.node.arguments
        if (!arg) return
        const source = getStringValue(arg)
        if (
            typeof source !== "string" ||
            (source !== "typeorm" && !source.startsWith(typeormPathPrefix))
        ) {
            return
        }

        const rewrittenSource = rewriteTypeormPath(source)
        if (rewrittenSource !== source) {
            setStringValue(arg, rewrittenSource)
            hasChanges = true
        }

        const parent = callPath.parent.node
        if (parent.type !== "VariableDeclarator") return
        const id = parent.id
        if (id.type !== "ObjectPattern") return

        const pattern: ObjectPattern = id
        for (const prop of pattern.properties) {
            if (rewriteRequireDestructuredProperty(prop)) hasChanges = true
        }
    })

    // Rename re-exports from "typeorm" (e.g. barrel files that do
    // `export { Connection } from "typeorm"`)
    if (renameReExportSpecifiers(root, j, "typeorm", typeRenames)) {
        hasChanges = true
    }

    for (const [oldName, newName] of localRenames) {
        // TSTypeReference (e.g. const x: Connection = ...)
        root.find(j.TSTypeReference, {
            typeName: { name: oldName },
        }).forEach((path) => {
            if (path.node.typeName.type === "Identifier") {
                path.node.typeName.name = newName
                hasChanges = true
            }
        })

        // TSTypeQuery (e.g. const x: typeof Connection = ...)
        root.find(j.TSTypeQuery, {
            exprName: { name: oldName },
        }).forEach((path) => {
            if (path.node.exprName.type === "Identifier") {
                path.node.exprName.name = newName
                hasChanges = true
            }
        })

        // NewExpression (e.g. new Connection(...))
        root.find(j.NewExpression, {
            callee: { type: "Identifier", name: oldName },
        }).forEach((path) => {
            if (path.node.callee.type === "Identifier") {
                path.node.callee.name = newName
                hasChanges = true
            }
        })
    }

    // DataSource-instance class names — used to recognize `new Connection()`
    // / `const x: DataSource = ...` bindings. Must NOT include *Options types
    // (e.g. `MysqlConnectionOptions`) because those are plain value-object
    // shapes whose instances never carry `.connect()` / `.close()` methods,
    // and treating them as DataSource-typed would incorrectly rename methods
    // on parameters typed with those options.
    //
    // Expand to the set of LOCAL bindings — covers aliased ESM imports
    // (`import { Connection as LegacyConn }`) and aliased CJS destructures
    // (`const { Connection: LegacyConn } = require("typeorm")`) so code
    // using the alias still gets `.connect()` → `.initialize()`.
    const connectionTypeNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        new Set(["Connection", "DataSource"]),
    )
    connectionTypeNames.add("Connection")
    connectionTypeNames.add("DataSource")
    const connectionVarNames = new Set<string>()

    root.find(j.VariableDeclarator).forEach((path) => {
        const init = path.node.init
        if (
            init?.type === "NewExpression" &&
            init.callee.type === "Identifier" &&
            connectionTypeNames.has(init.callee.name)
        ) {
            if (path.node.id.type === "Identifier") {
                connectionVarNames.add(path.node.id.name)
            }
        }
    })

    const collectDataSourceTyped = (id: Identifier) => {
        if (!id.name || id.typeAnnotation?.type !== "TSTypeAnnotation") return
        const ann = id.typeAnnotation.typeAnnotation
        if (
            ann.type === "TSTypeReference" &&
            ann.typeName.type === "Identifier" &&
            connectionTypeNames.has(ann.typeName.name)
        ) {
            connectionVarNames.add(id.name)
        }
    }
    root.find(j.VariableDeclarator).forEach((path) => {
        if (isIdentifier(path.node.id)) collectDataSourceTyped(path.node.id)
    })
    forEachIdentifierParam(root, j, collectDataSourceTyped)

    // Rename method calls: .connect() → .initialize(), .close() → .destroy()
    // Only on variables known to be Connection/DataSource instances
    for (const [oldMethod, newMethod] of Object.entries(methodRenames)) {
        root.find(j.CallExpression, {
            callee: {
                type: "MemberExpression",
                property: { name: oldMethod },
            },
        }).forEach((path) => {
            if (
                path.node.callee.type === "MemberExpression" &&
                path.node.callee.property.type === "Identifier"
            ) {
                const objName = unwrapIdentifierName(path.node.callee.object)
                if (objName && connectionVarNames.has(objName)) {
                    path.node.callee.property.name = newMethod
                    hasChanges = true
                }
            }
        })
    }

    // Gate metadata type matches on the actual local bindings imported from
    // typeorm — users sometimes have their own classes named `EntityMetadata`
    // or `ColumnMetadata` and their `.connection` property access must not
    // be rewritten.
    const connectionPropLocalNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        typesWithConnectionProp,
    )
    const indirectDataSourceLocalNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        typesWithIndirectDataSource,
    )

    const connectionPropVarNames = new Set<string>()
    const indirectDataSourceVarNames = new Set<string>()

    const collectTypedIdentifier = (id: Identifier) => {
        if (!id.name || !id.typeAnnotation) return
        if (id.typeAnnotation.type !== "TSTypeAnnotation") return

        const ann = id.typeAnnotation
        if (ann.typeAnnotation.type !== "TSTypeReference") return

        const ref = ann.typeAnnotation
        if (ref.typeName.type !== "Identifier") return

        if (connectionPropLocalNames.has(ref.typeName.name)) {
            connectionPropVarNames.add(id.name)
        } else if (indirectDataSourceLocalNames.has(ref.typeName.name)) {
            indirectDataSourceVarNames.add(id.name)
        }
    }

    root.find(j.VariableDeclarator).forEach((path) => {
        if (isIdentifier(path.node.id)) collectTypedIdentifier(path.node.id)
    })

    forEachIdentifierParam(root, j, collectTypedIdentifier)

    // Track variables assigned from DataSource accessors, so code like
    //   const manager = dataSource.manager
    //   manager.connection.getMetadata(...)
    // gets rewritten without requiring an explicit `: EntityManager`
    // annotation.
    const dataSourceMemberAccessors: Record<string, string> = {
        manager: "EntityManager",
        mongoManager: "EntityManager",
    }
    const dataSourceCallAccessors: Record<string, string> = {
        getRepository: "Repository",
        getTreeRepository: "TreeRepository",
        getMongoRepository: "MongoRepository",
        createQueryRunner: "QueryRunner",
        createQueryBuilder: "SelectQueryBuilder",
    }

    // Returns the TypeORM type that a DataSource accessor chain resolves to
    // (`ds.manager` → "EntityManager", `ds.getRepository(X)` → "Repository"),
    // or null when the initializer isn't a recognized accessor-chain pattern.
    const resolveAccessorChainType = (init: ASTNode): string | null => {
        if (init.type === "MemberExpression") {
            const baseName = unwrapIdentifierName(init.object)
            if (
                !baseName ||
                !connectionVarNames.has(baseName) ||
                init.property.type !== "Identifier"
            ) {
                return null
            }
            return dataSourceMemberAccessors[init.property.name] ?? null
        }
        if (
            init.type === "CallExpression" &&
            init.callee.type === "MemberExpression" &&
            init.callee.property.type === "Identifier"
        ) {
            const baseName = unwrapIdentifierName(init.callee.object)
            if (!baseName || !connectionVarNames.has(baseName)) return null
            return dataSourceCallAccessors[init.callee.property.name] ?? null
        }
        return null
    }

    root.find(j.VariableDeclarator).forEach((path) => {
        if (path.node.id.type !== "Identifier") return
        if (!path.node.init) return

        const typeName = resolveAccessorChainType(path.node.init)
        if (typeName && typesWithConnectionProp.has(typeName)) {
            connectionPropVarNames.add(path.node.id.name)
        }
    })

    // Rename .isConnected → .isInitialized on Connection/DataSource instances
    root.find(j.MemberExpression, {
        property: { name: "isConnected" },
    }).forEach((path) => {
        if (path.node.property.type === "Identifier") {
            const objName = unwrapIdentifierName(path.node.object)
            if (objName && connectionVarNames.has(objName)) {
                path.node.property.name = "isInitialized"
                hasChanges = true
            }
        }
    })

    // Rename .connection → .dataSource on known TypeORM instances.
    // For types without a direct `.dataSource` field (ColumnMetadata /
    // IndexMetadata) the rename goes through `.entityMetadata.dataSource`.
    root.find(j.MemberExpression, {
        property: { name: "connection" },
    }).forEach((path) => {
        if (path.node.property.type !== "Identifier") return
        const objName = unwrapIdentifierName(path.node.object)
        if (!objName) return

        if (connectionPropVarNames.has(objName)) {
            path.node.property.name = "dataSource"
            hasChanges = true
            return
        }

        if (indirectDataSourceVarNames.has(objName)) {
            // `col.connection` → `col.entityMetadata.dataSource`
            path.node.object = j.memberExpression(
                path.node.object,
                j.identifier("entityMetadata"),
            )
            path.node.property.name = "dataSource"
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = connectionToDataSource
export default fn

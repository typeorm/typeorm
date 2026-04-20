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
    getTypeReferenceRootName,
    isIdentifier,
    renameReExportSpecifiers,
    setStringValue,
    unwrapTsExpression,
} from "../ast-helpers"

/**
 * Unwraps common TypeScript expression wrappers around an identifier and
 * returns the identifier's name. Handles `ds as DataSource`, `ds!`,
 * `ds satisfies DataSource`, and the angle-bracket cast `<DataSource>ds`;
 * identifiers reached through these wrappers are tracked alongside bare
 * identifiers so accessor-chain transforms don't miss them.
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
        MariaDbConnectionOptions: "MysqlDataSourceOptions",
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
        // Subscriber event types — all extend BaseEvent which deprecated
        // `connection` in favor of `dataSource`. Covers the usual destructure
        // pattern in subscriber handlers: `const { connection } = event`.
        "BaseEvent",
        "InsertEvent",
        "UpdateEvent",
        "RemoveEvent",
        "SoftRemoveEvent",
        "RecoverEvent",
        "LoadEvent",
        "QueryEvent",
        "TransactionStartEvent",
        "TransactionCommitEvent",
        "TransactionRollbackEvent",
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

    // Driver-specific DataSourceOptions types re-exported from the `typeorm`
    // package index in v1. Users who had deep-path imports
    // (`typeorm/driver/<driver>/<Name>`) can migrate to the shallow index
    // import — shallow is preferred since deep paths are brittle across
    // refactors. The codemod performs the simplification automatically.
    const reExportedDriverOptions = new Set([
        "AuroraMysqlDataSourceOptions",
        "AuroraPostgresDataSourceOptions",
        "BetterSqlite3DataSourceOptions",
        "CapacitorDataSourceOptions",
        "CockroachDataSourceOptions",
        "CordovaDataSourceOptions",
        "ExpoDataSourceOptions",
        "MongoDataSourceOptions",
        "MysqlDataSourceOptions",
        "NativescriptDataSourceOptions",
        "OracleDataSourceOptions",
        "PostgresDataSourceOptions",
        "ReactNativeDataSourceOptions",
        "SapDataSourceOptions",
        "SpannerDataSourceOptions",
        "SqljsDataSourceOptions",
        "SqlServerDataSourceOptions",
    ])

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

        // Collapse deep driver-options imports to the shallow index import
        // when every specifier is now re-exported from the `typeorm`
        // package index. Only fires when ALL specifiers qualify so we don't
        // accidentally lose an unrelated specifier from the deep path.
        const finalSource = path.node.source.value
        if (
            typeof finalSource === "string" &&
            finalSource.startsWith("typeorm/driver/") &&
            (path.node.specifiers?.length ?? 0) > 0 &&
            path.node.specifiers!.every(
                (spec) =>
                    spec.type === "ImportSpecifier" &&
                    spec.imported.type === "Identifier" &&
                    reExportedDriverOptions.has(spec.imported.name),
            )
        ) {
            path.node.source.value = "typeorm"
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

    // Cross-import dedup: the rewrites above can produce two ImportDeclarations
    // that now target the same module with the same specifier (e.g. an
    // existing `import type { BetterSqlite3DataSourceOptions }` plus a
    // newly-renamed `import type { SqliteConnectionOptions }` from the old
    // `sqlite/` path). Drop any later declaration whose (source, specifier
    // set) tuple is already covered by an earlier one.
    const seenImportKeys = new Map<string, unknown>()
    root.find(j.ImportDeclaration).forEach((importPath) => {
        const source = importPath.node.source.value
        if (typeof source !== "string") return
        const isTypeOnly =
            (importPath.node as { importKind?: string }).importKind === "type"
        const specifiers = importPath.node.specifiers ?? []
        const specifierKey = specifiers
            .map((spec) => {
                const specType = (spec as { type: string }).type
                if (specType === "ImportSpecifier") {
                    const s = spec as {
                        imported: { type: string; name?: string }
                        local?: { type: string; name?: string }
                        importKind?: string
                    }
                    const imported =
                        s.imported.type === "Identifier"
                            ? (s.imported.name ?? "")
                            : ""
                    const local =
                        s.local?.type === "Identifier"
                            ? (s.local.name ?? "")
                            : imported
                    // Per-specifier importKind distinguishes
                    // `import { type X }` from `import { X }` — the two
                    // bindings have different runtime semantics and must
                    // not collapse into the same dedup key.
                    const kind = s.importKind === "type" ? "type:" : ""
                    return `named:${kind}${imported}->${local}`
                }
                if (specType === "ImportDefaultSpecifier") {
                    const s = spec as {
                        local?: { type: string; name?: string }
                    }
                    return `default:${s.local?.type === "Identifier" ? (s.local.name ?? "") : ""}`
                }
                if (specType === "ImportNamespaceSpecifier") {
                    const s = spec as {
                        local?: { type: string; name?: string }
                    }
                    return `namespace:${s.local?.type === "Identifier" ? (s.local.name ?? "") : ""}`
                }
                return specType
            })
            .sort()
            .join("|")
        const key = `${isTypeOnly ? "type:" : ""}${source}::${specifierKey}`
        if (seenImportKeys.has(key)) {
            j(importPath).remove()
            hasChanges = true
            return
        }
        seenImportKeys.set(key, importPath.node)
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
    // Only on receivers known to be Connection/DataSource instances —
    // covered after typed-var AND `this.<member>` collection below.
    const renameDataSourceMethods = () => {
        for (const [oldMethod, newMethod] of Object.entries(methodRenames)) {
            root.find(j.CallExpression, {
                callee: {
                    type: "MemberExpression",
                    property: { name: oldMethod },
                },
            }).forEach((path) => {
                if (
                    path.node.callee.type === "MemberExpression" &&
                    path.node.callee.property.type === "Identifier" &&
                    receiverIsIn(
                        path.node.callee.object,
                        connectionVarNames,
                        thisConnectionMembers,
                    )
                ) {
                    path.node.callee.property.name = newMethod
                    hasChanges = true
                }
            })
        }
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
    // Specifically the local names bound to typeorm's `EntityMetadata` —
    // used to gate the constructor-option rewrite below. Alias-aware so
    // `import { EntityMetadata as EM }` is still recognized.
    const entityMetadataLocalNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        new Set(["EntityMetadata"]),
    )

    const connectionPropVarNames = new Set<string>()
    const indirectDataSourceVarNames = new Set<string>()

    // Parallel sets for `this.X` member accesses — class properties and
    // getters whose annotation is a tracked TypeORM type. Keyed by the
    // member name (not prefixed) since the access shape (`this.X`) already
    // signals the lookup side.
    const thisConnectionMembers = new Set<string>()
    const thisConnectionPropMembers = new Set<string>()
    const thisIndirectMembers = new Set<string>()

    const classifyType = (typeName: string): Set<string> | null => {
        if (connectionTypeNames.has(typeName)) return connectionVarNames
        if (connectionPropLocalNames.has(typeName))
            return connectionPropVarNames
        if (indirectDataSourceLocalNames.has(typeName))
            return indirectDataSourceVarNames
        return null
    }
    const classifyThisMemberType = (typeName: string): Set<string> | null => {
        if (connectionTypeNames.has(typeName)) return thisConnectionMembers
        if (connectionPropLocalNames.has(typeName))
            return thisConnectionPropMembers
        if (indirectDataSourceLocalNames.has(typeName))
            return thisIndirectMembers
        return null
    }

    const collectTypedIdentifier = (id: Identifier) => {
        if (!id.name || !id.typeAnnotation) return
        if (id.typeAnnotation.type !== "TSTypeAnnotation") return

        const ann = id.typeAnnotation
        if (ann.typeAnnotation.type !== "TSTypeReference") return

        const ref = ann.typeAnnotation
        if (ref.typeName.type !== "Identifier") return

        const bucket = classifyType(ref.typeName.name)
        if (bucket) bucket.add(id.name)
    }

    root.find(j.VariableDeclarator).forEach((path) => {
        if (isIdentifier(path.node.id)) collectTypedIdentifier(path.node.id)
    })

    forEachIdentifierParam(root, j, collectTypedIdentifier)

    // Class properties with a TypeORM type annotation — e.g.
    //   private readonly tenantConnection: DataSource
    // — register `this.tenantConnection` for rename-side lookup.
    root.find(j.ClassProperty).forEach((path) => {
        const keyNode = path.node.key
        if (keyNode.type !== "Identifier") return
        const ann = (path.node as { typeAnnotation?: ASTNode }).typeAnnotation
        if (!ann || ann.type !== "TSTypeAnnotation") return
        const inner = (ann as { typeAnnotation: ASTNode }).typeAnnotation
        if (inner.type !== "TSTypeReference") return
        const typeName = (inner as { typeName: ASTNode }).typeName
        if (typeName.type !== "Identifier") return
        const bucket = classifyThisMemberType(typeName.name)
        if (bucket) bucket.add(keyNode.name)
    })

    // Constructor parameter properties — `constructor(private readonly x: DataSource)`
    // is a TSParameterProperty whose inner `parameter` is the typed Identifier.
    // These become class fields accessed via `this.x`.
    root.find(j.TSParameterProperty).forEach((path) => {
        const inner = (path.node as { parameter?: ASTNode }).parameter
        if (!inner) return
        const id =
            inner.type === "Identifier"
                ? inner
                : inner.type === "AssignmentPattern" &&
                    (inner as { left: ASTNode }).left.type === "Identifier"
                  ? (inner as { left: Identifier }).left
                  : null
        if (!id) return
        const ann = id.typeAnnotation
        if (!ann || ann.type !== "TSTypeAnnotation") return
        if (ann.typeAnnotation.type !== "TSTypeReference") return
        const ref = ann.typeAnnotation
        if (ref.typeName.type !== "Identifier") return
        const bucket = classifyThisMemberType(ref.typeName.name)
        if (bucket) bucket.add(id.name)
    })

    // Class getters with a return type annotation — e.g.
    //   private get entityManager(): EntityManager { ... }
    // — same `this.X` lookup path.
    root.find(j.ClassMethod).forEach((path) => {
        if (path.node.kind !== "get") return
        const keyNode = path.node.key
        if (keyNode.type !== "Identifier") return
        const rt = (path.node as { returnType?: ASTNode }).returnType
        if (!rt || rt.type !== "TSTypeAnnotation") return
        const inner = (rt as { typeAnnotation: ASTNode }).typeAnnotation
        if (inner.type !== "TSTypeReference") return
        const typeName = (inner as { typeName: ASTNode }).typeName
        if (typeName.type !== "Identifier") return
        const bucket = classifyThisMemberType(typeName.name)
        if (bucket) bucket.add(keyNode.name)
    })

    // Resolves an object-access receiver to the set of known-type names it
    // resolves against. Returns null for receivers we can't classify.
    //   x             → { key: "x", isThisMember: false }
    //   this.x        → { key: "x", isThisMember: true }
    //   (x as T)      → same as x
    //   (this.x as T) → same as this.x
    const resolveReceiver = (
        node: ASTNode,
    ): { key: string; isThisMember: boolean } | null => {
        const direct = unwrapIdentifierName(node)
        if (direct) return { key: direct, isThisMember: false }
        const unwrapped = unwrapTsExpression(node)
        if (
            (unwrapped.type === "MemberExpression" ||
                unwrapped.type === "OptionalMemberExpression") &&
            (unwrapped as { object: ASTNode }).object.type ===
                "ThisExpression" &&
            (unwrapped as { property: ASTNode }).property.type === "Identifier"
        ) {
            const prop = (unwrapped as { property: Identifier }).property
            return { key: prop.name, isThisMember: true }
        }
        return null
    }
    const receiverIsIn = (
        node: ASTNode,
        bare: ReadonlySet<string>,
        thisMember: ReadonlySet<string>,
    ): boolean => {
        const r = resolveReceiver(node)
        if (!r) return false
        return r.isThisMember ? thisMember.has(r.key) : bare.has(r.key)
    }

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

    renameDataSourceMethods()

    // Rename .isConnected → .isInitialized on Connection/DataSource instances
    root.find(j.MemberExpression, {
        property: { name: "isConnected" },
    }).forEach((path) => {
        if (path.node.property.type !== "Identifier") return
        if (
            receiverIsIn(
                path.node.object,
                connectionVarNames,
                thisConnectionMembers,
            )
        ) {
            path.node.property.name = "isInitialized"
            hasChanges = true
        }
    })

    // Rename .connection → .dataSource on known TypeORM instances.
    // For types without a direct `.dataSource` field (ColumnMetadata /
    // IndexMetadata) the rename goes through `.entityMetadata.dataSource`.
    root.find(j.MemberExpression, {
        property: { name: "connection" },
    }).forEach((path) => {
        if (path.node.property.type !== "Identifier") return

        if (
            receiverIsIn(
                path.node.object,
                connectionPropVarNames,
                thisConnectionPropMembers,
            )
        ) {
            path.node.property.name = "dataSource"
            hasChanges = true
            return
        }

        if (
            receiverIsIn(
                path.node.object,
                indirectDataSourceVarNames,
                thisIndirectMembers,
            )
        ) {
            // `col.connection` → `col.entityMetadata.dataSource`
            path.node.object = j.memberExpression(
                path.node.object,
                j.identifier("entityMetadata"),
            )
            path.node.property.name = "dataSource"
            hasChanges = true
        }
    })

    // Destructuring pattern: `const { connection } = event` / `for (const
    // { connection } of events)` where `event`/`events[i]` is a tracked
    // connectionProp receiver (subscriber event, EntityManager, QueryRunner,
    // Repository, etc.). Rename the `connection` key to `dataSource` and
    // preserve the local binding name.
    const renameConnectionInObjectPattern = (id: ASTNode): void => {
        if (id.type !== "ObjectPattern") return
        for (const prop of (id as { properties: ASTNode[] }).properties) {
            if (prop.type !== "Property" && prop.type !== "ObjectProperty")
                continue
            const typed = prop as {
                key: { type: string; name?: string }
                shorthand?: boolean
            }
            if (typed.key.type !== "Identifier") continue
            if (typed.key.name !== "connection") continue
            typed.key.name = "dataSource"
            // Shorthand `{ connection }` expands to `{ dataSource: connection }`
            // to keep the local variable name unchanged — the consumer code
            // still references `connection`.
            if (typed.shorthand) typed.shorthand = false
            hasChanges = true
        }
    }

    root.find(j.VariableDeclarator).forEach((declPath) => {
        const init = declPath.node.init
        if (!init) return
        if (
            !receiverIsIn(
                init,
                connectionPropVarNames,
                thisConnectionPropMembers,
            )
        ) {
            return
        }
        renameConnectionInObjectPattern(declPath.node.id)
    })

    // `for (const { connection } of events)` — `ForOfStatement.left` is a
    // `VariableDeclaration` whose declarators have no `init`, so the
    // plain VariableDeclarator loop above skips them. Classify the loop
    // variable's inferred type: either the iterable variable itself is a
    // tracked receiver, or its declared annotation is `Tracked[]` /
    // `Array<Tracked>`.
    const elementTypeOf = (rhsNode: ASTNode): string | null => {
        if (rhsNode.type !== "Identifier") return null
        const name = rhsNode.name
        let resolved: string | null = null
        root.find(j.VariableDeclarator).forEach((p) => {
            if (resolved) return
            if (p.node.id.type !== "Identifier") return
            if (p.node.id.name !== name) return
            const ann = p.node.id.typeAnnotation as ASTNode | null
            if (!ann || ann.type !== "TSTypeAnnotation") return
            const inner = (ann as { typeAnnotation: ASTNode }).typeAnnotation
            if (inner.type === "TSArrayType") {
                resolved =
                    getTypeReferenceRootName(
                        (inner as { elementType: ASTNode }).elementType,
                    ) ?? null
                return
            }
            if (
                inner.type === "TSTypeReference" &&
                (inner as { typeName: { name?: string } }).typeName?.name ===
                    "Array"
            ) {
                const params = (
                    inner as {
                        typeParameters?: { params?: ASTNode[] }
                    }
                ).typeParameters?.params
                if (params && params.length > 0) {
                    resolved = getTypeReferenceRootName(params[0]) ?? null
                }
            }
        })
        return resolved
    }

    const visitForOf = (
        leftNode: ASTNode | null | undefined,
        rightNode: ASTNode | null | undefined,
    ): void => {
        if (!leftNode || !rightNode) return
        if (leftNode.type !== "VariableDeclaration") return

        // Either: the iterable itself is a tracked receiver (rare but valid
        // — e.g. a generator that yields the receiver), OR its type is an
        // array/`Array<T>` of a tracked type.
        const directlyTracked = receiverIsIn(
            rightNode,
            connectionPropVarNames,
            thisConnectionPropMembers,
        )
        const elementType = elementTypeOf(rightNode)
        const elementTracked =
            elementType !== null && connectionPropLocalNames.has(elementType)

        if (!directlyTracked && !elementTracked) return

        for (const d of (leftNode as { declarations: ASTNode[] })
            .declarations) {
            if (d.type !== "VariableDeclarator") continue
            renameConnectionInObjectPattern((d as { id: ASTNode }).id)
        }
    }
    root.find(j.ForOfStatement).forEach((p) =>
        visitForOf(p.node.left, p.node.right),
    )
    root.find(j.ForInStatement).forEach((p) =>
        visitForOf(p.node.left, p.node.right),
    )

    // Rewrite the `connection` option passed to metadata-type constructors:
    //   - `new EntityMetadata({ connection: X, ... })` → rename key to
    //     `dataSource` (the option was just renamed in v1).
    //   - `new ColumnMetadata({ connection, ... })` / `IndexMetadata` →
    //     drop the `connection` key entirely. These constructors no longer
    //     accept `connection` in v1; the DataSource is reached through
    //     `entityMetadata.dataSource` and is set by the entity-metadata
    //     builder rather than the caller.
    root.find(j.NewExpression).forEach((path) => {
        const callee = path.node.callee
        if (callee.type !== "Identifier") return
        const name = callee.name

        const isEntityMetadata = entityMetadataLocalNames.has(name)
        const isIndirect = indirectDataSourceLocalNames.has(name)
        if (!isEntityMetadata && !isIndirect) return

        const [arg] = path.node.arguments
        if (!arg || arg.type !== "ObjectExpression") return

        if (isEntityMetadata) {
            for (const prop of arg.properties) {
                if (prop.type !== "Property" && prop.type !== "ObjectProperty")
                    continue
                if (prop.key.type !== "Identifier") continue
                if (prop.key.name !== "connection") continue
                prop.key.name = "dataSource"
                // Shorthand `{ connection }` expands to `{ dataSource: connection }`
                // so the variable reference stays intact; clear the shorthand
                // flag to emit the full key:value pair.
                if ((prop as { shorthand?: boolean }).shorthand) {
                    ;(prop as { shorthand?: boolean }).shorthand = false
                }
                hasChanges = true
            }
            return
        }

        // ColumnMetadata / IndexMetadata — `connection` was removed.
        const before = arg.properties.length
        arg.properties = arg.properties.filter((prop) => {
            if (prop.type !== "Property" && prop.type !== "ObjectProperty")
                return true
            if (prop.key.type !== "Identifier") return true
            return prop.key.name !== "connection"
        })
        if (arg.properties.length !== before) hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = connectionToDataSource
export default fn

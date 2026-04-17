import path from "node:path"
import type { API, ASTNode, FileInfo, Identifier } from "jscodeshift"
import { forEachIdentifierParam, isIdentifier } from "../ast-helpers"

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

    // Type/class renames
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

    // Method renames on DataSource/Connection instances
    const methodRenames: Record<string, string> = {
        connect: "initialize",
        close: "destroy",
    }

    // TypeORM types whose instances have a `.connection` property
    // that was renamed to `.dataSource` in v1
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
        // Metadata classes (renamed in #12249)
        "EntityMetadata",
        "ColumnMetadata",
        "IndexMetadata",
    ])

    // Collect local names imported from "typeorm" that need renaming
    const localRenames = new Map<string, string>()
    root.find(j.ImportDeclaration, {
        source: { value: "typeorm" },
    }).forEach((path) => {
        path.node.specifiers?.forEach((spec) => {
            if (
                spec.type === "ImportSpecifier" &&
                spec.imported.type === "Identifier"
            ) {
                const oldImported = spec.imported.name
                if (typeRenames[oldImported]) {
                    const localName =
                        spec.local?.type === "Identifier"
                            ? spec.local.name
                            : oldImported
                    localRenames.set(localName, typeRenames[oldImported])

                    // Rename the import specifier itself
                    spec.imported.name = typeRenames[oldImported]
                    if (
                        spec.local?.type === "Identifier" &&
                        spec.local.name === localName
                    ) {
                        spec.local.name = typeRenames[oldImported]
                    }
                    hasChanges = true
                }
            }
        })
    })

    // Rename only identifiers that were imported from "typeorm"
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

    // Collect variable names known to be Connection/DataSource instances
    const connectionTypeNames = new Set(Object.keys(typeRenames))
    connectionTypeNames.add("DataSource")
    const connectionVarNames = new Set<string>()

    // Variables assigned from new Connection(...) / new DataSource(...)
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

    // Variables and parameters with Connection/DataSource type annotations
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

    // Collect variable/param names typed as TypeORM types with .connection
    const connectionPropVarNames = new Set<string>()

    const collectTypedIdentifier = (id: Identifier) => {
        if (!id.name || !id.typeAnnotation) return
        if (id.typeAnnotation.type !== "TSTypeAnnotation") return

        const ann = id.typeAnnotation
        if (ann.typeAnnotation.type !== "TSTypeReference") return

        const ref = ann.typeAnnotation
        if (
            ref.typeName.type === "Identifier" &&
            typesWithConnectionProp.has(ref.typeName.name)
        ) {
            connectionPropVarNames.add(id.name)
        }
    }

    // Variable declarations with type annotations
    root.find(j.VariableDeclarator).forEach((path) => {
        if (isIdentifier(path.node.id)) collectTypedIdentifier(path.node.id)
    })

    // Function/method/arrow parameters and constructor parameter properties
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

    root.find(j.VariableDeclarator).forEach((path) => {
        if (path.node.id.type !== "Identifier") return
        const init = path.node.init
        if (!init) return

        // `const X = dataSourceVar.manager`
        if (init.type === "MemberExpression") {
            const baseName = unwrapIdentifierName(init.object)
            if (
                baseName &&
                connectionVarNames.has(baseName) &&
                init.property.type === "Identifier"
            ) {
                const typeName = dataSourceMemberAccessors[init.property.name]
                if (typeName && typesWithConnectionProp.has(typeName)) {
                    connectionPropVarNames.add(path.node.id.name)
                }
            }
            return
        }

        // `const X = dataSourceVar.getRepository(Y)`
        if (
            init.type === "CallExpression" &&
            init.callee.type === "MemberExpression" &&
            init.callee.property.type === "Identifier"
        ) {
            const baseName = unwrapIdentifierName(init.callee.object)
            if (baseName && connectionVarNames.has(baseName)) {
                const typeName =
                    dataSourceCallAccessors[init.callee.property.name]
                if (typeName && typesWithConnectionProp.has(typeName)) {
                    connectionPropVarNames.add(path.node.id.name)
                }
            }
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

    // Rename .connection → .dataSource on known TypeORM instances
    root.find(j.MemberExpression, {
        property: { name: "connection" },
    }).forEach((path) => {
        if (path.node.property.type === "Identifier") {
            const objName = unwrapIdentifierName(path.node.object)
            if (objName && connectionPropVarNames.has(objName)) {
                path.node.property.name = "dataSource"
                hasChanges = true
            }
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = connectionToDataSource
export default fn

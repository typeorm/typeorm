import path from "node:path"
import type { API, FileInfo, Identifier } from "jscodeshift"
import { forEachIdentifierParam, isIdentifier } from "../ast-helpers"

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

    // Variables with Connection/DataSource type annotations
    root.find(j.VariableDeclarator).forEach((path) => {
        const id = path.node.id
        if (
            id.type === "Identifier" &&
            id.typeAnnotation?.type === "TSTypeAnnotation"
        ) {
            const ann = id.typeAnnotation.typeAnnotation
            if (
                ann.type === "TSTypeReference" &&
                ann.typeName.type === "Identifier" &&
                connectionTypeNames.has(ann.typeName.name)
            ) {
                connectionVarNames.add(id.name)
            }
        }
    })

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
                const obj = path.node.callee.object
                if (
                    obj.type === "Identifier" &&
                    connectionVarNames.has(obj.name)
                ) {
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

    // Rename .isConnected → .isInitialized on Connection/DataSource instances
    root.find(j.MemberExpression, {
        property: { name: "isConnected" },
    }).forEach((path) => {
        if (path.node.property.type === "Identifier") {
            const obj = path.node.object
            if (obj.type === "Identifier" && connectionVarNames.has(obj.name)) {
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
            const obj = path.node.object
            if (
                obj.type === "Identifier" &&
                connectionPropVarNames.has(obj.name)
            ) {
                path.node.property.name = "dataSource"
                hasChanges = true
            }
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = connectionToDataSource
export default fn

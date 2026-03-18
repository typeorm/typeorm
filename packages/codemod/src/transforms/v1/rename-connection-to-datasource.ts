import type { API, FileInfo } from "jscodeshift"

export const description = "migrate from `Connection` to `DataSource`"

export const renameConnectionToDataSource = (file: FileInfo, api: API) => {
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

    // Property renames
    const propertyRenames: Record<string, string> = {
        isConnected: "isInitialized",
    }

    // Rename imports from "typeorm"
    root.find(j.ImportDeclaration, {
        source: { value: "typeorm" },
    }).forEach((path) => {
        path.node.specifiers?.forEach((spec) => {
            if (
                spec.type === "ImportSpecifier" &&
                spec.imported.type === "Identifier"
            ) {
                const oldName = spec.imported.name
                if (typeRenames[oldName]) {
                    spec.imported.name = typeRenames[oldName]
                    if (
                        spec.local?.type === "Identifier" &&
                        spec.local.name === oldName
                    ) {
                        spec.local.name = typeRenames[oldName]
                    }
                    hasChanges = true
                }
            }
        })
    })

    // Rename type references
    for (const [oldName, newName] of Object.entries(typeRenames)) {
        root.find(j.Identifier, { name: oldName }).forEach((path) => {
            // Skip import specifiers (already handled)
            if (
                path.parent.node.type === "ImportSpecifier" ||
                path.parent.node.type === "ImportDefaultSpecifier"
            ) {
                return
            }
            path.node.name = newName
            hasChanges = true
        })

        // Also rename TSTypeReference
        root.find(j.TSTypeReference, {
            typeName: { name: oldName },
        }).forEach((path) => {
            if (path.node.typeName.type === "Identifier") {
                path.node.typeName.name = newName
                hasChanges = true
            }
        })
    }

    // Rename method calls: .connect() → .initialize(), .close() → .destroy()
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
                path.node.callee.property.name = newMethod
                hasChanges = true
            }
        })
    }

    // Rename property access: .isConnected → .isInitialized
    for (const [oldProp, newProp] of Object.entries(propertyRenames)) {
        root.find(j.MemberExpression, {
            property: { name: oldProp },
        }).forEach((path) => {
            if (path.node.property.type === "Identifier") {
                path.node.property.name = newProp
                hasChanges = true
            }
        })
    }

    return hasChanges ? root.toSource() : undefined
}

export default renameConnectionToDataSource

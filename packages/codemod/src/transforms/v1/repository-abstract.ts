import type { API, FileInfo } from "jscodeshift"
import { addTodoComment, reportTodo } from "../todo"

export const description =
    "replace removed `@EntityRepository` and `AbstractRepository` with TODO"
export const manual = true

export const repositoryAbstract = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    // Find @EntityRepository decorators and add TODO
    root.find(j.Decorator, {
        expression: {
            type: "CallExpression",
            callee: { type: "Identifier", name: "EntityRepository" },
        },
    }).forEach((path) => {
        addTodoComment(
            path.node,
            "`@EntityRepository` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1",
            j,
        )
        hasChanges = true
        hasTodos = true
    })

    // Find classes extending AbstractRepository and add TODO
    root.find(j.ClassDeclaration).forEach((path) => {
        const superClass = path.node.superClass
        if (!superClass) return

        let name: string | null = null
        if (superClass.type === "Identifier") {
            name = superClass.name
        } else if (
            superClass.type === "MemberExpression" &&
            superClass.property.type === "Identifier"
        ) {
            name = superClass.property.name
        }

        if (name !== "AbstractRepository") return

        addTodoComment(
            path.node,
            "`AbstractRepository` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1",
            j,
        )
        hasChanges = true
        hasTodos = true
    })

    // Find getCustomRepository() calls and add TODO
    const addGetCustomRepoTodo = (path: any) => {
        const message =
            "`getCustomRepository()` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1"
        const parent = path.parent
        if (parent.node.type === "ExpressionStatement") {
            addTodoComment(parent.node, message, j)
        } else {
            addTodoComment(path.node, message, j)
        }
        hasChanges = true
        hasTodos = true
    }

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "getCustomRepository" },
        },
    }).forEach(addGetCustomRepoTodo)

    // Also find standalone getCustomRepository() calls
    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "getCustomRepository" },
    }).forEach(addGetCustomRepoTodo)

    // Remove imports
    const removedImports = new Set(["EntityRepository", "AbstractRepository"])

    root.find(j.ImportDeclaration, {
        source: { value: "typeorm" },
    }).forEach((importPath) => {
        const remaining = importPath.node.specifiers?.filter((spec) => {
            if (
                spec.type === "ImportSpecifier" &&
                spec.imported.type === "Identifier"
            ) {
                if (removedImports.has(spec.imported.name)) {
                    hasChanges = true
                    return false
                }
            }
            return true
        })

        if (remaining?.length === 0) {
            j(importPath).remove()
        } else if (remaining) {
            importPath.node.specifiers = remaining
        }
    })

    if (hasTodos) reportTodo("remove-abstract-repository", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default repositoryAbstract

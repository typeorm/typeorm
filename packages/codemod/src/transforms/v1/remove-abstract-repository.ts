import type { API, FileInfo } from "jscodeshift"
import { reportTodo } from "../todo"

export const description =
    "replace removed `@EntityRepository` and `AbstractRepository` with TODO"
export const manual = true

const addTodoComment = (node: any, comment: any) => {
    const comments = ((node as any).comments ??= [])
    comments.push(comment)
    comment.leading = true
}

export const removeAbstractRepository = (file: FileInfo, api: API) => {
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
        const comment = j.commentLine(
            " TODO: `@EntityRepository` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1",
        )
        addTodoComment(path.node, comment)
        hasChanges = true
        hasTodos = true
    })

    // Find classes extending AbstractRepository and add TODO
    root.find(j.ClassDeclaration).forEach((path) => {
        const superClass = path.node.superClass
        if (!superClass) return

        const isMemberExpr =
            superClass.type === "MemberExpression" &&
            superClass.property.type === "Identifier"
        const name =
            superClass.type === "Identifier"
                ? superClass.name
                : isMemberExpr
                  ? (superClass as any).property.name
                  : null

        if (name !== "AbstractRepository") return

        const comment = j.commentLine(
            " TODO: `AbstractRepository` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1",
        )
        addTodoComment(path.node, comment)
        hasChanges = true
        hasTodos = true
    })

    // Find getCustomRepository() calls and add TODO
    const addGetCustomRepoTodo = (path: any) => {
        const comment = j.commentLine(
            " TODO: `getCustomRepository()` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1",
        )
        const parent = path.parent
        if (parent.node.type === "ExpressionStatement") {
            addTodoComment(parent.node, comment)
        } else {
            addTodoComment(path.node, comment)
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

export default removeAbstractRepository

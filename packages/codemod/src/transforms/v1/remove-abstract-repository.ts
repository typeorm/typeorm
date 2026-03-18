import type { API, FileInfo } from "jscodeshift"
import { reportTodo } from "../todo"

export const description =
    "replace removed `@EntityRepository` and `AbstractRepository` with TODO"
export const manual = true

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
        ;(path.node as any).comments = (path.node as any).comments || []
        ;(path.node as any).comments.push(comment)
        comment.leading = true
        hasChanges = true
        hasTodos = true
    })

    // Find classes extending AbstractRepository and add TODO
    root.find(j.ClassDeclaration).forEach((path) => {
        const superClass = path.node.superClass
        if (!superClass) return

        const name =
            superClass.type === "Identifier"
                ? superClass.name
                : superClass.type === "MemberExpression" &&
                    superClass.property.type === "Identifier"
                  ? superClass.property.name
                  : null

        if (name !== "AbstractRepository") return

        const comment = j.commentLine(
            " TODO: `AbstractRepository` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1",
        )
        ;(path.node as any).comments = (path.node as any).comments || []
        ;(path.node as any).comments.push(comment)
        comment.leading = true
        hasChanges = true
        hasTodos = true
    })

    // Find getCustomRepository() calls and add TODO
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "getCustomRepository" },
        },
    }).forEach((path) => {
        const parent = path.parent
        if (parent.node.type === "ExpressionStatement") {
            const comment = j.commentLine(
                " TODO: `getCustomRepository()` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1",
            )
            parent.node.comments = parent.node.comments || []
            parent.node.comments.push(comment)
            comment.leading = true
        } else {
            const comment = j.commentLine(
                " TODO: `getCustomRepository()` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1",
            )
            ;(path.node as any).comments = (path.node as any).comments || []
            ;(path.node as any).comments.push(comment)
            comment.leading = true
        }
        hasChanges = true
        hasTodos = true
    })

    // Also find standalone getCustomRepository() calls
    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "getCustomRepository" },
    }).forEach((path) => {
        const parent = path.parent
        if (parent.node.type === "ExpressionStatement") {
            const comment = j.commentLine(
                " TODO: `getCustomRepository()` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1",
            )
            parent.node.comments = parent.node.comments || []
            parent.node.comments.push(comment)
            comment.leading = true
        } else {
            const comment = j.commentLine(
                " TODO: `getCustomRepository()` was removed in TypeORM v1. Use a custom service class with `dataSource.getRepository()`. See migration guide: https://typeorm.io/docs/guides/migration-v1",
            )
            ;(path.node as any).comments = (path.node as any).comments || []
            ;(path.node as any).comments.push(comment)
            comment.leading = true
        }
        hasChanges = true
        hasTodos = true
    })

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

        if (remaining && remaining.length === 0) {
            j(importPath).remove()
        } else if (remaining) {
            importPath.node.specifiers = remaining
        }
    })

    if (hasTodos) reportTodo("remove-abstract-repository", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default removeAbstractRepository

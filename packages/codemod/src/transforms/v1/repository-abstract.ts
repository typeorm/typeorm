import path from "node:path"
import type { API, ASTPath, FileInfo, Node } from "jscodeshift"
import { removeImportSpecifiers } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `@EntityRepository` and `AbstractRepository` for manual migration"
export const manual = true

const entityRepositoryMessage =
    "`@EntityRepository` was removed — use a custom service class with `dataSource.getRepository()`"
const abstractRepositoryMessage =
    "`AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`"
const getCustomRepositoryMessage =
    "`getCustomRepository()` was removed — use a custom service class with `dataSource.getRepository()`"

export const repositoryAbstract = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    const annotate = (
        node: Parameters<typeof addTodoComment>[0],
        message: string,
    ) => {
        if (hasTodoComment(node, message)) return
        addTodoComment(node, message, j)
        hasTodos = true
    }

    // Find @EntityRepository decorators and add TODO
    root.find(j.Decorator, {
        expression: {
            type: "CallExpression",
            callee: { type: "Identifier", name: "EntityRepository" },
        },
    }).forEach((path) => {
        annotate(path.node, entityRepositoryMessage)
        hasChanges = true
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

        annotate(path.node, abstractRepositoryMessage)
        hasChanges = true
    })

    // Find getCustomRepository() calls and add TODO
    const addGetCustomRepoTodo = (path: ASTPath) => {
        const parentNode: Node = path.parent.node
        const target =
            parentNode.type === "ExpressionStatement" ? parentNode : path.node
        annotate(target, getCustomRepositoryMessage)
        hasChanges = true
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
    if (
        removeImportSpecifiers(
            root,
            j,
            "typeorm",
            new Set(["EntityRepository", "AbstractRepository"]),
        )
    ) {
        hasChanges = true
    }

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = repositoryAbstract
export default fn

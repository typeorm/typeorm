import path from "node:path"
import type {
    API,
    ASTPath,
    Decorator,
    FileInfo,
    MemberExpression,
    Node,
} from "jscodeshift"
import {
    fileImportsFrom,
    getLocalNamesForImport,
    getNamespaceLocalNames,
    removeImportSpecifiers,
    removeReExportSpecifiers,
} from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `@EntityRepository` and `AbstractRepository` for manual migration"
export const manual = true

export const repositoryAbstract = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    // Resolve alias-aware local names so aliased imports like
    // `import { getCustomRepository as gcr } from "typeorm"` still get
    // their call-sites flagged before the import is removed.
    const entityRepositoryNames = getLocalNamesForImport(
        root,
        j,
        "typeorm",
        "EntityRepository",
    )
    const abstractRepositoryNames = getLocalNamesForImport(
        root,
        j,
        "typeorm",
        "AbstractRepository",
    )
    const getCustomRepositoryNames = getLocalNamesForImport(
        root,
        j,
        "typeorm",
        "getCustomRepository",
    )

    // Namespace bindings for `import * as typeorm from "typeorm"` and the
    // matching CommonJS form — used below to match `typeorm.AbstractRepository`
    // / `typeorm.EntityRepository` / `typeorm.getCustomRepository` references.
    const typeormNamespaces = getNamespaceLocalNames(root, j, "typeorm")

    const isTypeormNamespaceMember = (
        expr: Node,
        memberName: string,
    ): boolean => {
        if (expr.type !== "MemberExpression") return false
        const member = expr as MemberExpression
        return (
            member.object.type === "Identifier" &&
            typeormNamespaces.has(member.object.name) &&
            member.property.type === "Identifier" &&
            member.property.name === memberName
        )
    }

    // Find @EntityRepository decorators (including aliased names and
    // `@typeorm.EntityRepository()` namespace-access form)
    root.find(j.ClassDeclaration)
        .filter((classPath) => {
            const decorators = (classPath.node as { decorators?: Decorator[] })
                .decorators
            if (!decorators) return false

            for (const decorator of decorators) {
                const expr = decorator.expression
                if (expr.type !== "CallExpression") continue
                if (
                    expr.callee.type === "Identifier" &&
                    entityRepositoryNames.has(expr.callee.name)
                ) {
                    return true
                }
                if (isTypeormNamespaceMember(expr.callee, "EntityRepository")) {
                    return true
                }
            }
            return false
        })
        .forEach((classPath) => {
            addTodoComment(
                classPath.node,
                "`@EntityRepository` was removed — use a custom service class with `dataSource.getRepository()`",
                j,
            )
            hasChanges = true
            hasTodos = true
        })

    // Find classes extending AbstractRepository — covers:
    //   class X extends AbstractRepository {}           (named/aliased import)
    //   class X extends typeorm.AbstractRepository {}   (namespace import)
    root.find(j.ClassDeclaration).forEach((classPath) => {
        const superClass = classPath.node.superClass
        if (!superClass) return

        const matches =
            (superClass.type === "Identifier" &&
                abstractRepositoryNames.has(superClass.name)) ||
            isTypeormNamespaceMember(superClass, "AbstractRepository")

        if (!matches) return

        addTodoComment(
            classPath.node,
            "`AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`",
            j,
        )
        hasChanges = true
        hasTodos = true
    })

    const addGetCustomRepoTodo = (callPath: ASTPath) => {
        const message =
            "`getCustomRepository()` was removed — use a custom service class with `dataSource.getRepository()`"
        const parentNode: Node = callPath.parent.node
        if (parentNode.type === "ExpressionStatement") {
            addTodoComment(parentNode, message, j)
        } else {
            addTodoComment(callPath.node, message, j)
        }
        hasChanges = true
        hasTodos = true
    }

    // Member-expression form: `something.getCustomRepository(...)` — not
    // alias-dependent, matches property name directly. This also covers the
    // namespace-access form `typeorm.getCustomRepository(...)` since the
    // property name is the same.
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "getCustomRepository" },
        },
    }).forEach(addGetCustomRepoTodo)

    // Standalone form: `getCustomRepository(...)` — also handles aliased
    // imports by looking up local names against the import scan.
    root.find(j.CallExpression)
        .filter((callPath) => {
            const callee = callPath.node.callee
            return (
                callee.type === "Identifier" &&
                getCustomRepositoryNames.has(callee.name)
            )
        })
        .forEach(addGetCustomRepoTodo)

    // Remove imports and re-exports of removed symbols
    const removed = new Set([
        "EntityRepository",
        "AbstractRepository",
        "getCustomRepository",
    ])
    if (removeImportSpecifiers(root, j, "typeorm", removed)) {
        hasChanges = true
    }
    if (removeReExportSpecifiers(root, j, "typeorm", removed)) {
        hasChanges = true
    }

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = repositoryAbstract
export default fn

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
import { addTodoComment, hasTodoComment } from "../todo"
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

    // Track which symbols were successfully flagged; we only strip imports
    // for symbols whose usages got a comment — dropping an import while a
    // type reference or conditional use survives would leave the user with
    // a dangling reference and no signal.
    const flaggedSymbols = new Set<string>()

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
            const message =
                "`@EntityRepository` was removed — use a custom service class with `dataSource.getRepository()`"
            if (!hasTodoComment(classPath.node, message)) {
                addTodoComment(classPath.node, message, j)
            }
            hasChanges = true
            hasTodos = true
            flaggedSymbols.add("EntityRepository")
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

        const message =
            "`AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`"
        if (!hasTodoComment(classPath.node, message)) {
            addTodoComment(classPath.node, message, j)
        }
        hasChanges = true
        hasTodos = true
        flaggedSymbols.add("AbstractRepository")
    })

    // TS type-reference usages (e.g. `extends AbstractRepository<User>` in
    // a generic signature, or `T extends EntityRepository`). Without this,
    // a file that only uses the symbol as a type would have its import
    // silently stripped and be left with a dangling reference.
    const flagTypeReference = (
        names: ReadonlySet<string>,
        symbolName: string,
        message: string,
    ): void => {
        root.find(j.TSTypeReference)
            .filter((p) => {
                const typeName = p.node.typeName
                return (
                    typeName.type === "Identifier" &&
                    names.has((typeName as { name: string }).name)
                )
            })
            .forEach((p) => {
                let current = p.parent
                while (current) {
                    const node: Node = current.node
                    if (
                        node.type.endsWith("Statement") ||
                        node.type === "VariableDeclaration" ||
                        node.type === "ClassDeclaration" ||
                        node.type === "ClassExpression" ||
                        node.type === "ExportDefaultDeclaration" ||
                        node.type === "ExportNamedDeclaration"
                    ) {
                        if (!hasTodoComment(node, message)) {
                            addTodoComment(node, message, j)
                        }
                        hasChanges = true
                        hasTodos = true
                        flaggedSymbols.add(symbolName)
                        return
                    }
                    current = current.parent
                }
            })
    }
    flagTypeReference(
        entityRepositoryNames,
        "EntityRepository",
        "`@EntityRepository` was removed — use a custom service class with `dataSource.getRepository()`",
    )
    flagTypeReference(
        abstractRepositoryNames,
        "AbstractRepository",
        "`AbstractRepository` was removed — use a custom service class with `dataSource.getRepository()`",
    )

    const addGetCustomRepoTodo = (callPath: ASTPath) => {
        const message =
            "`getCustomRepository()` was removed — use a custom service class with `dataSource.getRepository()`"
        // Walk up to the enclosing statement — comments attached to a bare
        // `CallExpression` are commonly dropped by recast during printing.
        let current: { node: Node; parent: unknown } | null = callPath as {
            node: Node
            parent: unknown
        }
        let host: Node | null = null
        while (current) {
            const t = current.node.type
            if (t.endsWith("Statement") || t === "VariableDeclaration") {
                host = current.node
                break
            }
            current = current.parent as { node: Node; parent: unknown } | null
        }
        if (!host) return
        if (!hasTodoComment(host, message)) {
            addTodoComment(host, message, j)
        }
        hasChanges = true
        hasTodos = true
        flaggedSymbols.add("getCustomRepository")
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

    // Only strip imports/re-exports of symbols whose usages we successfully
    // flagged. A surviving reference (e.g. inside a conditional type or a
    // generic signature we didn't walk) + missing import = silently broken
    // file. Re-exports are always safe to strip since no runtime usage
    // depends on them.
    if (flaggedSymbols.size > 0) {
        if (removeImportSpecifiers(root, j, "typeorm", flaggedSymbols)) {
            hasChanges = true
        }
    }
    if (
        removeReExportSpecifiers(
            root,
            j,
            "typeorm",
            new Set([
                "EntityRepository",
                "AbstractRepository",
                "getCustomRepository",
            ]),
        )
    ) {
        hasChanges = true
    }

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = repositoryAbstract
export default fn

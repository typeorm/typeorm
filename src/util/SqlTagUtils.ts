import { Driver } from "../driver/Driver"

export function buildSqlTag(params: {
    driver: Driver
    strings: TemplateStringsArray
    expressions: unknown[]
}): { query: string; variables: unknown[] } {
    let query = ""
    const variables: unknown[] = []

    for (const [idx, expression] of params.expressions.entries()) {
        query += params.strings[idx]

        if (expression === null) {
            query += "NULL"
            continue
        }

        if (
            ["sqlite", "better-sqlite3", "mysql"].includes(
                params.driver.options.type,
            ) &&
            Array.isArray(expression)
        ) {
            if (expression.length === 0) {
                query += "NULL"
                continue
            }

            const arrayParams = expression.map((_, arrayIdx) => {
                return params.driver.createParameter(
                    `param_${idx}_${arrayIdx}`,
                    arrayIdx,
                )
            })
            query += arrayParams.join(", ")
            variables.push(...expression)
            continue
        }

        query += params.driver.createParameter("param", idx)

        variables.push(expression)
    }

    query += params.strings[params.strings.length - 1]

    return { query, variables }
}

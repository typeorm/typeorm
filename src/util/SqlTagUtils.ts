import { Driver } from "../driver/Driver"
import dedent from "dedent"

interface BuildSqlTagParams {
    driver: Driver
    strings: TemplateStringsArray
    expressions: unknown[]
}

export function buildSqlTag({
    driver,
    strings,
    expressions,
}: BuildSqlTagParams): { query: string; parameters: unknown[] } {
    let query = ""
    const parameters: unknown[] = []
    let idx = 0

    for (const [expressionIdx, expression] of expressions.entries()) {
        query += strings[expressionIdx]

        if (expression === null) {
            query += "NULL"
            continue
        }

        if (typeof expression === "function") {
            const value = expression()

            if (typeof value === "string") {
                query += value
                continue
            }

            if (Array.isArray(value)) {
                const arrayParams = value.map(() => {
                    return driver.createParameter(`param_${idx + 1}`, idx++)
                })

                query += arrayParams.join(", ")
                parameters.push(...value)

                continue
            }

            throw new Error(
                `Only array and strings are supported as function arguments. Got ${typeof value} instead.`,
            )
        }

        query += driver.createParameter(`param_${idx + 1}`, idx++)

        parameters.push(expression)
    }

    query += strings[strings.length - 1]

    query = dedent(query)

    return { query, parameters }
}

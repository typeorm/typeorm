import { Driver } from "../driver/Driver"

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

    const serializeParameter =
        driver.serializeParameter ?? defaultSerializeParameter

    for (const [expressionIdx, expression] of expressions.entries()) {
        query += strings[expressionIdx]

        if (expression === null) {
            query += "NULL"
            continue
        }

        if (Array.isArray(expression)) {
            if (expression.length === 0) {
                query += "NULL"
                continue
            }

            const arrayParams = expression.map(() => {
                return driver.createParameter(`param_${idx + 1}`, idx++)
            })

            query += arrayParams.join(", ")
            parameters.push(...expression.map((e) => serializeParameter(e)))

            continue
        }

        query += driver.createParameter(`param_${idx + 1}`, idx++)

        parameters.push(serializeParameter(expression))
    }

    query += strings[strings.length - 1]

    return { query, parameters }
}

function defaultSerializeParameter(expression: unknown) {
    if (typeof expression === "function") {
        return expression()
    }

    return expression
}

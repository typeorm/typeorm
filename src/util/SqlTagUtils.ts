import { DatabaseType } from "../driver/types/DatabaseType"
import { TypeORMError } from "../error"

export class SqlTagUtils {
    static buildSqlTag(params: {
        databaseType: DatabaseType
        strings: TemplateStringsArray
        expressions: unknown[]
    }): { query: string; variables: unknown[] } {
        let idx = 0
        let query = ""
        const variables: unknown[] = []
        const parameterStrategy = this.getParameterStrategy(params.databaseType)

        for (const expression of params.expressions) {
            query += params.strings[idx]

            switch (parameterStrategy) {
                case "dollar":
                    query += "$" + ++idx
                    break
                case "at":
                    query += "@" + ++idx
                    break
                case "colon":
                    query += ":" + ++idx
                    break
                case "question-mark":
                    query += "?"
                    break
                case "unknown":
                    throw new TypeORMError(
                        `This database engine does not support parameters`,
                    )
            }

            variables.push(expression)
        }

        query += params.strings[idx]

        return { query, variables }
    }

    static getParameterStrategy(
        databaseType: DatabaseType,
    ): "dollar" | "question-mark" | "colon" | "at" | "unknown" {
        switch (databaseType) {
            case "postgres":
            case "cockroachdb":
            case "aurora-postgres":
            case "mariadb":
                return "dollar"
            case "mysql":
            case "sqlite":
            case "aurora-mysql":
                return "question-mark"
            case "oracle":
                return "colon"
            case "mssql":
                return "at"
            default:
                return "unknown"
        }
    }
}

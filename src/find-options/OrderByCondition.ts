/**
 * Special object that defines order condition for ORDER BY in sql.
 *
 * @example
 * {
 *  "name": "ASC",
 *  "id": "DESC"
 * }
 *
 */
export type OrderByCondition = {
    [columnName: string]:
        | ("ASC" | "DESC")
        | {
              order: "ASC" | "DESC"
              nulls?: "NULLS FIRST" | "NULLS LAST"
          }
}

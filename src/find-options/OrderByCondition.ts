/**
 * Special object that defines order condition for ORDER BY in sql.
 *
 * Example:
 * {
 *  "name": "ASC",
 *  "id": "DESC"
 * }
 */
export type OrderByCondition = {
    [columnName: string]: "ASC"|"DESC"
};

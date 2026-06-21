/**
 * List of types that FindOperator can be.
 */
export type FindOperatorType =
    | "not"
    | "lessThan"
    | "lessThanOrEqual"
    | "moreThan"
    | "moreThanOrEqual"
    | "equal"
    | "between"
    | "in"
    | "any"
    | "isNull"
    | "ilike"
    | "like"
    | "regexp"
    | "raw"
    | "arrayContains"
    | "arrayContainedBy"
    | "arrayOverlap"
    | "and"
    | "jsonContains"
    | "or"

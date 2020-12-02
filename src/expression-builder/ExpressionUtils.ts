import { BuildableExpression } from "./Expression";

export function isExpressionLiteral(expression: any): boolean {
    if (expression === null) return true;
    if (expression instanceof BuildableExpression) return false;
    if (typeof expression in ["boolean", "number", "string", "bigint"]) return true;
    if (Array.isArray(expression)) return true;
    if (expression instanceof Date) return true;
    if (expression instanceof Uint8Array) return true;
    return false;
}

export function isPlainObjectConditions(object: any): object is object {
    if (object === null) return false;
    if (typeof object !== "object") return false;
    if (Array.isArray(object)) return false;
    if (object instanceof BuildableExpression) return false;
    if (object instanceof Date) return false;
    return true;
}

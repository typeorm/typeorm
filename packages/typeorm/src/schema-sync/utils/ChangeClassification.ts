export enum ChangeClassification {
    WIDEN = 'WIDEN',
    NARROW = 'NARROW',
    INCOMPATIBLE = 'INCOMPATIBLE',
    NO_CHANGE = 'NO_CHANGE'
}

export interface ColumnDefinition {
    type: string;
    length?: number;
    precision?: number;
    scale?: number;
}

export function isSafeAlter(oldCol: ColumnDefinition, newCol: ColumnDefinition): ChangeClassification {
    if (oldCol.type === newCol.type) {
        if (oldCol.length && newCol.length) {
            if (newCol.length > oldCol.length) return ChangeClassification.WIDEN;
            if (newCol.length < oldCol.length) return ChangeClassification.NARROW;
        }
        return ChangeClassification.NO_CHANGE;
    }

    const widenMap: Record<string, string[]> = {
        'int': ['bigint', 'decimal', 'numeric'],
        'smallint': ['int', 'bigint', 'decimal'],
        'varchar': ['text', 'longtext'],
    };

    if (widenMap[oldCol.type]?.includes(newCol.type)) {
        return ChangeClassification.WIDEN;
    }

    return ChangeClassification.INCOMPATIBLE;
}

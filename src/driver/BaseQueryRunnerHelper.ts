export enum AlterSafety {
    WIDENING,
    SHRINKING,
    INCOMPATIBLE
}

export abstract class BaseQueryRunnerHelper {
    protected static isSafeAlter(oldColumn: any, newColumn: any): AlterSafety {
        if (oldColumn.type !== newColumn.type) {
            return AlterSafety.INCOMPATIBLE;
        }

        if (oldColumn.length && newColumn.length) {
            if (newColumn.length > oldColumn.length) return AlterSafety.WIDENING;
            if (newColumn.length < oldColumn.length) return AlterSafety.SHRINKING;
        }

        if (oldColumn.precision && newColumn.precision) {
            if (newColumn.precision > oldColumn.precision) return AlterSafety.WIDENING;
            if (newColumn.precision < oldColumn.precision) return AlterSafety.SHRINKING;
        }

        return AlterSafety.WIDENING;
    }
}

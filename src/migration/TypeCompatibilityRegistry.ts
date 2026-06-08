export enum TransitionClass {
    WIDEN = 'WIDEN',
    NARROW = 'NARROW',
    INCOMPATIBLE = 'INCOMPATIBLE',
}

export class TypeCompatibilityRegistry {
    private static readonly MATRIX: Record<string, Record<string, TransitionClass>> = {
        'varchar': {
            'varchar': TransitionClass.WIDEN, // Length check handled in analyze
            'text': TransitionClass.WIDEN,
            'char': TransitionClass.NARROW,
        },
        'integer': {
            'bigint': TransitionClass.WIDEN,
            'integer': TransitionClass.WIDEN,
            'smallint': TransitionClass.NARROW,
        },
        'smallint': {
            'integer': TransitionClass.WIDEN,
            'bigint': TransitionClass.WIDEN,
        },
        'bigint': {
            'bigint': TransitionClass.WIDEN,
            'integer': TransitionClass.NARROW,
        },
    };

    static getTransitionClass(fromType: string, toType: string, fromLength?: number, toLength?: number): TransitionClass {
        const baseFrom = fromType.toLowerCase();
        const baseTo = toType.toLowerCase();

        if (baseFrom === baseTo) {
            if (fromLength !== undefined && toLength !== undefined) {
                return toLength >= fromLength ? TransitionClass.WIDEN : TransitionClass.NARROW;
            }
            return TransitionClass.WIDEN;
        }

        return this.MATRIX[baseFrom]?.[baseTo] ?? TransitionClass.INCOMPATIBLE;
    }
}

import { FindOptionsWhere } from "../../find-options/FindOptionsWhere"
import {
    ConditionLoaderOptions,
    InterpretConditionAs,
} from "./ConditionLoaderOptions"

export class ConditionLoader {
    public readonly undefinedValues: InterpretConditionAs

    public readonly nullValues: InterpretConditionAs

    constructor(options: ConditionLoaderOptions) {
        this.undefinedValues = options.undefinedValues || "exclude"
        this.nullValues = options.nullValues || "is-null"
    }

    public shouldExcludeCondition(where: FindOptionsWhere<any>, key: string) {
        const value = where[key]
        return (
            (value === undefined && this.shouldExcludeUndefined()) ||
            (value === null && this.shouldExcludeNull())
        )
    }

    private shouldExcludeUndefined(): boolean {
        return this.undefinedValues === "exclude"
    }

    private shouldExcludeNull(): boolean {
        return this.nullValues === "exclude"
    }
}

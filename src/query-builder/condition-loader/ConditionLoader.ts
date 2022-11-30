import { FindOptionsWhere } from "../../find-options/FindOptionsWhere"
import {
    ConditionLoaderOptions,
    InterpretConditionAs,
} from "./ConditionLoaderOptions"
import type { EntityMetadata } from "../../metadata/EntityMetadata"
import { InvalidConditionError } from "../../error/InvalidConditionError"

export class ConditionLoader {
    public readonly undefinedValues: InterpretConditionAs

    public readonly nullValues: InterpretConditionAs

    constructor(options: ConditionLoaderOptions) {
        this.undefinedValues = options.undefinedValues || "exclude"
        this.nullValues = options.nullValues || "is-null"
    }

    public shouldExcludeCondition(
        where: FindOptionsWhere<any>,
        key: string,
        metadata: EntityMetadata,
    ): boolean {
        const value = where[key]

        if (value === null) {
            if (this.nullValues === "throw")
                throw new InvalidConditionError(key, metadata)

            return this.nullValues === "exclude"
        } else if (value === undefined) {
            if (this.undefinedValues === "throw")
                throw new InvalidConditionError(key, metadata)

            return this.undefinedValues === "exclude"
        }

        return false
    }
}

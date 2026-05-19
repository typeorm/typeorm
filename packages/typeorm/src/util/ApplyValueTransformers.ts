import type { ValueTransformer } from "../decorator/options/ValueTransformer"
import { InstanceChecker } from "./InstanceChecker"

export class ApplyValueTransformers {
    static transformFrom(
        transformer: ValueTransformer | ValueTransformer[],
        databaseValue: any,
    ) {
        if (Array.isArray(transformer)) {
            const reverseTransformers = transformer.slice().reverse()
            return reverseTransformers.reduce(
                (transformedValue, _transformer) => {
                    return _transformer.from(transformedValue)
                },
                databaseValue,
            )
        }
        return transformer.from(databaseValue)
    }
    static transformTo(
        transformer: ValueTransformer | ValueTransformer[],
        entityValue: any,
    ) {
        if (InstanceChecker.isFindOperator(entityValue)) {
            // Clone before mutating so callers reusing a shared
            // FindOperator across multiple queries are not affected by
            // repeated transformer application (#11733).
            const cloned = entityValue.clone()
            cloned.transformValue(transformer)
            return cloned
        }

        if (Array.isArray(transformer)) {
            return transformer.reduce((transformedValue, _transformer) => {
                return _transformer.to(transformedValue)
            }, entityValue)
        }
        return transformer.to(entityValue)
    }
}

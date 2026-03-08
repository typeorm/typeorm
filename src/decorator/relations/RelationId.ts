import { getMetadataArgsStorage } from "../../globals"
import type { RelationIdMetadataArgs } from "../../metadata-args/RelationIdMetadataArgs"
import type { SelectQueryBuilder } from "../../query-builder/SelectQueryBuilder"

/**
 * Special decorator used to extract relation id into separate entity property.
 * @param relation
 * @param alias
 * @param queryBuilderFactory
 * @experimental
 */
export function RelationId<T>(
    relation: string | ((object: T) => any),
    alias?: string,
    queryBuilderFactory?: (
        qb: SelectQueryBuilder<any>,
    ) => SelectQueryBuilder<any>,
): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        getMetadataArgsStorage().relationIds.push({
            target: object.constructor,
            propertyName: propertyName,
            relation: relation,
            alias: alias,
            queryBuilderFactory: queryBuilderFactory,
        } as RelationIdMetadataArgs)
    }
}

import {getMetadataArgsStorage, SelectQueryBuilder} from "../../";
import {RelationIdMetadataArgs} from "../../metadata-args/RelationIdMetadataArgs";

/**
 * Special decorator used to extract relation id into separate entity property.
 *
 * @experimental
 */
export function RelationId<T>(relation: string|((object: T) => any), alias?: string, queryBuilderFactory?: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): PropertyDecorator {
    return function (object: Object, propertyName: string) {

        getMetadataArgsStorage().relationIds.push({
            target: object.constructor,
            propertyName: propertyName,
            relation: relation,
            alias: alias,
            queryBuilderFactory: queryBuilderFactory
        } as RelationIdMetadataArgs);
    };
}

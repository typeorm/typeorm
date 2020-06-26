import { RelationIdMetadataArgs } from "../../metadata-args/RelationIdMetadataArgs";
import { getMetadataArgsStorage } from "../../metadata-args/get-metadata-args-storage";
import { SelectQueryBuilder } from '../../query-builder/QueryBuilder';

/**
 * Special decorator used to extract relation id into separate entity property.
 *
 * @experimental
 */
export function RelationId<T>(relation: string | ((object: T) => any), alias?: string, queryBuilderFactory?: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): Function {
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

import {getMetadataArgsStorage} from "../../index";
import {RelationIdMetadataArgs} from "../../metadata-args/RelationIdMetadataArgs";
import {SelectQueryBuilder} from "../../query-builder/SelectQueryBuilder";

/**
 * Special decorator used to extract relation id into separate entity property.
 */
export function RelationId<T>(relation: string|((object: T) => any), alias?: string, queryBuilderFactory?: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): Function {
    return function (object: Object, propertyName: string) {
        const args: RelationIdMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            relation: relation,
            alias: alias,
            queryBuilderFactory: queryBuilderFactory
        };
        getMetadataArgsStorage().relationIds.push(args);
    };
}


import {getMetadataArgsStorage} from "../../index";
import {RelationCountMetadataArgs} from "../../metadata-args/RelationCountMetadataArgs";
import {SelectQueryBuilder} from "../../query-builder/SelectQueryBuilder";

/**
 * Holds a number of children in the closure table of the column.
 */
export function RelationCount<T>(relation: string|((object: T) => any), alias?: string, queryBuilderFactory?: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): Function {
    return function (object: Object, propertyName: string) {
        const args: RelationCountMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            relation: relation,
            alias: alias,
            queryBuilderFactory: queryBuilderFactory
        };
        getMetadataArgsStorage().relationCounts.push(args);
    };
}


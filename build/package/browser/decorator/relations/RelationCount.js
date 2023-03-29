import { getMetadataArgsStorage } from "../../";
/**
 * Holds a number of children in the closure table of the column.
 *
 * @deprecated Do not use this decorator, it may be removed in the future versions
 */
export function RelationCount(relation, alias, queryBuilderFactory) {
    return function (object, propertyName) {
        getMetadataArgsStorage().relationCounts.push({
            target: object.constructor,
            propertyName: propertyName,
            relation: relation,
            alias: alias,
            queryBuilderFactory: queryBuilderFactory
        });
    };
}

//# sourceMappingURL=RelationCount.js.map

import { getMetadataArgsStorage } from "../../";
/**
 * Special decorator used to extract relation id into separate entity property.
 *
 * @experimental
 */
export function RelationId(relation, alias, queryBuilderFactory) {
    return function (object, propertyName) {
        getMetadataArgsStorage().relationIds.push({
            target: object.constructor,
            propertyName: propertyName,
            relation: relation,
            alias: alias,
            queryBuilderFactory: queryBuilderFactory
        });
    };
}

//# sourceMappingURL=RelationId.js.map

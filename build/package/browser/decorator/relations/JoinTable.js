import { getMetadataArgsStorage } from "../../";
/**
 * JoinTable decorator is used in many-to-many relationship to specify owner side of relationship.
 * Its also used to set a custom junction table's name, column names and referenced columns.
 */
export function JoinTable(options) {
    return function (object, propertyName) {
        options = options || {};
        getMetadataArgsStorage().joinTables.push({
            target: object.constructor,
            propertyName: propertyName,
            name: options.name,
            joinColumns: (options && options.joinColumn ? [options.joinColumn] : options.joinColumns),
            inverseJoinColumns: (options && options.inverseJoinColumn ? [options.inverseJoinColumn] : options.inverseJoinColumns),
            schema: options && options.schema ? options.schema : undefined,
            database: options && options.database ? options.database : undefined,
        });
    };
}

//# sourceMappingURL=JoinTable.js.map

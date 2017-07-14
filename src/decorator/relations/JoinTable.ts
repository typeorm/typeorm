import {getMetadataArgsStorage} from "../../index";
import {JoinTableOptions} from "../options/JoinTableOptions";
import {JoinTableMetadataArgs} from "../../metadata-args/JoinTableMetadataArgs";
import {JoinTableMultipleColumnsOptions} from "../options/JoinTableMuplipleColumnsOptions";

/**
 * JoinTable decorator is used in many-to-many relationship to specify owner side of relationship.
 * Its also used to set a custom junction table's name, column names and referenced columns.
 */
export function JoinTable(): Function;

/**
 * JoinTable decorator is used in many-to-many relationship to specify owner side of relationship.
 * Its also used to set a custom junction table's name, column names and referenced columns.
 */
export function JoinTable(options: JoinTableOptions): Function;

/**
 * JoinTable decorator is used in many-to-many relationship to specify owner side of relationship.
 * Its also used to set a custom junction table's name, column names and referenced columns.
 */
export function JoinTable(options: JoinTableMultipleColumnsOptions): Function;

/**
 * JoinTable decorator is used in many-to-many relationship to specify owner side of relationship.
 * Its also used to set a custom junction table's name, column names and referenced columns.
 */
export function JoinTable(options?: JoinTableOptions|JoinTableMultipleColumnsOptions): Function {
    return function (object: Object, propertyName: string) {
        options = options || {} as JoinTableOptions|JoinTableMultipleColumnsOptions;
        const args: JoinTableMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            name: options.name,
            joinColumns: (options && (options as JoinTableOptions).joinColumn ? [(options as JoinTableOptions).joinColumn!] : (options as JoinTableMultipleColumnsOptions).joinColumns) as any,
            inverseJoinColumns: (options && (options as JoinTableOptions).inverseJoinColumn ? [(options as JoinTableOptions).inverseJoinColumn!] : (options as JoinTableMultipleColumnsOptions).inverseJoinColumns) as any,
        };
        getMetadataArgsStorage().joinTables.push(args);
    };
}


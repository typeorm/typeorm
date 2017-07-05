import {ColumnOptions} from "../options/ColumnOptions";
import {getMetadataArgsStorage} from "../../index";
import {PrimaryColumnCannotBeNullableError} from "../../error/PrimaryColumnCannotBeNullableError";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

// todo: add overloads for PrimaryGeneratedColumn(generationType: "sequence"|"uuid" = "sequence", options?: ColumnOptions)

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 * This column creates an integer PRIMARY COLUMN with generated set to true.
 * This column creates is an alias for @PrimaryColumn("int", { generated: true }).
 */
export function PrimaryGeneratedColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {
        // const reflectedType = ColumnTypes.typeToString((Reflect as any).getMetadata("design:type", object, propertyName));

        // if column options are not given then create a new empty options
        if (!options) options = {} as ColumnOptions;

        // check if there is no type in column options then set the int type - by default for auto generated column
            options = Object.assign({type: "int"} as ColumnOptions, options);

        // check if column is not nullable, because we cannot allow a primary key to be nullable
        if (options.nullable)
            throw new PrimaryColumnCannotBeNullableError(object, propertyName);

        // implicitly set a primary and generated to column options
        options = Object.assign({ primary: true, generated: true } as ColumnOptions, options);

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            mode: "regular",
            options: options
        };
        getMetadataArgsStorage().columns.push(args);
    };
}


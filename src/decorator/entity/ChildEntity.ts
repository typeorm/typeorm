import { getMetadataArgsStorage } from "../../globals"
import { TableMetadataArgs } from "../../metadata-args/TableMetadataArgs"
import { DiscriminatorValueMetadataArgs } from "../../metadata-args/DiscriminatorValueMetadataArgs"

/**
 * Options for the @ChildEntity decorator.
 */
export interface ChildEntityOptions {
    /**
     * Discriminator value for this child entity.
     * Defaults to the class name if not specified.
     */
    discriminatorValue?: any

    /**
     * Custom table name for this child entity.
     * Only applies to CTI (Class Table Inheritance) where each child has its own table.
     * Ignored for STI (Single Table Inheritance) where all children share the parent table.
     */
    tableName?: string
}

/**
 * Special type of the table used in inherited tables.
 * Can be used for both Single Table Inheritance (STI) and Class Table Inheritance (CTI).
 *
 * @param discriminatorValueOrOptions - Either a discriminator value (string/number)
 *   or an options object with discriminatorValue and/or tableName.
 */
export function ChildEntity(
    discriminatorValueOrOptions?: any | ChildEntityOptions,
): ClassDecorator {
    return function (target: Function) {
        // Parse arguments: support both legacy discriminatorValue and new options object
        let discriminatorValue: any
        let tableName: string | undefined

        if (
            discriminatorValueOrOptions !== null &&
            discriminatorValueOrOptions !== undefined &&
            typeof discriminatorValueOrOptions === "object" &&
            ("discriminatorValue" in discriminatorValueOrOptions ||
                "tableName" in discriminatorValueOrOptions)
        ) {
            discriminatorValue =
                discriminatorValueOrOptions.discriminatorValue
            tableName = discriminatorValueOrOptions.tableName
        } else {
            discriminatorValue = discriminatorValueOrOptions
        }

        // register a table metadata
        getMetadataArgsStorage().tables.push({
            target: target,
            type: "entity-child",
            name: tableName,
        } as TableMetadataArgs)

        // register discriminator value if it was provided
        if (typeof discriminatorValue !== "undefined") {
            getMetadataArgsStorage().discriminatorValues.push({
                target: target,
                value: discriminatorValue,
            } as DiscriminatorValueMetadataArgs)
        }
    }
}

import { OrderOptions } from "./OrderOptions"
import { ColumnMetadataArgs } from "../../metadata-args/ColumnMetadataArgs"

export type OrderTarget = {
    target: object
    propertyName: string | symbol
    options: OrderOptions
}

export const metaColumns: OrderTarget[] = []
export const metaMapping: Map<string | Function, OrderTarget[]> = new Map()

/**
 * Get the priority decorated on a specific column, or 0 if no priority is set
 * @param column The column to find priority for
 */
export function getMappingPriority(column: ColumnMetadataArgs): number {
    return (
        metaMapping
            .get(column.target)
            ?.find((item) => item.propertyName === column.propertyName)?.options
            .priority ?? 0
    )
}

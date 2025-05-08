import { getMetadataArgsStorage } from "../../globals"
import {
    metaMapping,
    metaColumns,
    getMappingPriority,
    OrderTarget,
} from "./MetaStore"

/**
 * Orderable decorator is used to mark a specific class as an entity that should have its properties rearranged.
 * Any properties marked with that `@Order` decorator will be sorted based on priority.
 * Properties without an `@Order` decorator will be treated as having a priority of `0`
 */
export function Orderable(): ClassDecorator {
    return (target): void => {
        // Take all the columns registered by orderable decorators for this unit and map to their target
        metaMapping.set(
            target,
            metaColumns.map((item) => {
                return {
                    ...item,
                    target,
                }
            }),
        )

        metaColumns.splice(0, metaColumns.length)

        // Sort columns held by typeorm by their priority.
        // Columns without defined priority will be given a priority of 0
        getColumns().sort((a, b): number => {
            const aOrder: number = getMappingPriority(a)
            const bOrder: number = getMappingPriority(b)
            return aOrder - bOrder
        })

        // Try to respect before/after positioning
        metaMapping.get(target)?.forEach((item) => {
            updateColumnRelationalPositions(target, item)
        })
    }
}

/**
 * Convenience method to get metadata columns, cuts down on horizontal wrapping.
 */
function getColumns() {
    return getMetadataArgsStorage().columns
}

/**
 * Finds the column index for a table given the target and property name
 * @param target Decorator Target
 * @param targetProperty Property name
 */
function findColumnIndex(
    target: Function,
    targetProperty: string | symbol | undefined,
) {
    return getColumns().findIndex((column) => {
        return (
            column.target === target && column.propertyName === targetProperty
        )
    })
}

/**
 * Rearranges columns to respect "before" and "after" options.
 * @param target Class decorator target
 * @param item The item to position
 */
function updateColumnRelationalPositions(target: Function, item: OrderTarget) {
    if (!item.options.before && !item.options.after) {
        return
    }

    const currentIndex = findColumnIndex(target, item.propertyName)
    // Unwrap currentField from splice, we only remove a single element so our array can be safely destructured.
    const [currentField] = getColumns().splice(currentIndex, 1)
    const offsetElementName = item.options.after || item.options.before
    const offsetElementShift = item.options.after ? 1 : 0
    const offsetIndex = findColumnIndex(target, offsetElementName)

    const spliceTarget =
        offsetIndex > -1 ? offsetIndex + offsetElementShift : currentIndex
    getColumns().splice(spliceTarget, 0, currentField)
}

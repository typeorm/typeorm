import { OrderOptions } from "./OrderOptions"
import { metaColumns } from "./MetaStore"

/**
 * Order decorator is used to mark a specific class property as able to be sorted.
 * Properties may define `priority`, as well as fields to come `before` or `after`.
 * Lower is better, a column with 0 will be created in the database before a column with priority 100.
 */
export function Order(options: OrderOptions): PropertyDecorator {
    return (target: object, propertyName: string | symbol): void => {
        metaColumns.push({ target, propertyName, options })
    }
}

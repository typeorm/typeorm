import { DynamoOrder } from "./DynamoOrder"

export class DynamoSort {
    orders: DynamoOrder[]
    static UNSORTED: DynamoSort = new DynamoSort([])

    constructor(orders: DynamoOrder[]) {
        this.orders = orders
    }

    static parse(req: any) {
        if (req.query.sort) {
            let sorts = req.query.sort
            if (!Array.isArray(sorts)) {
                sorts = [sorts]
            }
            return DynamoSort.by(
                sorts.map((sort: string) => {
                    const parts = sort.split(",")
                    return parts.length > 1
                        ? DynamoOrder.by(parts[0], parts[1].toUpperCase())
                        : DynamoOrder.by(parts[0])
                }),
            )
        }
        return DynamoSort.UNSORTED
    }

    static one(property: string, direction?: string) {
        direction = direction || DynamoOrder.ASC
        return DynamoSort.by([DynamoOrder.by(property, direction)])
    }

    static by(properties: (string | DynamoOrder)[]) {
        return new DynamoSort(
            properties.map((property: string | DynamoOrder) => {
                return typeof property === "string"
                    ? DynamoOrder.by(property)
                    : property
            }),
        )
    }
}

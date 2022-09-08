export class DynamoOrder {
    static ASC = "ASC"
    static DESC = "DESC"
    static DEFAULT_DIRECTION = DynamoOrder.ASC

    direction: string
    property: string

    constructor(property: string, direction?: string) {
        this.property = property
        this.direction = direction || DynamoOrder.DEFAULT_DIRECTION
    }

    static by(property: string, direction?: string) {
        return new DynamoOrder(property, direction)
    }

    static asc(property: string) {
        return new DynamoOrder(property, DynamoOrder.ASC)
    }

    static desc(property: string) {
        return new DynamoOrder(property, DynamoOrder.DESC)
    }
}

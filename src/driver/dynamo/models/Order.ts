export class Order {
    static ASC = "ASC"
    static DESC = "DESC"
    static DEFAULT_DIRECTION = Order.ASC

    direction: string
    property: string

    constructor(property: string, direction?: string) {
        this.property = property
        this.direction = direction || Order.DEFAULT_DIRECTION
    }

    static by(property: string, direction?: string) {
        return new Order(property, direction)
    }

    static asc(property: string) {
        return new Order(property, Order.ASC)
    }

    static desc(property: string) {
        return new Order(property, Order.DESC)
    }
}

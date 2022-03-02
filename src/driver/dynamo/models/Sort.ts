import { Order } from "./Order";

export class Sort {
    orders: Order[];
    static UNSORTED: Sort = new Sort([]);

    constructor (orders: Order[]) {
        this.orders = orders;
    }

    static parse (req: any) {
        if (req.query.sort) {
            let sorts = req.query.sort;
            if (!Array.isArray(sorts)) {
                sorts = [sorts];
            }
            return Sort.by(sorts.map((sort: string) => {
                const parts = sort.split(",");
                return parts.length > 1 ? Order.by(parts[0], parts[1].toUpperCase()) : Order.by(parts[0]);
            }));
        }
        return Sort.UNSORTED;
    }

    static one (property: string, direction?: string) {
        direction = direction || Order.ASC;
        return Sort.by([Order.by(property, direction)]);
    }

    static by (properties: (string | Order)[]) {
        return new Sort(properties.map((property: string | Order) => {
            return typeof property === "string" ? Order.by(property) : property;
        }));
    }
}

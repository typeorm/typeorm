import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../../../src"

export class Dimensions {
    constructor(width: number, height: number) {
        this.width = width
        this.height = height
    }

    @Column()
    width: number

    @Column()
    height: number
}

export class Specs {
    constructor(weight: number, size: string, dimensions?: Dimensions) {
        this.weight = weight
        this.size = size
        if (dimensions) this.dimensions = dimensions
    }

    @Column()
    weight: number

    @Column()
    size: string

    @Column(() => Dimensions)
    dimensions: Dimensions
}

@Entity()
export class Product {
    constructor(name: string, label: string, price: number, specs?: Specs) {
        this.name = name
        this.label = label
        this.price = price
        if (specs) this.specs = specs
    }

    @ObjectIdColumn()
    id: ObjectId

    @Column()
    name: string

    @Column()
    label: string

    @Column()
    price: number

    @Column(() => Specs)
    specs: Specs
}

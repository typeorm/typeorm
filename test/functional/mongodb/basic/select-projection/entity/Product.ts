import { ObjectId } from "mongodb"
import { Column, Entity, ObjectIdColumn } from "../../../../../../src"

export class Specs {
    @Column()
    weight: number

    @Column()
    size: string
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

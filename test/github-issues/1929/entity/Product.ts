import { Column, Entity, ObjectID, ObjectIdColumn } from "../../../../src"

@Entity()
export class Product {
    constructor(name: string, label: string, price: number) {
        this.name = name
        this.label = label
        this.price = price
    }

    @ObjectIdColumn()
    id: ObjectID

    @Column()
    name: string

    @Column()
    label: string

    @Column()
    price: number
}

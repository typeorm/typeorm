import { Column } from "typeorm/decorator/columns/Column"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class TestCreate {
    constructor() {
        this.hasCalledConstructor = true
    }

    hasCalledConstructor = false

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    foo: string = "bar"
}

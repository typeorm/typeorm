import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    constructor(id: number, name: string) {
        this.id = id
        this.name = name
    }
}

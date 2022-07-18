import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    constructor(id: number, name: string) {
        this.id = id
        this.name = name
    }
}

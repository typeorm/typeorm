import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    constructor(id: number, title: string) {
        this.id = id
        this.title = title
    }
}

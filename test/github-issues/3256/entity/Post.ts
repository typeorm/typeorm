import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    inserted: boolean = false
    updated: boolean = false
}

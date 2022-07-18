import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    postText: string

    @Column()
    postTag: string
}

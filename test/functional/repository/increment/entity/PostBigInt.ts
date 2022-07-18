import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

@Entity()
export class PostBigInt {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @Column("bigint", {
        unsigned: true,
    })
    counter: string
}

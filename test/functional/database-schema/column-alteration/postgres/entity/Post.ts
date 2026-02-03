import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column("varchar", {
        length: 50,
    })
    title: string

    @Column("integer")
    viewCount: number

    @Column("numeric", {
        precision: 10,
        scale: 2,
        nullable: true,
    })
    price: string

    @Column("integer", {
        nullable: true,
        default: 0,
    })
    rating: number
}

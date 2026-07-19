import { Entity } from "../../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../../src/decorator/columns/Column"
import { PrimaryColumn } from "../../../../../../../src/decorator/columns/PrimaryColumn"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column({ length: 100 })
    name: string

    @Column("varchar", { length: 50 })
    text: string
}

import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "../typeorm/decorator/columns/PrimaryColumn"
import { Column } from "../typeorm/decorator/columns/Column"

@Entity()
export class PostWithoutTypes {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    bit: boolean

    @Column()
    binary: Buffer

    @Column()
    datetime: Date
}

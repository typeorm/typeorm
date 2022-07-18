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
    boolean: boolean

    @Column()
    blob: Buffer

    @Column()
    datetime: Date
}

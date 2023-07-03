import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"

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

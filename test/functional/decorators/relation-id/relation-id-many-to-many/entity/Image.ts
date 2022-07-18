import { PrimaryColumn } from "../typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { Column } from "../typeorm/decorator/columns/Column"

@Entity()
export class Image {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    isRemoved: boolean = false
}

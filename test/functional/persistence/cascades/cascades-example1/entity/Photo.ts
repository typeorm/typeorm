import { Column } from "../typeorm/decorator/columns/Column"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "../typeorm"

@Entity()
export class Photo {
    @PrimaryColumn()
    id: number

    @Column({ default: "My photo" })
    name: string
}

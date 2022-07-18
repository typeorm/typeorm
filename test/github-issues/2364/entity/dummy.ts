import { Column } from "typeorm/decorator/columns/Column"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Dummy {
    @Column({
        generated: true,
        nullable: false,
        primary: true,
    })
    id: number

    @Column({ default: "name" })
    name: string
}

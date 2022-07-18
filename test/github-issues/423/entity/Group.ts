import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Index } from "typeorm/decorator/Index"

@Index("Groups name", ["name"], { unique: true })
@Entity("groups")
export class Group {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}

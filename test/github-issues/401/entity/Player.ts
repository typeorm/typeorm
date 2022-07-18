import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Group } from "./Group"

@Entity()
export class Player {
    @PrimaryColumn()
    email: string

    @ManyToOne((type) => Group)
    group: Group
}

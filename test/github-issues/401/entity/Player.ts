import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { ManyToOne } from "../../../../src/decorator/relations/ManyToOne"
import { Group } from "./Group"

@Entity()
export class Player {
    @PrimaryColumn()
    email: string

    @ManyToOne(() => Group)
    group: Group
}

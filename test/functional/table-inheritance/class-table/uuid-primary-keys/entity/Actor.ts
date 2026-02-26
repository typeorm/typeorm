import { Column } from "../../../../../../src/decorator/columns/Column"
import { TableInheritance } from "../../../../../../src/decorator/entity/TableInheritance"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
@TableInheritance({ pattern: "CTI", column: { name: "type", type: String } })
export class Actor {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string
}

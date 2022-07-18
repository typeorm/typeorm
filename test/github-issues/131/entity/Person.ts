import { Column } from "typeorm/decorator/columns/Column"
import { TableInheritance } from "typeorm/decorator/entity/TableInheritance"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

@Entity()
@TableInheritance({ column: { name: "type", type: String } })
export class Person {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}

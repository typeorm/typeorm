import { Column } from "../../../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { TableInheritance } from "../../../../../../../src/decorator/entity/TableInheritance"

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Person {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}

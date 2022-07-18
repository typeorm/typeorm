import { Column } from "typeorm/decorator/columns/Column"
import { TableInheritance } from "typeorm/decorator/entity/TableInheritance"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity()
@TableInheritance({ column: { name: "type", type: Number } })
export class Person {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    type: number
}

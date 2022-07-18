import { Column } from "typeorm/decorator/columns/Column"
import { TableInheritance } from "typeorm/decorator/entity/TableInheritance"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

export enum PersonType {
    Employee = 1,
    Homesitter = 2,
    Student = 3,
}

@Entity("issue184_person")
@TableInheritance({ column: { name: "type", type: "int" } })
export abstract class Person {
    @PrimaryColumn()
    id: string

    @Column()
    firstName: string

    @Column()
    lastName: string

    type: PersonType
}

import { Entity, PrimaryColumn, TableInheritance } from "../../../../../../src"

@Entity()
@TableInheritance({ column: { name: "type", type: "varchar" } })
export class Human {
    @PrimaryColumn()
    id: number
}

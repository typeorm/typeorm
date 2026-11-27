import {
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
} from "../../../../src"

@Entity()
@TableInheritance({ column: { name: "type", type: "varchar" } })
export class Parent {
    @PrimaryGeneratedColumn()
    id: number
}

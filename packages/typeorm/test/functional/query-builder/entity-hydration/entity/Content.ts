import {
    Column,
    Entity,
    PrimaryColumn,
    TableInheritance,
} from "../../../../../src"

@Entity()
@TableInheritance({ column: { type: "varchar", name: "kind" } })
export class Content {
    @PrimaryColumn()
    id: number

    @Column()
    title: string
}

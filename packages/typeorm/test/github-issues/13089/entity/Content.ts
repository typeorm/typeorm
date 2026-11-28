import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
} from "../../../../src"

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export abstract class Content extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string
}

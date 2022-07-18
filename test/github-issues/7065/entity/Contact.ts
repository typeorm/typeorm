import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
} from "typeorm"

@Entity()
@TableInheritance({ column: { type: String, name: "type" } })
export class Contact {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    userId: number

    @Column()
    value: string
}

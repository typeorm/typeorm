import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Index(["firstName", "lastName"], { type: "btree" })
@Entity()
export class User4 {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string
}

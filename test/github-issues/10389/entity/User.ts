import {
    Column,
    DeleteDateColumn,
    Entity,
    PrimaryColumn,
} from "../../../../src"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    company: string

    @DeleteDateColumn()
    deletedAt: Date
}

import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    VirtualColumn,
} from "../../../../src"

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar")
    name: string

    @VirtualColumn({ query: () => `SELECT COUNT(*) FROM users` })
    randomVirtualColumn: number

    constructor(part: Partial<User>) {
        Object.assign(this, part)
    }
}

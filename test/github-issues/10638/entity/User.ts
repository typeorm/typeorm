import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    VirtualColumn,
} from "../../../../src"
import { Role } from "./Role"

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar")
    name: string

    @VirtualColumn({ query: () => `SELECT COUNT(*) FROM users` })
    randomVirtualColumn: number

    @OneToMany(_type => User, user => user.roles, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    users: User[]

    @ManyToOne(_type => Role, role => role.users)
    roles: Role

    constructor(part: Partial<User>) {
        Object.assign(this, part)
    }
}

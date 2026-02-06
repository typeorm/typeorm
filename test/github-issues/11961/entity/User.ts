import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "../../../../src"
import { UserRole } from "./UserRole"

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    username: string

    @OneToMany(() => UserRole, (userRole) => userRole.user)
    userRoles: UserRole[]
}

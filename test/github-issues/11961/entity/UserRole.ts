import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "../../../../src"
import { User } from "./User"

@Entity({ name: "user_roles" })
export class UserRole {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ name: "user_id" })
    userId: string

    @ManyToOne(() => User, (user) => user.userRoles)
    @JoinColumn({ name: "user_id" })
    user: User

    @Column()
    roleId: string
}

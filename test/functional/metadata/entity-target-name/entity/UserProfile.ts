import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    OneToMany,
    JoinColumn,
} from "../../../../../src"
import type { a as User } from "./User"
import type { ProfileComment } from "./ProfileComment"

@Entity({ name: "user_profile" })
export class a {
    static displayName = "UserProfile"

    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    bio!: string

    // One Profile belongs to one User
    @OneToOne("User", "profile", { onDelete: "CASCADE" })
    @JoinColumn()
    user!: User

    // One Profile has many ProfileComments
    @OneToMany("ProfileComment", "profile")
    comments!: ProfileComment[]
}

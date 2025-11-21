import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from "../../../../../src"
import type { a as User } from "./User"
import type { a as UserProfile } from "./UserProfile"

@Entity()
export class ProfileComment {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    body!: string

    // Many comments belong to one author (User)
    @ManyToOne("User", "authoredComments")
    author!: User

    // Many comments belong to one profile (UserProfile)
    @ManyToOne("UserProfile", "comments")
    profile!: UserProfile
}

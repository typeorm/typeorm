import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    OneToOne,
} from "../../../../../src"
import type { ProfileComment } from "./ProfileComment"
import type { a as UserProfile } from "./UserProfile"

@Entity({ name: "user", targetName: "User" })
export class a {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @Column()
    email!: string

    // One User has one Profile
    @OneToOne("UserProfile", "user")
    profile!: UserProfile

    // One User authors many ProfileComments
    @OneToMany("ProfileComment", "author")
    authoredComments!: ProfileComment[]
}

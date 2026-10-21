import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Avatar } from "./Avatar"

export class Profile {
    @ManyToOne(() => Avatar)
    avatar: Avatar

    @Column({ type: "int", nullable: true })
    avatarId: number
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column(() => Profile)
    profile: Profile

    @ManyToOne(() => Avatar)
    topAvatar: Avatar

    @Column({ type: "int", nullable: true })
    topAvatarId: number
}

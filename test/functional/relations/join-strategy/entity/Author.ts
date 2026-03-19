import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Profile } from "./Profile"

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    // nullable=false — would normally be INNER JOIN,
    // but if Author itself is LEFT-joined, this must also be LEFT
    @ManyToOne(() => Profile, { nullable: false })
    @JoinColumn()
    requiredProfile: Profile
}

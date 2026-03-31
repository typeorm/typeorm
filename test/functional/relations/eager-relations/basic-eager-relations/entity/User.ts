import {
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Profile } from "./Profile"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @OneToOne(() => Profile, { eager: true })
    @JoinColumn()
    profile: Profile

    @DeleteDateColumn()
    deletedAt?: Date

    @ManyToOne(() => Profile)
    nestedProfile: Profile
}

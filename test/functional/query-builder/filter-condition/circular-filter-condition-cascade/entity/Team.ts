import {
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { TeamMember } from "./TeamMember"
import { User } from "./User"

@Entity()
export class Team {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne(() => User, {
        eager: true,
        filterConditionCascade: true,
    })
    @JoinColumn()
    user: User

    @OneToMany(() => TeamMember, (member) => member.team, {
        filterConditionCascade: true,
    })
    teamMembers: TeamMember[]
}

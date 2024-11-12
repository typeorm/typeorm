import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../src"
import { Team } from "./Team"
import { User } from "./User"

@Entity()
export class TeamMember {
    @ManyToOne(() => Team, {
        filterConditionCascade: true,
    })
    @JoinColumn({ name: "teamId" })
    team: Team

    @ManyToOne(() => User, {
        filterConditionCascade: true,
    })
    @JoinColumn({ name: "userId" })
    user: User

    @PrimaryColumn()
    teamId: number

    @PrimaryColumn()
    userId: number
}

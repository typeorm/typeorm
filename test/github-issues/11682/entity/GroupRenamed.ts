import {
    Entity,
    PrimaryColumn,
    ManyToMany,
    Relation,
} from "../../../../src/index"
import { UserRenamed } from "./UserRenamed"

@Entity()
export class GroupRenamed {
    @PrimaryColumn()
    id: string

    @PrimaryColumn()
    tenantId: string

    @ManyToMany(() => UserRenamed, (user) => user.groups)
    users: Relation<UserRenamed[]>
}

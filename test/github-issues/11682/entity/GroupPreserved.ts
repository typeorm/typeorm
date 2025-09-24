import {
    Entity,
    PrimaryColumn,
    ManyToMany,
    Relation,
} from "../../../../src/index"
import { UserPreserved } from "./UserPreserved"

@Entity()
export class GroupPreserved {
    @PrimaryColumn()
    id: string

    @PrimaryColumn()
    tenantId: string

    @ManyToMany(() => UserPreserved, (user) => user.groups)
    users: Relation<UserPreserved[]>
}

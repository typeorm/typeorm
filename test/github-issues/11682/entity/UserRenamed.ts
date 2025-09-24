import {
    Entity,
    PrimaryColumn,
    ManyToMany,
    JoinTable,
    Relation,
} from "../../../../src/index"
import { GroupRenamed } from "./GroupRenamed"

@Entity()
export class UserRenamed {
    @PrimaryColumn()
    id: string

    @PrimaryColumn()
    tenantId: string

    @ManyToMany(() => GroupRenamed, (group) => group.users)
    @JoinTable({
        name: "user_groups",
        joinColumns: [
            { name: "tenant_id", referencedColumnName: "tenantId" },
            { name: "user_id", referencedColumnName: "id" },
        ],
        inverseJoinColumns: [
            { name: "tenant_id", referencedColumnName: "tenantId" }, // Same column needed for composite FK
            { name: "group_id", referencedColumnName: "id" },
        ],
    })
    groups: Relation<GroupRenamed[]>
}

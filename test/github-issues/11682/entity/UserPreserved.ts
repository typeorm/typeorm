import {
    Entity,
    PrimaryColumn,
    ManyToMany,
    JoinTable,
    Relation,
} from "../../../../src/index"
import { GroupPreserved } from "./GroupPreserved"

@Entity()
export class UserPreserved {
    @PrimaryColumn()
    id: string

    @PrimaryColumn()
    tenantId: string

    @ManyToMany(() => GroupPreserved, (group) => group.users)
    @JoinTable({
        name: "user_groups_shared",
        preserveSharedColumns: true, // Enable shared column preservation
        joinColumns: [
            { name: "tenant_id", referencedColumnName: "tenantId" },
            { name: "user_id", referencedColumnName: "id" },
        ],
        inverseJoinColumns: [
            { name: "tenant_id", referencedColumnName: "tenantId" }, // Same column - will be shared
            { name: "group_id", referencedColumnName: "id" },
        ],
        synchronize: false,
    })
    groups: Relation<GroupPreserved[]>
}

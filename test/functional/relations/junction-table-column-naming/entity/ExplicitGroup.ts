import {
    Entity,
    PrimaryColumn,
    ManyToMany,
    JoinTable,
    Relation,
} from "../../../../../src/index"

@Entity()
export class Group {
    @PrimaryColumn()
    id: string

    @PrimaryColumn()
    tenantId: string

    // Explicit column names - should be respected even if they create shared columns
    @ManyToMany(() => Group, (group) => group.children)
    @JoinTable({
        name: "group_parents_group_shared_tenant",
        joinColumns: [
            { name: "tenant_id", referencedColumnName: "tenantId" },
            { name: "child_id", referencedColumnName: "id" },
        ],
        inverseJoinColumns: [
            { name: "tenant_id", referencedColumnName: "tenantId" }, // Same column - should be shared
            { name: "parent_id", referencedColumnName: "id" },
        ],
        synchronize: false, // We'll create the table manually in tests
    })
    parents: Relation<Group[]>

    @ManyToMany(() => Group, (group) => group.parents)
    children: Relation<Group[]>
}

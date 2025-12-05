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

    // Fully implicit - no configuration provided at all
    @ManyToMany(() => Group, (group) => group.children)
    @JoinTable({
        name: "group_parents_group_fully_implicit",
    })
    parents: Relation<Group[]>

    @ManyToMany(() => Group, (group) => group.parents)
    children: Relation<Group[]>
}

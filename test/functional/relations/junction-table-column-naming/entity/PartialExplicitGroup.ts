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

    // Partial explicit - arrays provided but no column names specified
    @ManyToMany(() => Group, (group) => group.children)
    @JoinTable({
        name: "group_parents_group_partial_explicit",
        joinColumns: [
            { referencedColumnName: "tenantId" },
            { referencedColumnName: "id" },
        ],
        inverseJoinColumns: [
            { referencedColumnName: "tenantId" },
            { referencedColumnName: "id" },
        ],
    })
    parents: Relation<Group[]>

    @ManyToMany(() => Group, (group) => group.parents)
    children: Relation<Group[]>
}

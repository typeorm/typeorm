import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
    ViewEntity,
} from "../../../../../src"

@Entity()
@TableInheritance({ pattern: "STI", column: "type" })
export class VersionedRootEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar")
    type: string
}

// Typically here, a filtered view of versioned root entity -- for example, only latest versions
@ViewEntity({
    expression: `
        select * from versioned_root_entity;
    `,
})
export class RootEntity extends VersionedRootEntity {}
